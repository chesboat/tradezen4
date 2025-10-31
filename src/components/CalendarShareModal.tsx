import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  Zap,
  Calendar as CalendarIcon,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Share,
  Twitter,
  Instagram
} from 'lucide-react';
import { formatDate } from '@/lib/localStorageUtils';
import { formatCurrencyApple } from '@/lib/appleFormatters';
import { renderCalendarToDataURL } from '@/lib/share/CalendarRenderer';
import { useTheme } from '@/hooks/useTheme';
import { useAccentColor } from '@/hooks/useAccentColor';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CalendarShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  calendarData: any;
  weeklyData: any[];
}


export const CalendarShareModal: React.FC<CalendarShareModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  calendarData,
  weeklyData
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null); // offscreen, fixed-size capture target
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();
  const { accentColor, accentColorPalettes } = useAccentColor();

  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  const currentYear = currentDate.getFullYear();
  const monthlyPnL = weeklyData.reduce((sum, week) => sum + week.totalPnl, 0);
  const totalTrades = weeklyData.reduce((sum, week) => sum + week.tradesCount, 0);

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Replicate the exact styling functions from CalendarView
  const getDayClassName = (day: any) => {
    const isToday = new Date().toDateString() === day.date.toDateString();
    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6; // Sunday or Saturday
    
    return cn(
      'relative p-3 rounded-xl transition-all duration-200',
      'border border-border/50',
      
      // Apple-style: Pure black for empty days, elevated gray for days with content
      day.tradesCount === 0 
        ? 'bg-background' 
        : 'bg-card',
      
      // Weekend styling (slightly muted)
      isWeekend && !day.isOtherMonth && 'opacity-75',
      
      day.isOtherMonth && 'opacity-40',
      isToday && 'ring-2 ring-primary/50',
      day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
      day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
    );
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return null;
    return (
      <div className={cn(
        'text-sm font-bold text-center',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrencyApple(pnl, { showSign: false })}
      </div>
    );
  };

  const getCaptureTarget = (): HTMLDivElement | null => {
    // Prefer the fixed-size offscreen capture for consistent output across devices
    return captureRef.current || canvasRef.current;
  };

  const copyHeadStyles = (fromDoc: Document, toDoc: Document) => {
    try {
      // Copy <link rel="stylesheet"> and <style> tags so Tailwind classes resolve in the new window
      const links = Array.from(fromDoc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      links.forEach((lnk) => {
        const el = toDoc.createElement('link');
        el.rel = 'stylesheet';
        el.href = lnk.href;
        toDoc.head.appendChild(el);
      });
      const styles = Array.from(fromDoc.querySelectorAll('style')) as HTMLStyleElement[];
      styles.forEach((st) => {
        const el = toDoc.createElement('style');
        el.type = 'text/css';
        el.textContent = st.textContent || '';
        toDoc.head.appendChild(el);
      });
    } catch {}
  };

  const html2canvasOpts = {
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    useCORS: true,
    allowTaint: true,
    foreignObjectRendering: true,
    letterRendering: true,
    // Force a desktop-like viewport for consistent rendering
    windowWidth: 1200,
    windowHeight: 1000,
    width: 1200,
    height: 1000,
    scale: Math.min(1.5, (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)),
    scrollX: 0,
    scrollY: 0,
    removeContainer: true,
    onclone: (clonedDoc: Document) => {
      try {
        // Hide everything except the capture root to avoid fixed overlays bleeding in
        const root = clonedDoc.getElementById('calendar-share-capture');
        if (root) {
          const all = Array.from(clonedDoc.body.querySelectorAll('*')) as HTMLElement[];
          for (const el of all) {
            if (el === root || root.contains(el)) continue;
            el.style.display = 'none';
          }
          // Normalize any transforms/filters/animations inside the capture tree
          const inside = Array.from(root.querySelectorAll<HTMLElement>('*'));
          for (const el of inside) {
            el.style.transform = 'none';
            el.style.filter = 'none';
            el.style.animation = 'none';
            el.style.transition = 'none';
            el.style.backdropFilter = 'none';
          }
        }
      } catch {}
    }
  } as any;

  // Build minimal data for the reliable canvas renderer
  const buildRenderData = () => {
    const weeks = calendarData.weeks.map((week: any[]) => week.map((d: any) => ({
      date: new Date(d.date),
      pnl: d.pnl,
      tradesCount: d.tradesCount,
      winRate: d.winRate,
      avgRR: d.avgRR,
      isOtherMonth: d.isOtherMonth,
      isWeekend: d.date.getDay() === 0 || d.date.getDay() === 6,
      hasReflection: d.hasReflection,
    })));
    const weeklySummaries = weeks.map((w: any[], idx: number) => ({
      weekNumber: idx + 1,
      totalPnl: w.reduce((s: number, d: any) => s + (d.pnl || 0), 0),
      activeDays: w.filter((d: any) => d.tradesCount > 0).length,
    }));
    return {
      monthName: currentMonth,
      year: currentYear,
      weeks,
      weeklySummaries,
      monthlyPnl: monthlyPnL,
    };
  };

  const createPublicShareLink = async (): Promise<string> => {
    try {
      console.log('[CalendarShare] Creating public share...');
      
      // Generate short ID for the share
      const shareId = Math.random().toString(36).slice(2, 10);
      console.log('[CalendarShare] Generated share ID:', shareId);
      
      // Build calendar data and flatten nested arrays (Firestore doesn't support them)
      const renderData = buildRenderData();
      
      // Flatten weeks array by converting to JSON string
      const flattenedCalendarData = {
        monthName: renderData.monthName,
        year: renderData.year,
        monthlyPnl: renderData.monthlyPnl,
        // Serialize weeks as JSON string to avoid nested array issue
        weeksJson: JSON.stringify(renderData.weeks),
        weeklySummaries: renderData.weeklySummaries,
      };
      
      // Detect user's actual theme (respecting system preference if set to 'system')
      const effectiveTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      // Build share payload
      const payload = {
        id: shareId,
        type: 'calendar',
        month: currentMonth,
        year: currentYear,
        monthlyPnl: monthlyPnL,
        totalTrades,
        calendarData: flattenedCalendarData,
        theme: effectiveTheme,
        accentColor,
        isPublic: true,
        createdAt: new Date().toISOString(),
      };
      
      console.log('[CalendarShare] Payload:', payload);
      console.log('[CalendarShare] Accent color being saved:', accentColor);
      
      // Save to Firestore public shares
      const { db } = await import('@/lib/firebase');
      const { doc, setDoc, collection } = await import('firebase/firestore');
      const shareRef = doc(collection(db, 'publicShares'), shareId);
      
      console.log('[CalendarShare] Saving to Firestore...');
      await setDoc(shareRef, payload);
      console.log('[CalendarShare] Saved successfully!');
      
      // Return short URL
      const shareUrl = `${window.location.origin}/share/c/${shareId}`;
      console.log('[CalendarShare] Share URL:', shareUrl);
      return shareUrl;
    } catch (error) {
      console.error('[CalendarShare] Failed to create public share:', error);
      toast.error('Failed to create share link. Using homepage instead.');
      // Fallback to homepage if share creation fails
      return `${window.location.origin}`;
    }
  };

  const generateShareCaption = async () => {
    const pnlSign = monthlyPnL >= 0 ? '+' : '';
    
    // Calculate win rate from actual calendar data (days with positive P&L)
    const tradingDays = calendarData.weeks.flat().filter((day: any) => 
      !day.isOtherMonth && !day.isWeekend && day.tradesCount > 0
    );
    const winningDays = tradingDays.filter((day: any) => day.pnl > 0).length;
    const winRate = tradingDays.length > 0 ? Math.round((winningDays / tradingDays.length) * 100) : 0;
    
    // Create public share link
    const shareUrl = await createPublicShareLink();
    
    return {
      caption: `${currentMonth} ${currentYear} 📊

P&L: ${pnlSign}${formatCurrencyApple(monthlyPnL, { showSign: false })}
${totalTrades} trade${totalTrades !== 1 ? 's' : ''}, ${winRate}% win rate

Refining my edge, daily.

${shareUrl}`,
      shareUrl
    };
  };

  const handleShareToX = async () => {
    setIsGenerating(true);
    try {
      const { caption } = await generateShareCaption();
      
      // Open X.com with pre-filled tweet
      const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(caption)}`;
      window.open(xUrl, '_blank');
      
      toast.success('🐦 Opening X.com...');
    } catch (error: any) {
      console.error('Error sharing to X:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToInstagram = async () => {
    setIsGenerating(true);
    try {
      const { caption } = await generateShareCaption();
      
      // Copy caption for Instagram (can't pre-fill IG posts via URL)
      try {
        await navigator.clipboard.writeText(caption);
        toast.success('📸 Caption copied! Open Instagram and paste it 🚀');
      } catch (clipboardError) {
        toast.success('📸 Share on Instagram Stories or Feed!');
      }
    } catch (error: any) {
      console.error('Error sharing to Instagram:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      // Generate public share link and caption
      const { caption, shareUrl } = await generateShareCaption();
      
      // Try native share API first (works great on mobile)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${currentMonth} ${currentYear} Trading Calendar`,
            text: caption,
          });
          toast.success('Shared successfully!');
          setIsGenerating(false);
          return;
        } catch (err: any) {
          // User cancelled or share not supported - continue to fallback
          if (err.name !== 'AbortError') {
            console.log('Native share not available, using fallback');
          }
        }
      }
      
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(caption);
        toast.success('🔗 Link copied! Share it on your socials 🚀');
      } catch (clipboardError) {
        // Manual fallback - show the link
        toast.success(`Share this link: ${shareUrl}`);
      }
    } catch (error: any) {
      console.error('Error sharing calendar:', error);
      if (error.name === 'AbortError') {
        toast.error('Share cancelled');
      } else {
        toast.error('Failed to generate share link');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    const target = getCaptureTarget();
    if (!target) return;
    
    setIsGenerating(true);
    try {
      const payload = buildRenderData();
      const themeParam = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const dataParam = encodeURIComponent(btoa(JSON.stringify(payload)));
      const shareUrl = `${window.location.origin}/share/calendar?theme=${themeParam}&accent=${accentColor}&data=${dataParam}`;
      const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=675&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
      const resp = await fetch(api);
      if (!resp.ok) throw new Error('Screenshot API failed');
      const blob = await resp.blob();
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('Calendar image copied to clipboard!');
          } catch (err) {
            toast.error('Failed to copy image to clipboard');
          }
        } else {
          toast.error('Clipboard not supported in this browser');
        }
    } catch (error) {
      console.error('Error copying calendar image:', error);
      toast.error('Failed to copy calendar image');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background rounded-xl border max-w-6xl w-full h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Share Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Post your {currentMonth} performance to social media
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* X.com Share */}
              <motion.button
                onClick={handleShareToX}
                disabled={isGenerating}
                className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Share to X"
              >
                {/* X logo (not Twitter) */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="hidden sm:inline">X</span>
              </motion.button>
              
              {/* Instagram Share */}
              <motion.button
                onClick={handleShareToInstagram}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Share to Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span className="hidden sm:inline">IG</span>
              </motion.button>
              
              {/* More Share Options */}
              <motion.button
                onClick={handleShare}
                disabled={isGenerating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="More options"
              >
                <Share className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </motion.button>
              
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Calendar Preview - Apple-style gradient background */}
          <div 
            ref={canvasRef}
            className={cn(
              "p-4 flex-1 flex items-center justify-center overflow-hidden",
              theme === 'dark' 
                ? "bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" 
                : "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"
            )}
          >
            <div
              className="relative p-6 w-full max-w-6xl flex items-center justify-center"
              style={{ aspectRatio: '16/10' }}
            >
              {/* Calendar Content - Exact replica of CalendarView */}
              <div className="max-w-5xl w-[92%] relative" data-share-calendar-card>
                <div 
                  className={`${theme}`}
                  style={{
                    // Apply user's selected accent color (inline to ensure it works in scoped theme div)
                    '--primary': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].primary,
                    '--primary-foreground': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].primaryForeground,
                    '--ring': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].ring,
                  } as React.CSSProperties
                }>
                  <div className="bg-background rounded-xl pt-4 pb-6 px-6 border relative" 
                   style={{ 
                     boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)',
                     filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))'
                   }}>
                {/* Header - Exact replica */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg text-muted-foreground">
                        <ChevronLeft className="w-5 h-5" />
                      </div>
                      
                      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <span>{currentMonth}</span>
                        <span>{currentYear}</span>
                      </h1>
                      
                      <div className="p-2 rounded-lg text-muted-foreground">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-medium leading-none">
                      TODAY
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Monthly: <span className={cn("font-semibold", monthlyPnL > 0 ? "text-green-500" : monthlyPnL < 0 ? "text-red-500" : "text-muted-foreground")}>{formatCurrencyApple(monthlyPnL, { showSign: false })}</span>
                    </div>
                  </div>
                </div>

                {/* Simple Uniform Calendar Grid - Match journal layout */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Headers Row - 7 days only */}
                  {DAYS_OF_WEEK.slice(0, 7).map((day) => (
                    <div key={day} className="text-center font-semibold text-muted-foreground py-2 text-[10px] sm:text-xs">
                      {day}
                    </div>
                  ))}

                  {/* Calendar Rows - 7 columns (Sun-Sat, with week summary replacing Sat) */}
                  {calendarData.weeks.map((week: any, weekIndex: number) => (
                    <React.Fragment key={weekIndex}>
                      {/* Days 0-5 (Sun-Fri) */}
                      {week.slice(0, 6).map((day: any, dayIndex: number) => {
                        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                        
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`${getDayClassName(day)}`}
                            style={{ 
                              aspectRatio: '1', 
                              minHeight: '60px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2px 4px' }}>
                              {/* Date - Top Left, subtle */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
                                <span className={cn(
                                  'text-[9px] sm:text-xs font-normal leading-none',
                                  day.isOtherMonth ? 'text-muted-foreground/60' : 'text-muted-foreground'
                                )}>
                                  {day.date.getDate()}
                                </span>
                                {day.hasReflection && (
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500" />
                                )}
                              </div>
                              
                              {/* Center Content - Apple Style */}
                              {isWeekend ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                                  <div className="text-[7px] sm:text-[10px] text-muted-foreground/50 font-normal">
                                    Weekend
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '2px' }}>
                                  {/* P&L - Hero element, responsive sizing */}
                                  {day.pnl !== 0 && (
                                    <div className={cn(
                                      'text-[9px] sm:text-sm lg:text-base font-bold tracking-tight leading-none truncate w-full text-center',
                                      day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                                    )}>
                                      {formatCurrencyApple(day.pnl, { showSign: false })}
                                    </div>
                                  )}
                                  
                                  {/* Trade Count - Very subtle */}
                                  {day.tradesCount > 0 && (
                                    <div className="text-[6px] sm:text-[9px] lg:text-[10px] text-muted-foreground/50 font-normal leading-none">
                                      {day.tradesCount}t
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Saturday Column - Show Week Summary Instead */}
                      <div 
                        className={cn(
                          'relative rounded-lg border border-border/50 transition-all duration-200 bg-card',
                          weeklyData[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                          weeklyData[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10',
                        )}
                        style={{ 
                          aspectRatio: '1', 
                          minHeight: '60px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '1px', padding: '4px' }}>
                          <div className="text-[7px] sm:text-[10px] font-medium text-muted-foreground leading-none">
                            W{weeklyData[weekIndex]?.weekNumber}
                          </div>
                          <div className={cn(
                            'text-[8px] sm:text-xs lg:text-sm font-bold leading-none truncate w-full',
                            weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                            weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                          )}>
                            {formatCurrencyApple(weeklyData[weekIndex]?.totalPnl || 0, { showSign: false })}
                          </div>
                          <div className="text-[6px] sm:text-[9px] text-muted-foreground leading-none">
                            {weeklyData[weekIndex]?.activeDays || 0}d
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {/* Refine Branding - Subtle, Apple-style */}
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Refine</span>
                    <span className="text-xs text-muted-foreground">· refine.trading</span>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offscreen, fixed-size capture target for consistent desktop framing on all devices */}
            <div
              ref={captureRef}
              id="calendar-share-capture"
              className={cn(
                "fixed left-0 top-0 rounded-2xl",
                theme === 'dark' 
                  ? "bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900" 
                  : "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"
              )}
              style={{ width: 1200, height: 1000, padding: 48, opacity: 0, zIndex: -1000, pointerEvents: 'none' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div 
                  className={`${theme}`} 
                  style={{ 
                    width: 1000,
                    // Apply user's selected accent color (inline to ensure it works in scoped theme div)
                    '--primary': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].primary,
                    '--primary-foreground': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].primaryForeground,
                    '--ring': accentColorPalettes[accentColor][theme === 'dark' ? 'dark' : 'light'].ring,
                  } as React.CSSProperties
                }>
                  <div className="bg-background rounded-xl pt-4 pb-6 px-6 border relative" 
                    style={{ 
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)'
                    }}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg text-muted-foreground">
                            <ChevronLeft className="w-5 h-5" />
                          </div>
                          <h1 className="text-2xl font-bold text-foreground">{currentMonth} {currentYear}</h1>
                          <div className="p-2 rounded-lg text-muted-foreground">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg">TODAY</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monthly: <span className={cn("font-semibold", monthlyPnL > 0 ? "text-green-500" : monthlyPnL < 0 ? "text-red-500" : "text-muted-foreground")}>{formatCurrencyApple(monthlyPnL, { showSign: false })}</span>
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-8 gap-x-15">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground py-2">{day}</div>
                        ))}
                        <div className="text-center font-semibold text-muted-foreground py-2">Week</div>
                      </div>

                      {calendarData.weeks.map((week: any, weekIndex: number) => (
                        <div key={`w-${weekIndex}`} className="grid grid-cols-8 gap-x-1">
                          {week.map((day: any, dayIndex: number) => {
                            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                            return (
                              <div key={`d-${weekIndex}-${dayIndex}`} className={`${getDayClassName(day)} aspect-[6/5] w-full`}>
                                <div className="flex flex-col h-full">
                                  <div className="flex items-center justify-between px-2 pt-2">
                                    <span className={cn('text-sm font-medium', day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground')}>{day.date.getDate()}</span>
                                    <div className="flex items-center gap-1">
                                      {day.hasReflection && <BookOpen className="w-3 h-3 text-green-500" />}
                                    </div>
                                  </div>
                                  {isWeekend ? (
                                    <div className="flex flex-col items-center justify-center flex-1 text-center">
                                      <div className="text-xs text-muted-foreground/70">Weekend</div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center flex-1 gap-0.5">
                                      {formatPnL(day.pnl)}
                                      {day.tradesCount > 0 && (
                                        <div className="text-xs text-muted-foreground text-center">{day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          <div className={cn('relative p-3 rounded-xl border border-border/50 bg-card aspect-[6/5] w-full',
                              weeklyData[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                              weeklyData[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10')}
                          >
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Week {weeklyData[weekIndex]?.weekNumber}</div>
                              <div className={cn('text-sm font-bold', weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                                {formatCurrencyApple(weeklyData[weekIndex]?.totalPnl || 0, { showSign: false })}
                              </div>
                              <div className="text-xs text-muted-foreground">{weeklyData[weekIndex]?.activeDays || 0} days</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Refine Branding - Offscreen capture version */}
                    <div className="flex items-center justify-center mt-6">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Refine</span>
                        <span className="text-xs text-muted-foreground">· refine.trading</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
