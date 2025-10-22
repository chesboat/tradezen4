/**
 * Shareable Trading Health Card
 * Apple-style social media share for Trading Health
 * Beautiful, crisp, viral-ready design
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Twitter, Linkedin, Copy, Check, Sparkles } from 'lucide-react';
import { HealthRings } from './HealthRings';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface ShareableHealthCardProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: {
    edge: { value: number; label: string };
    consistency: { value: number; label: string };
    riskControl: { value: number; label: string };
    overallScore: number;
  };
  timeWindow: string;
  stats?: {
    totalTrades?: number;
    winRate?: number;
    profitFactor?: number;
  };
}

export const ShareableHealthCard: React.FC<ShareableHealthCardProps> = ({
  isOpen,
  onClose,
  metrics,
  timeWindow,
  stats,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [includeStats, setIncludeStats] = useState(true);

  const timeWindowLabel = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
  }[timeWindow] || 'Last 7 Days';

  // Generate shareable image
  const generateImage = async () => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // High DPI for crisp images
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      return blob;
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refine-trading-health-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Image downloaded!');
  };

  // Copy share text
  const handleCopyText = () => {
    const text = `Just checked my Trading Health on @refine_trading 📊

Edge: ${metrics.edge.value}%
Consistency: ${metrics.consistency.value}%
Risk Control: ${metrics.riskControl.value}%

Track your edge. Try Refine → refine.trading`;

    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  // Share to Twitter
  const handleShareTwitter = async () => {
    const text = `Just checked my Trading Health 📊

Edge: ${metrics.edge.value}%
Consistency: ${metrics.consistency.value}%
Risk Control: ${metrics.riskControl.value}%

Track your edge with @refine_trading 👇`;
    
    const url = 'https://refine.trading';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  // Share to LinkedIn
  const handleShareLinkedIn = () => {
    const url = 'https://refine.trading';
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank');
  };

  // Native share (mobile)
  const handleNativeShare = async () => {
    const blob = await generateImage();
    if (!blob) return;

    const file = new File([blob], 'trading-health.png', { type: 'image/png' });
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Trading Health',
          text: 'Check out my Trading Health on Refine',
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to download
      handleDownload();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Share Your Progress
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Show the world your trading discipline
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Card */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Preview</label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={includeStats}
                        onChange={(e) => setIncludeStats(e.target.checked)}
                        className="rounded"
                      />
                      Include stats
                    </label>
                  </div>

                  {/* Shareable Card Design */}
                  <div 
                    ref={cardRef}
                    className="relative bg-gradient-to-br from-background to-muted/30 rounded-2xl p-8 border-2 border-border"
                  >
                    {/* Watermark Logo */}
                    <div className="absolute top-6 right-6 opacity-20">
                      <div className="w-12 h-12 bg-primary rounded-xl" />
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                      {/* Title */}
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">Trading Health</h3>
                        <p className="text-sm text-muted-foreground">{timeWindowLabel}</p>
                      </div>

                      {/* Rings */}
                      <div className="flex justify-center py-4">
                        <div className="scale-90">
                          <HealthRings
                            edge={metrics.edge.value}
                            consistency={metrics.consistency.value}
                            riskControl={metrics.riskControl.value}
                            size="lg"
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      {includeStats && stats && (
                        <div className="grid grid-cols-3 gap-4">
                          {stats.totalTrades !== undefined && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
                              <div className="text-xs text-muted-foreground">Trades</div>
                            </div>
                          )}
                          {stats.winRate !== undefined && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{stats.winRate.toFixed(0)}%</div>
                              <div className="text-xs text-muted-foreground">Win Rate</div>
                            </div>
                          )}
                          {stats.profitFactor !== undefined && (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-foreground">{stats.profitFactor.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Profit Factor</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-foreground">Track your edge.</div>
                            <div className="text-xs text-muted-foreground">Try Refine</div>
                          </div>
                          <div className="text-sm font-mono text-primary">refine.trading</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Actions */}
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">Share to</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Twitter */}
                    <button
                      onClick={handleShareTwitter}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] text-white rounded-xl hover:bg-[#1a8cd8] transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="font-medium">Twitter</span>
                    </button>

                    {/* LinkedIn */}
                    <button
                      onClick={handleShareLinkedIn}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] text-white rounded-xl hover:bg-[#004182] transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="font-medium">LinkedIn</span>
                    </button>

                    {/* Download */}
                    <button
                      onClick={handleDownload}
                      disabled={isGenerating}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-accent text-foreground rounded-xl hover:bg-accent/70 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span className="font-medium">
                        {isGenerating ? 'Generating...' : 'Download'}
                      </span>
                    </button>

                    {/* Native Share (Mobile) */}
                    {navigator.share && (
                      <button
                        onClick={handleNativeShare}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="font-medium">Share</span>
                      </button>
                    )}

                    {/* Copy Text */}
                    <button
                      onClick={handleCopyText}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors",
                        navigator.share ? "col-span-2" : "",
                        showCopied 
                          ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                          : "bg-accent text-foreground hover:bg-accent/70"
                      )}
                    >
                      {showCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="font-medium">Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-primary">Pro tip:</strong> Share your progress regularly to stay accountable and inspire other traders!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareableHealthCard;

