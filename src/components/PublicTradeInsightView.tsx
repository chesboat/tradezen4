import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Target,
  Lightbulb,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { PublicShareNav } from './PublicShareNav';

interface TradeInsightData {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  riskRewardRatio: number;
  entryTime: string | Date;
  exitTime: string | Date;
  reviewNote: string;
  reviewImages: string[];
  reviewedAt: string | Date | null;
  tags?: string[];
  strategy?: string;
}

export const PublicTradeInsightView: React.FC = () => {
  // Apple-style: Respect viewer's system preference
  useSystemTheme();
  
  const [data, setData] = useState<TradeInsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  useEffect(() => {
    const loadTradeInsight = async () => {
      try {
        const path = window.location.pathname;
        const shareId = path.split('/').pop();

        if (!shareId) {
          setError('Invalid share link');
          setLoading(false);
          return;
        }

        const { db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const shareRef = doc(db, 'publicShares', shareId);
        const shareDoc = await getDoc(shareRef);

        if (!shareDoc.exists()) {
          setError('Trade insight not found');
          setLoading(false);
          return;
        }

        const shareData = shareDoc.data();
        if (shareData.type !== 'trade-insight') {
          setError('Invalid share type');
          setLoading(false);
          return;
        }

        setData(shareData as TradeInsightData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading trade insight:', err);
        setError('Failed to load trade insight');
        setLoading(false);
      }
    };

    loadTradeInsight();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade insight...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white dark:bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Trade Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'This trade insight may have been removed or is no longer available.'}</p>
          <a
            href="https://tradzen4.vercel.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Visit Refine
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const isWin = data.pnl >= 0;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Navigation for logged-in users */}
      <PublicShareNav />
      
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-500/80 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Trade Insight</h1>
                <p className="text-xs text-muted-foreground">Shared from Refine</p>
              </div>
            </div>
            
            <a
              href="https://tradzen4.vercel.app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all text-sm"
            >
              Try Refine Free
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            {/* Symbol & Direction */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                data.direction === 'long' 
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/20' 
                  : 'bg-gradient-to-br from-red-500/20 to-red-600/20'
              }`}>
                {data.direction === 'long' ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{data.symbol}</h2>
                <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                  {data.direction === 'long' ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                      Long Position
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                      Short Position
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* P&L Hero */}
            <div className="text-center py-8">
              <div className={`text-6xl sm:text-8xl font-bold tabular-nums mb-2 ${
                isWin ? 'text-green-500' : 'text-red-500'
              }`}>
                {isWin ? '+' : ''}{formatCurrency(data.pnl)}
              </div>
              <p className="text-muted-foreground">
                {isWin ? 'Profit' : 'Loss'} • {data.riskRewardRatio.toFixed(1)}:1 R:R
              </p>
            </div>
          </motion.div>

          {/* Chart Images Gallery */}
          {data.reviewImages && data.reviewImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/80 to-blue-500/80 dark:from-purple-500 dark:to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Chart Analysis</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.reviewImages.map((imageUrl, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + idx * 0.1 }}
                    className="relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all"
                    onClick={() => setLightboxImage(idx)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Chart analysis ${idx + 1}`}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="text-white text-sm font-medium">Click to expand</span>
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 w-8 h-8 bg-black/60 backdrop-blur-sm text-white text-sm rounded-full flex items-center justify-center font-medium">
                      {idx + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Key Learnings */}
          {data.reviewNote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/80 to-cyan-500/80 dark:from-blue-500 dark:to-cyan-500 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Key Learnings</h3>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-2xl p-6">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{data.reviewNote}</p>
              </div>
            </motion.div>
          )}

          {/* Trade Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-12"
          >
            <h3 className="text-xl font-semibold text-foreground mb-4">Trade Details</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Entry Price
                </div>
                <div className="text-foreground font-semibold text-lg">${data.entryPrice.toFixed(2)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" />
                  Exit Price
                </div>
                <div className="text-foreground font-semibold text-lg">${data.exitPrice.toFixed(2)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Quantity
                </div>
                <div className="text-foreground font-semibold text-lg">{data.quantity}</div>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Risk:Reward
                </div>
                <div className="text-foreground font-semibold text-lg">{data.riskRewardRatio.toFixed(1)}:1</div>
              </div>
            </div>
            
            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Entry Time
                </div>
                <div className="text-foreground font-medium text-sm">{formatDate(data.entryTime)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-xl p-4">
                <div className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Exit Time
                </div>
                <div className="text-foreground font-medium text-sm">{formatDate(data.exitTime)}</div>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-3xl p-8 sm:p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/80 to-purple-500/80 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Track Your Trading Edge
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Journal trades, analyze charts, and build insights like this with Refine. 
              The trading journal built for serious traders.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://tradzen4.vercel.app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all text-lg shadow-lg shadow-primary/20"
              >
                Start Free Trial
                <ExternalLink className="w-5 h-5" />
              </a>
              
              <a
                href="https://tradzen4.vercel.app/features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-all text-lg"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 mt-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Shared from <span className="font-semibold text-foreground">Refine</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Refine your edge, daily
            </p>
          </div>
        </footer>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage !== null && data.reviewImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-2xl backdrop-blur-sm border border-white/20"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6 text-black" />
            </motion.button>

            {/* Navigation */}
            {data.reviewImages.length > 1 && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute left-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage((lightboxImage - 1 + data.reviewImages.length) % data.reviewImages.length);
                  }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxImage((lightboxImage + 1) % data.reviewImages.length);
                  }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </motion.button>
              </>
            )}

            {/* Image */}
            <motion.img
              key={lightboxImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={data.reviewImages[lightboxImage]}
              alt={`Chart ${lightboxImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Image Counter */}
            {data.reviewImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {lightboxImage + 1} / {data.reviewImages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

