import app, { db } from './firebase';
import { collection, doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { getStorage, ref as storageRef, getDownloadURL } from 'firebase/storage';

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export type PublicShareOptions = {
  includeImages: boolean;
  includeNotes: boolean;
  includeMood: boolean;
  includeCalendar: boolean;
  includeTrades: boolean;
  includeStats: boolean;
  expiresDays?: number; // undefined = never expire
};

export async function createPublicShareSnapshot(date: string, accountId: string, options: PublicShareOptions) {
  
  // Generate shareId early so we can use it for image copying
  const shareId = generateId();
  
  const rStore = useReflectionTemplateStore.getState();
  const dStore = useDailyReflectionStore.getState();
  const qStore = useQuickNoteStore.getState();
  const tStore = (await import('@/store/useTradeStore')).useTradeStore.getState();

  const reflection = rStore.getReflectionByDate(date, accountId);
  const daily = dStore.reflections.find(r => r.date === date && r.accountId === accountId);
  // Fix timezone issue: create date in local timezone, not UTC
  const dateObj = new Date(date + 'T12:00:00'); // Use noon to avoid timezone edge cases
  const notes = qStore.getNotesForDate ? qStore.getNotesForDate(dateObj).filter(note => note.accountId === accountId) : ([] as any[]);
  
  // Get trades for the specific date
  const startDate = new Date(date + 'T00:00:00');
  const endDate = new Date(date + 'T23:59:59');
  const dayTrades = tStore.getTradesByDateRange(startDate, endDate)
    .filter(trade => trade.accountId === accountId);
  
  // Calculate daily stats
  const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = dayTrades.filter(trade => trade.result === 'win').length;
  const totalTrades = dayTrades.length;
  const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
  const avgRR = totalTrades > 0 
    ? dayTrades.reduce((sum, trade) => sum + (trade.riskRewardRatio || 0), 0) / totalTrades 
    : 0;

  // Generate calendar data for the month containing the shared date
  const generateCalendarData = () => {
    const shareDate = new Date(date);
    const year = shareDate.getFullYear();
    const month = shareDate.getMonth();
    
    // Get all trades and reflections for the month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthTrades = tStore.getTradesByDateRange(monthStart, monthEnd)
      .filter(trade => trade.accountId === accountId);
    
    const calendarDays: any[] = [];
    const daysInMonth = monthEnd.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dayDateStr = dayDate.toISOString().split('T')[0];
      
      // Get trades for this day
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTradesForCalendar = monthTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return tradeDate >= dayStart && tradeDate <= dayEnd;
      });
      
      const dayPnL = dayTradesForCalendar.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const dayTradesCount = dayTradesForCalendar.length;
      const dayWinningTrades = dayTradesForCalendar.filter(trade => trade.result === 'win').length;
      const dayWinRate = dayTradesCount > 0 ? Math.round((dayWinningTrades / dayTradesCount) * 100) : 0;
      const dayAvgRR = dayTradesCount > 0 
        ? dayTradesForCalendar.reduce((sum, trade) => sum + (trade.riskRewardRatio || 0), 0) / dayTradesCount 
        : 0;
      
      // Check for reflection
      const dayReflection = dStore.reflections.find(r => r.date === dayDateStr && r.accountId === accountId);
      const hasReflection = !!dayReflection;
      
      // Check for notes (fix timezone issue)
      const dayNotesDate = new Date(dayDateStr + 'T12:00:00');
      const dayNotes = qStore.getNotesForDate ? qStore.getNotesForDate(dayNotesDate).filter(note => note.accountId === accountId) : [];
      const hasNotes = dayNotes.length > 0;
      
      calendarDays.push({
        date: dayDateStr,
        day,
        pnl: dayPnL,
        tradesCount: dayTradesCount,
        winRate: dayWinRate,
        avgRR: Math.round(dayAvgRR * 100) / 100,
        hasReflection,
        hasNotes,
        isToday: dayDateStr === date,
        isOtherMonth: false
      });
    }
    
    return {
      year,
      month,
      monthName: new Date(year, month).toLocaleString('default', { month: 'long' }),
      days: calendarDays
    };
  };

  // Helper: extract all image src URLs from rich HTML content
  const extractImageUrlsFromHtml = (html: string | undefined | null): string[] => {
    if (!html || typeof html !== 'string') return [];
    // Match <img ... src="..."> and markdown-like ![](url) just in case
    const urls: string[] = [];
    try {
      // DOM-based extraction for robustness
      const docEl = document.implementation.createHTMLDocument('tmp');
      docEl.body.innerHTML = html;
      docEl.body.querySelectorAll('img').forEach((img) => {
        const src = (img as HTMLImageElement).getAttribute('src');
        if (src) urls.push(src);
      });
    } catch (_e) {
      // Fallback to regex if DOM parsing is not available
      const regex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
      let m;
      while ((m = regex.exec(html)) !== null) {
        if (m[1]) urls.push(m[1]);
      }
    }
    return urls;
  };

  // Check if a URL is a blob URL that needs to be filtered out
  const isBlobUrl = (url: string): boolean => {
    return url.startsWith('blob:');
  };

  // Filter out blob URLs from arrays and log warnings
  const filterBlobUrls = (urls: string[], context: string): string[] => {
    const filtered = urls.filter(url => {
      if (isBlobUrl(url)) {
        console.warn(`🚨 Blob URL detected in ${context}:`, url);
        return false;
      }
      return true;
    });
    
    if (filtered.length !== urls.length) {
      console.warn(`🚨 Filtered out ${urls.length - filtered.length} blob URLs from ${context}`);
    }
    
    return filtered;
  };

  // Remove blob URLs from HTML content
  const removeBlobUrlsFromHtml = (html: string): string => {
    if (!html || typeof html !== 'string') return html;
    
    try {
      const docEl = document.implementation.createHTMLDocument('tmp');
      docEl.body.innerHTML = html;
      const imgElements = docEl.body.querySelectorAll('img');
      
      let removedCount = 0;
      imgElements.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && isBlobUrl(src)) {
          console.warn(`🚨 Removing blob URL from HTML:`, src);
          img.remove();
          removedCount++;
        }
      });
      
      if (removedCount > 0) {
        console.warn(`🚨 Removed ${removedCount} blob URL images from HTML content`);
      }
      
      return docEl.body.innerHTML;
    } catch (e) {
      console.error('Error processing HTML for blob URL removal:', e);
      return html;
    }
  };

  // Resolve a Firebase Storage reference or legacy URL to a permanent download URL
  const storage = getStorage(app as any);
  
  // Generate a public download URL using Firebase REST API
  const generatePublicImageUrl = async (originalUrl: string): Promise<string> => {
    if (!originalUrl) return originalUrl;
    
    try {
      // If it's already a public download URL with alt=media, return as-is
      if (/alt=media/.test(originalUrl)) {
        return originalUrl;
      }
      
      let storagePath;
      
      // Handle gs:// URLs
      if (/^gs:\/\//.test(originalUrl)) {
        storagePath = originalUrl.replace(/^gs:\/\/[^/]+\//, '');
      }
      // Handle Firebase Storage API URLs
      else if (/firebasestorage\.googleapis\.com\/v0\/b\/.+\/o\?name=/.test(originalUrl)) {
        const u = new URL(originalUrl);
        const name = u.searchParams.get('name');
        if (name) {
          storagePath = decodeURIComponent(name);
        }
      }
      // Handle direct Firebase Storage URLs
      else if (/firebasestorage\.googleapis\.com\/.+\/o\//.test(originalUrl)) {
        // Extract path from URL like: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg
        const match = originalUrl.match(/\/o\/([^?]+)/);
        if (match) {
          storagePath = decodeURIComponent(match[1]);
        }
      }
      
      if (!storagePath) return originalUrl;
      
      // Get the storage bucket from environment or extract from existing URL
      const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                        originalUrl.match(/\/b\/([^/]+)\//)?.[1];
      
      console.log('🔧 generatePublicImageUrl:', { 
        originalUrl, 
        storagePath, 
        bucketName, 
        envBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET 
      });
      
      if (!bucketName) {
        console.warn('⚠️ No bucket name found, falling back to SDK method');
        // Fallback to SDK method
        const sourceRef = storageRef(storage, storagePath);
        const sdkUrl = await getDownloadURL(sourceRef);
        console.log('🔧 SDK fallback URL:', sdkUrl);
        return sdkUrl;
      }
      
      // Create a public download URL using the REST API format
      const encodedPath = encodeURIComponent(storagePath);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
      
      console.log('🔧 Generated public URL:', { originalUrl, publicUrl });
      return publicUrl;
    } catch (error) {
      console.warn('Failed to generate public image URL:', error);
      return originalUrl; // Fallback to original URL
    }
  };

  const resolveStorageUrl = async (url: string, shareId?: string): Promise<string> => {
    if (!url) return url;
    
    // For public shares, generate long-lived signed URLs
    if (shareId) {
      return await generatePublicImageUrl(url);
    }
    
    // Otherwise, just resolve to a signed URL (for backward compatibility)
    // Already a public download URL with token
    if (/alt=media/.test(url) && /firebasestorage\.googleapis\.com\/.+\/o\//.test(url)) return url;
    // gs:// bucket path
    if (/^gs:\/\//.test(url)) {
      try { return await getDownloadURL(storageRef(storage, url)); } catch { return url; }
    }
    // Legacy API style without token
    if (/firebasestorage\.googleapis\.com\/v0\/b\/.+\/o\?name=/.test(url)) {
      try {
        const u = new URL(url);
        const name = u.searchParams.get('name');
        if (name) {
          const ref = storageRef(storage, decodeURIComponent(name));
          return await getDownloadURL(ref);
        }
      } catch { /* ignore */ }
    }
    return url;
  };

  // Replace any inline <img src> that points to Storage with download URLs
  const replaceInlineStorageUrls = async (html: string, shareId: string): Promise<string> => {
    if (!html) return html;
    try {
      const docEl = document.implementation.createHTMLDocument('tmp');
      docEl.body.innerHTML = html;
      const imgs = Array.from(docEl.body.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map(async (img) => {
        const src = img.getAttribute('src') || '';
        const resolved = await resolveStorageUrl(src, shareId);
        if (resolved && resolved !== src) img.setAttribute('src', resolved);
      }));
      return docEl.body.innerHTML;
    } catch {
      return html;
    }
  };

  // Process insight blocks and separate images
  const MAX_BLOCK_CONTENT = 4000; // chars
  const imageCollections: { blockId: string; images: string[] }[] = [];
  const blocksToWrite: { blockId: string; title: string; content: string; order: number; emoji?: string; tags?: string[] }[] = [];
  
  const insightBlocks = await Promise.all((reflection?.insightBlocks || []).map(async (b) => {
    const galleryImagesRaw: string[] = options.includeImages ? ((b as any).images || []) : [];
    const inlineImagesRaw: string[] = options.includeImages ? extractImageUrlsFromHtml((b as any).content) : [];
    
    // Filter out blob URLs before processing
    const filteredGalleryImages = filterBlobUrls(galleryImagesRaw, `gallery images for block "${b.title}"`);
    const filteredInlineImages = filterBlobUrls(inlineImagesRaw, `inline images for block "${b.title}"`);
    
    // Resolve all potential Storage URLs to downloadable URLs to avoid auth requirements on public page
    const galleryImages = await Promise.all(filteredGalleryImages.map(url => resolveStorageUrl(url, shareId)));
    const inlineImages = await Promise.all(filteredInlineImages.map(url => resolveStorageUrl(url, shareId)));
    const images = Array.from(new Set([...(galleryImages || []), ...(inlineImages || [])]));
    const blockId = generateId();
    
    console.log('📊 Public share - processing block:', { 
      title: b.title, 
      hasImages: images.length > 0, 
      imageCount: images.length,
      includeImages: options.includeImages,
      blockId,
      galleryCount: galleryImages.length,
      inlineCount: inlineImages.length,
      galleryImagesRaw,
      filteredGalleryImages,
      galleryImages,
      inlineImagesRaw,
      filteredInlineImages,
      sampleProcessedImage: images[0]
    });
    
    // Store images separately if they exist
    if (images.length > 0) {
      imageCollections.push({ blockId, images });
    }
    // Clean blob URLs from HTML content and replace inline storage URLs
    const cleanedContent = removeBlobUrlsFromHtml(b.content || '');
    const replacedContent = options.includeImages 
      ? await replaceInlineStorageUrls(cleanedContent, shareId)
      : cleanedContent;
    // Queue full block content to be written in a separate collection
    blocksToWrite.push({
      blockId,
      title: b.title,
      content: replacedContent,
      order: b.order,
      emoji: b.emoji,
      tags: b.tags || []
    });
    
    return {
      id: blockId,
      title: b.title,
      // No full content in main doc to keep under 1MB; full content is stored in publicShareBlocks
      content: '',
      imageCount: images.length, // Store count instead of actual images
      order: b.order,
      emoji: b.emoji,
      tags: b.tags || []
    };
  })).then(arr => arr.sort((a,b)=>a.order-b.order));

  // Build options without undefined
  const cleanOptions: any = {
    includeImages: !!options.includeImages,
    includeNotes: !!options.includeNotes,
    includeMood: !!options.includeMood,
    includeCalendar: !!options.includeCalendar,
    includeTrades: !!options.includeTrades,
    includeStats: !!options.includeStats,
  };
  if (options.expiresDays !== undefined && options.expiresDays !== null) {
    cleanOptions.expiresDays = options.expiresDays;
  }

  const payload: any = {
    isPublic: true,
    date,
    title: daily?.reflection?.slice(0, 60) || 'Trading Journal',
    createdAt: serverTimestamp(),
    options: cleanOptions,
    content: {
      reflectionPlain: daily?.reflection || '',
    },
    insightBlocks,
    viewCount: 0,
  };

  if (options.includeNotes) {
    payload.notes = (notes || []).map((n: any) => ({ content: n.content, tags: n.tags || [] }));
  }
  if (options.includeMood && daily) {
    payload.mood = {
      timeline: (daily.moodTimeline || []).map(m => ({ 
        timestamp: m.timestamp, 
        mood: m.mood,
        trigger: (m as any).trigger,
        relatedId: (m as any).relatedId 
      })),
    };
  }
  if (options.includeTrades) {
    payload.trades = dayTrades.map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice,
      quantity: trade.quantity,
      pnl: trade.pnl || 0,
      result: trade.result,
      riskRewardRatio: trade.riskRewardRatio || 0,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      notes: trade.notes,
      tags: trade.tags || []
    }));
  }
  if (options.includeStats) {
    payload.stats = {
      totalPnL,
      totalTrades,
      winningTrades,
      winRate,
      avgRR: Math.round(avgRR * 100) / 100
    };
  }
  if (options.includeCalendar) {
    payload.calendar = generateCalendarData();
  }

  // Remove any lingering undefined deeply
  const prune = (val: any): any => {
    if (Array.isArray(val)) {
      return val.map(prune);
    }
    if (val && typeof val === 'object') {
      const out: any = {};
      Object.entries(val).forEach(([k, v]) => {
        if (v === undefined) return;
        const pv = prune(v);
        if (pv && typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0) return;
        out[k] = pv;
      });
      return out;
    }
    return val;
  };

  // Create the main document and image documents using batch write
  const batch = writeBatch(db);
  
  const col = collection(db, 'publicShares');
  const ref = doc(col, shareId); // Use the pre-generated shareId
  
  // Add main document to batch
  batch.set(ref, prune(payload));
  
  // Add image documents to batch
  const imagesCol = collection(db, 'publicShareImages');
  for (const imageCollection of imageCollections) {
    const imageDoc = doc(imagesCol);
    batch.set(imageDoc, {
      shareId,
      blockId: imageCollection.blockId,
      images: imageCollection.images,
      createdAt: serverTimestamp()
    });
  }
  
  // Add full blocks to separate collection
  const blocksCol = collection(db, 'publicShareBlocks');
  for (const b of blocksToWrite) {
    const blockDoc = doc(blocksCol);
    batch.set(blockDoc, {
      shareId,
      blockId: b.blockId,
      title: b.title,
      content: b.content,
      order: b.order,
      emoji: b.emoji || null,
      tags: b.tags || [],
      createdAt: serverTimestamp()
    });
  }
  
  // Commit the batch
  await batch.commit();
  
  console.log('📊 Public share created:', {
    shareId,
    blockCount: insightBlocks.length,
    imageCollectionCount: imageCollections.length,
    totalImages: imageCollections.reduce((sum, ic) => sum + ic.images.length, 0),
    blocksWritten: blocksToWrite.length
  });
  
  return { id: shareId, url: `${window.location.origin}/share/${shareId}` };
}


