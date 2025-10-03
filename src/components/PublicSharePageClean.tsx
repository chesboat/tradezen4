import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Flame,
  ExternalLink,
  Sparkles,
  Lightbulb,
  Camera,
  Maximize2,
  X as CloseIcon
} from 'lucide-react';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

// Helper functions for loading share data
const loadShareImages = async (shareId: string): Promise<{ [blockId: string]: string[] }> => {
  try {
    const imagesCol = collection(db, 'publicShareImages');
    const q = query(imagesCol, where('shareId', '==', shareId));
    const snapshot = await getDocs(q);
    
    const imagesByBlock: { [blockId: string]: string[] } = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      imagesByBlock[data.blockId] = data.images || [];
    });
    
    return imagesByBlock;
  } catch (error) {
    console.error('Failed to load share images:', error);
    return {};
  }
};

const loadShareBlocks = async (shareId: string): Promise<{ [blockId: string]: any }> => {
  try {
    const blocksCol = collection(db, 'publicShareBlocks');
    const q = query(blocksCol, where('shareId', '==', shareId));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(d => d.data()).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const byId: { [blockId: string]: any } = {};
    docs.forEach((data: any) => { byId[data.blockId] = data; });
    return byId;
  } catch (error) {
    console.error('Failed to load share blocks:', error);
    return {};
  }
};

const resolveInlineStorageLinksInHtml = async (html: string): Promise<string> => {
  if (!html || typeof html !== 'string' || html.indexOf('/o?name=') === -1) return html;
  
  const docEl = document.implementation.createHTMLDocument('tmp');
  docEl.body.innerHTML = html;
  const imgEls = Array.from(docEl.body.querySelectorAll('img')) as HTMLImageElement[];
  
  await Promise.all(imgEls.map(async (img) => {
    const src = img.getAttribute('src') || '';
    
    if (/\/o\?name=/.test(src) && !/alt=media/.test(src)) {
      try {
        const u = new URL(src);
        const pathParam = u.searchParams.get('name');
        if (pathParam) {
          const storagePath = decodeURIComponent(pathParam);
          
          const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                            src.match(/\/b\/([^/]+)\//)?.[1];
          
          if (bucketName) {
            const encodedPath = encodeURIComponent(storagePath);
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;
            img.setAttribute('src', publicUrl);
          }
        }
      } catch {
        // ignore
      }
    }
  }));
  return docEl.body.innerHTML;
};

export const PublicSharePageClean: React.FC = () => {
  // Apple-style: Respect viewer's system preference for journal shares
  useSystemTheme();
  
  const [id] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.split('/').pop() || '';
    }
    return '';
  });
  const [data, setData] = React.useState<any | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [imagesByBlock, setImagesByBlock] = React.useState<{ [blockId: string]: string[] }>({});
  const [blocksById, setBlocksById] = React.useState<{ [blockId: string]: any }>({});
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  // Load share data
  React.useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'publicShares', id));
        if (!snap.exists()) { 
          setNotFound(true); 
          return; 
        }
        
        const shareData: any = { id: snap.id, ...(snap.data() as any) };
        
        // Load images and blocks
        const [images, rawBlocks] = await Promise.all([
          loadShareImages(id),
          loadShareBlocks(id)
        ]);
        
        const blocks: { [blockId: string]: any } = {};
        await Promise.all(Object.keys(rawBlocks).map(async (bid) => {
          const blk = rawBlocks[bid];
          blocks[bid] = { ...blk, content: await resolveInlineStorageLinksInHtml(blk.content || '') };
        }));
        
        setData(shareData);
        setImagesByBlock(images);
        setBlocksById(blocks);
      } catch (error) {
        console.error('Failed to load public share:', error);
        setNotFound(true);
      }
    })();
  }, [id]);

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Calculate metrics
  const dayPnL = useMemo(() => {
    if (!data?.trades) return 0;
    return data.trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  }, [data]);

  const winRate = useMemo(() => {
    if (!data?.trades || data.trades.length === 0) return 0;
    const winners = data.trades.filter((t: any) => (t.pnl || 0) > 0).length;
    return Math.round((winners / data.trades.length) * 100);
  }, [data]);

  const avgRR = useMemo(() => {
    if (!data?.trades || data.trades.length === 0) return 0;
    const totalRR = data.trades.reduce((sum: number, t: any) => sum + (t.riskRewardRatio || 0), 0);
    return (totalRR / data.trades.length).toFixed(1);
  }, [data]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-2xl font-bold mb-2">Journal Not Found</h1>
          <p className="text-muted-foreground">This journal entry may have expired or been removed.</p>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading journal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Apple-style: Clean solid backgrounds in both light and dark modes */}
      <div className="min-h-screen bg-white dark:bg-background py-4 md:py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="max-w-3xl mx-auto"
        >
          {/* Main Card */}
          <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                  {formatDate(data.date)}
                </h1>
                <p className="text-sm text-muted-foreground">Trading Journal</p>
              </div>
            </div>
          </div>

          {/* Hero Metrics */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Large P&L */}
            <div className="text-center space-y-3">
              <div className={cn(
                "text-5xl md:text-7xl font-semibold tabular-nums tracking-tight",
                dayPnL >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {dayPnL >= 0 ? "+" : ""}{formatCurrency(dayPnL)}
              </div>
              
              {/* Inline stats */}
              <div className="flex items-center justify-center gap-3 md:gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="font-medium">{data.trades?.length || 0} {data.trades?.length === 1 ? 'trade' : 'trades'}</span>
                {data.trades && data.trades.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{winRate}% win rate</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Cards */}
            {data.trades && data.trades.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-semibold text-foreground tabular-nums">
                    {winRate}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-semibold text-foreground tabular-nums">
                    {avgRR}:1
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Avg R:R</div>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 md:p-4 text-center">
                  <div className="text-xl md:text-2xl font-semibold text-foreground tabular-nums">
                    {data.trades.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Trades</div>
                </div>
              </div>
            )}
          </div>

          {/* 🎯 Trade Insights Section - Premium Positioning */}
          {data.tradeInsights && data.tradeInsights.length > 0 && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent border-t-2 border-purple-500/10">
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Trade Insights
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Analyzed & Annotated
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                  {data.tradeInsights.length} {data.tradeInsights.length === 1 ? 'Insight' : 'Insights'}
                </span>
              </div>

              <div className="space-y-4">
                {data.tradeInsights.map((trade: any, idx: number) => (
                  <motion.div
                    key={trade.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all"
                  >
                    {/* Trade Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          (trade.pnl || 0) > 0 ? "bg-green-500" : (trade.pnl || 0) < 0 ? "bg-red-500" : "bg-gray-400"
                        )} />
                        <span className="font-semibold text-foreground">{trade.symbol}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {trade.direction === 'long' ? '↑' : '↓'} {trade.direction}
                        </span>
                        {trade.reviewImages && trade.reviewImages.length > 0 && (
                          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                            <Camera className="w-3 h-3" />
                            {trade.reviewImages.length}
                          </span>
                        )}
                        <span className={cn(
                          "text-sm font-semibold ml-auto",
                          (trade.pnl || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Trade Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>Entry: <span className="text-foreground">${trade.entryPrice?.toFixed(2)}</span></div>
                      <div>Exit: <span className="text-foreground">${trade.exitPrice?.toFixed(2) || 'Open'}</span></div>
                      <div>R:R: <span className="text-foreground">{(trade.riskRewardRatio || 0).toFixed(2)}:1</span></div>
                      <div>Qty: <span className="text-foreground">{trade.quantity}</span></div>
                    </div>

                    {/* Key Learnings */}
                    {trade.reviewNote && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Key Learnings
                        </div>
                        <div className="text-sm text-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                          {trade.reviewNote}
                        </div>
                      </div>
                    )}

                    {/* Chart Screenshots Gallery */}
                    {trade.reviewImages && trade.reviewImages.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          Chart Analysis ({trade.reviewImages.length})
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {trade.reviewImages.map((imageUrl: string, imgIdx: number) => (
                            <motion.div
                              key={imgIdx}
                              className="relative group cursor-pointer"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setLightboxImage(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Chart analysis ${imgIdx + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-border/50 transition-all"
                              />
                              {/* Hover overlay with expand icon */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                                <Maximize2 className="w-6 h-6 text-white" />
                              </div>
                              {/* Image number badge */}
                              <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-[10px] rounded-full flex items-center justify-center font-medium pointer-events-none">
                                {imgIdx + 1}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Trades Section */}
          {data.trades && data.trades.length > 0 && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Trades ({data.trades.length})
              </h3>
              <div className="space-y-2">
                {data.trades.map((trade: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-muted/20 border border-border/50 rounded-xl p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-foreground">
                          {trade.symbol}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-medium",
                          trade.direction === 'long' 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-red-500/20 text-red-400"
                        )}>
                          {trade.direction?.toUpperCase()}
                        </span>
                      </div>
                      <div className={cn(
                        "text-lg font-semibold tabular-nums",
                        (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <span className="ml-2 text-foreground">{formatCurrency(trade.entryPrice || 0)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exit:</span>
                        <span className="ml-2 text-foreground">
                          {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">R:R:</span>
                        <span className="ml-2 text-foreground">{(trade.riskRewardRatio || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Result:</span>
                        <span className={cn(
                          "ml-2 font-medium capitalize",
                          trade.result === 'win' ? "text-green-500" :
                          trade.result === 'loss' ? "text-red-500" :
                          "text-yellow-500"
                        )}>
                          {trade.result || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {data.notes && data.notes.length > 0 && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Notes ({data.notes.length})
              </h3>
              <div className="space-y-3">
                {data.notes.map((note: any, idx: number) => (
                  <div 
                    key={idx}
                    className="bg-muted/20 border border-border/50 rounded-xl p-4"
                  >
                    {note.title && (
                      <h4 className="font-medium text-foreground mb-2">{note.title}</h4>
                    )}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insight Blocks */}
          {data.insightBlocks && data.insightBlocks.length > 0 && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Insights ({data.insightBlocks.length})
              </h3>
              <div className="space-y-3">
                {data.insightBlocks.map((block: any) => {
                  const blockData = blocksById[block.id];
                  if (!blockData) return null;
                  
                  return (
                    <div 
                      key={block.id}
                      className="bg-muted/20 border border-border/50 rounded-xl p-4"
                    >
                      <h4 className="font-medium text-foreground mb-3">{block.title}</h4>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: blockData.content }}
                      />
                      
                      {/* Block images */}
                      {imagesByBlock[block.id] && imagesByBlock[block.id].length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          {imagesByBlock[block.id].map((url: string, imgIdx: number) => (
                            <img 
                              key={imgIdx}
                              src={url}
                              alt=""
                              className="rounded-lg w-full h-auto"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 md:px-8 py-6 border-t border-border/50 bg-muted/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground mb-1">
                  Shared from <span className="font-semibold text-foreground">Refine</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Refine your edge, daily
                </p>
              </div>
              <a
                href="https://refine.trading"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Try Refine Free
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

      {/* Lightbox for Trade Insight Images */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-6 right-6 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-2xl backdrop-blur-sm border border-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
          >
            <CloseIcon className="w-6 h-6 text-black" />
          </motion.button>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={lightboxImage}
            alt="Chart analysis"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

