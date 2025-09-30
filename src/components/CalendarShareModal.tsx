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
  Share
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/localStorageUtils';
import { renderCalendarToDataURL } from '@/lib/share/CalendarRenderer';
import { useTheme } from '@/hooks/useTheme';
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
      
      // Weekend styling (subtle, muted appearance)
      isWeekend && !day.isOtherMonth 
        ? 'border border-dashed border-border/40 bg-muted/20 opacity-60'
        : 'border border-border/50 bg-card',
      
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
        'text-sm font-bold',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrency(pnl)}
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
    backgroundColor: '#0b0b0b',
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

  const handleDownload = async () => {
    const target = getCaptureTarget();
    if (!target) return;
    
    setIsGenerating(true);
    try {
      // Prefer server-side screenshot of this modal preview for pixel-perfect output
      const shareUrl = window.location.origin + window.location.pathname + window.location.search;
      const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=1000&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
      const resp = await fetch(api);
      if (!resp.ok) throw new Error('Screenshot API failed');
      const blob = await resp.blob();
      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `TradeFutura-Calendar-${currentMonth}-${currentYear}.png`;
      link.href = dataUrl;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => link.remove(), 0);
      
      toast.success('Calendar image downloaded!');
    } catch (error) {
      console.error('Error generating calendar image:', error);
      toast.error('Failed to generate calendar image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    const target = getCaptureTarget();
    if (!target) return;
    
    setIsGenerating(true);
    try {
      const shareUrl = window.location.origin + window.location.pathname + window.location.search;
      const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=1000&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
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

  const handleShareToX = async () => {
    const target = getCaptureTarget();
    if (!target) return;
    
    setIsGenerating(true);
    try {
      const shareUrl = window.location.origin + window.location.pathname + window.location.search;
      const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=1000&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
      const resp = await fetch(api);
      if (!resp.ok) throw new Error('Screenshot API failed');
      const blob = await resp.blob();

      // Check clipboard support and try multiple methods
      const hasClipboardSupport =
        typeof window !== 'undefined' &&
        'ClipboardItem' in window &&
        typeof navigator !== 'undefined' &&
        'clipboard' in navigator &&
        typeof (navigator as any).clipboard?.write === 'function';
      
      if (hasClipboardSupport) {
        if (blob) {
            try {
              // Create ClipboardItem with image
              const clipboardItem = new ClipboardItem({
                'image/png': blob
              });
              
              await navigator.clipboard.write([clipboardItem]);
              
              // Open X.com with pre-filled text
              const text = `Check out my trading performance for ${currentMonth} ${currentYear}! 📊 Made ${formatCurrency(monthlyPnL)} with ${totalTrades} trades. Building my edge with TradeFutura 🚀 #TradingJournal #TradeFutura`;
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
              
              // Small delay to ensure clipboard write completes
              setTimeout(() => {
                window.open(twitterUrl, '_blank', 'noopener,noreferrer');
              }, 100);
              
              toast.success('✅ Calendar copied to clipboard! Paste it in your tweet (Ctrl+V / Cmd+V)');
              
            } catch (clipboardError) {
              console.log('Clipboard failed:', clipboardError);
              
              // Fallback to download
              const link = document.createElement('a');
              link.download = `TradeFutura-Calendar-${currentMonth}-${currentYear}.png`;
              link.href = URL.createObjectURL(blob);
              document.body.appendChild(link);
              link.click();
              setTimeout(() => link.remove(), 0);
              
              const text = `Check out my trading performance for ${currentMonth} ${currentYear}! 📊 Made ${formatCurrency(monthlyPnL)} with ${totalTrades} trades. Building my edge with TradeFutura 🚀 #TradingJournal #TradeFutura`;
              const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
              
              window.open(twitterUrl, '_blank', 'noopener,noreferrer');
              toast.success('📎 Calendar downloaded! Drag and drop it into your tweet');
            }
        }
      } else {
        console.log('Clipboard not supported, using download fallback');
        
        // Direct download fallback
        const link = document.createElement('a');
        link.download = `TradeFutura-Calendar-${currentMonth}-${currentYear}.png`;
        const shareUrl = window.location.origin + window.location.pathname + window.location.search;
        const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=1000&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
        const resp = await fetch(api);
        if (!resp.ok) throw new Error('Screenshot API failed');
        const b = await resp.blob();
        link.href = URL.createObjectURL(b);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 0);
        
        const text = `Check out my trading performance for ${currentMonth} ${currentYear}! 📊 Made ${formatCurrency(monthlyPnL)} with ${totalTrades} trades. Building my edge with TradeFutura 🚀 #TradingJournal #TradeFutura`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        toast.success('📎 Calendar downloaded! Attach it to your tweet');
      }
    } catch (error) {
      console.error('Error sharing to X:', error);
      toast.error('Failed to prepare X.com share');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToInstagram = async () => {
    const target = getCaptureTarget();
    if (!target) return;
    
    setIsGenerating(true);
    try {
      // Download the image via server screenshot
      const shareUrl = window.location.origin + window.location.pathname + window.location.search;
      const api = `/api/screenshot-calendar?url=${encodeURIComponent(shareUrl)}&width=1200&height=1000&selector=${encodeURIComponent('[data-share-calendar-card]')}`;
      const resp = await fetch(api);
      if (!resp.ok) throw new Error('Screenshot API failed');
      const blob = await resp.blob();
      const link = document.createElement('a');
      link.download = `TradeFutura-Calendar-${currentMonth}-${currentYear}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      
      toast.success('Calendar downloaded! Upload it to your Instagram story or post');
      
      // Optional: Try to copy suggested caption to clipboard
      const caption = `Trading update for ${currentMonth} ${currentYear} 📊\n\nP&L: ${formatCurrency(monthlyPnL)}\nTrades: ${totalTrades}\n\nBuilding my edge day by day 💪\n\n#TradingJournal #TradeFutura #Trading #Consistency`;
      
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(caption);
          toast.success('Suggested caption copied to clipboard!');
        } catch (err) {
          // Silent fail for caption copy
        }
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      toast.error('Failed to prepare Instagram share');
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
          className="bg-background rounded-xl border max-w-6xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold">Share Calendar</h2>
              <p className="text-sm text-muted-foreground">
                Generate a shareable image of your trading calendar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleShareToX}
                disabled={isGenerating}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share className="w-4 h-4" />
                X.com
              </motion.button>
              <motion.button
                onClick={handleShareToInstagram}
                disabled={isGenerating}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share className="w-4 h-4" />
                Instagram
              </motion.button>
              <motion.button
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Copy className="w-4 h-4" />
                Copy
              </motion.button>
              <motion.button
                onClick={handleDownload}
                disabled={isGenerating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Download'}
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

          {/* Calendar Preview */}
          <div className="p-6">
            <div
              ref={canvasRef}
              className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-12 rounded-2xl w-full flex items-center justify-center"
              style={{ minHeight: '750px', aspectRatio: '6/5' }}
            >
              {/* Calendar Content - Exact replica of CalendarView */}
              <div className="max-w-4xl w-[85%] relative" data-share-calendar-card>
                <div className={`${theme}`}>
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
                      
                      <h1 className="text-2xl font-bold text-foreground">
                        {currentMonth} {currentYear}
                      </h1>
                      
                      <div className="p-2 rounded-lg text-muted-foreground">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg">
                      TODAY
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Monthly stats: <span className="font-semibold text-green-500">{formatCurrency(monthlyPnL)}</span>
                    </div>
                  </div>
                </div>

                {/* Simple Uniform Calendar Grid */}
                <div className="space-y-1">
                  {/* Headers Row */}
                  <div className="grid grid-cols-8 gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                    <div className="text-center font-semibold text-muted-foreground py-2">
                      Week
                    </div>
                  </div>

                  {/* Calendar Rows */}
                  {calendarData.weeks.map((week: any, weekIndex: number) => (
                    <div key={weekIndex} className="grid grid-cols-8 gap-1">
                      {/* Week Days - All 7 days including Saturday */}
                      {week.map((day: any, dayIndex: number) => {
                        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6; // Sunday or Saturday
                        
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            className={`${getDayClassName(day)} aspect-[7/6] w-full`}
                          >
                            <div className="flex flex-col h-full space-y-1">
                              {/* Date */}
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  'text-sm font-medium',
                                  day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                                )}>
                                  {day.date.getDate()}
                                </span>
                                <div className="flex items-center gap-1">
                                  {day.hasNews && (
                                    <CalendarIcon className="w-3 h-3 text-primary" />
                                  )}
                                  {day.hasReflection && (
                                    <BookOpen className="w-3 h-3 text-green-500" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Weekend Content */}
                              {isWeekend ? (
                                <div className="flex flex-col items-center justify-center flex-1 text-center space-y-0.5">
                                  <div className="text-xs text-muted-foreground/70">
                                    Weekend
                                  </div>
                                  {day.quickNotesCount > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {day.quickNotesCount} note{day.quickNotesCount > 1 ? 's' : ''}
                                    </div>
                                  )}
                                  {day.hasReflection && (
                                    <div className="text-xs text-green-600">
                                      Reflection
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* P&L (weekdays only) */}
                                  {formatPnL(day.pnl)}
                                  
                                  {/* Trade Count (weekdays only) */}
                                  {day.tradesCount > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Week Summary */}
                      <div className={cn(
                        'relative p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer bg-card aspect-[7/6] w-full',
                        weeklyData[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                        weeklyData[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10',
                      )}>
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">
                            Week {weeklyData[weekIndex]?.weekNumber}
                          </div>
                          <div className={cn(
                            'text-sm font-bold',
                            weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                            weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                          )}>
                            {formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {weeklyData[weekIndex]?.activeDays || 0} days
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TradeFutura Branding - Inside calendar content */}
                <div className="flex items-center justify-center mt-6">
                  <div className="flex items-center gap-3 bg-accent/50 rounded-full px-6 py-3 border border-border/30">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">TradeFutura</h3>
                      <p className="text-xs text-muted-foreground">Your edge, future-proofed</p>
                    </div>
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
              className="fixed left-0 top-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl"
              style={{ width: 1200, height: 1000, padding: 48, opacity: 0, zIndex: -1000, pointerEvents: 'none' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div className={`${theme}`} style={{ width: 1000 }}>
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
                        Monthly stats: <span className="font-semibold text-green-500">{formatCurrency(monthlyPnL)}</span>
                      </div>
                    </div>

                    {/* Grid */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-8 gap-1">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground py-2">{day}</div>
                        ))}
                        <div className="text-center font-semibold text-muted-foreground py-2">Week</div>
                      </div>

                      {calendarData.weeks.map((week: any, weekIndex: number) => (
                        <div key={`w-${weekIndex}`} className="grid grid-cols-8 gap-1">
                          {week.map((day: any, dayIndex: number) => {
                            const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                            return (
                              <div key={`d-${weekIndex}-${dayIndex}`} className={`${getDayClassName(day)} aspect-[7/6] w-full`}>
                                <div className="flex flex-col h-full space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={cn('text-sm font-medium', day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground')}>{day.date.getDate()}</span>
                                    <div className="flex items-center gap-1">
                                      {day.hasNews && <CalendarIcon className="w-3 h-3 text-primary" />}
                                      {day.hasReflection && <BookOpen className="w-3 h-3 text-green-500" />}
                                    </div>
                                  </div>
                                  {isWeekend ? (
                                    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-0.5">
                                      <div className="text-xs text-muted-foreground/70">Weekend</div>
                                    </div>
                                  ) : (
                                    <>
                                      {formatPnL(day.pnl)}
                                      {day.tradesCount > 0 && (
                                        <div className="text-xs text-muted-foreground">{day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}</div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          <div className={cn('relative p-3 rounded-xl border border-border/50 bg-card aspect-[7/6] w-full',
                              weeklyData[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                              weeklyData[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10')}
                          >
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Week {weeklyData[weekIndex]?.weekNumber}</div>
                              <div className={cn('text-sm font-bold', weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                                {formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">{weeklyData[weekIndex]?.activeDays || 0} days</div>
                            </div>
                          </div>
                        </div>
                      ))}
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
