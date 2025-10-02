import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Target, TrendingUp, TrendingDown, Activity, Award, BarChart3, Calendar, Settings2, HelpCircle, Clock, Minus, Zap, Trophy, Info, X, MinusCircle } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { computeEdgeScore } from '@/lib/edgeScore';
import { summarizeWinLossScratch } from '@/lib/utils';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

// Zen Score Info Modal
const ZenScoreInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="w-6 h-6 text-primary" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Zen Score Explained</h2>
            <div className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
              BETA
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">What is the Zen Score?</h3>
            <p className="text-muted-foreground leading-relaxed">
              The Zen Score is TradZen's proprietary metric that evaluates your overall trading performance 
              across multiple dimensions. It combines six key metrics to give you a holistic view of your 
              trading edge, helping you identify strengths and areas for improvement.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">The Six Pillars</h3>
            <div className="grid gap-4">
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Win Rate</h4>
                  <p className="text-sm text-muted-foreground">Percentage of profitable trades. Higher is better, but quality matters more than quantity.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Profit Factor</h4>
                  <p className="text-sm text-muted-foreground">Ratio of gross profits to gross losses. Above 1.0 means profitable overall.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Max Drawdown</h4>
                  <p className="text-sm text-muted-foreground">Largest peak-to-trough decline. Lower drawdowns indicate better risk management.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Average Win/Loss</h4>
                  <p className="text-sm text-muted-foreground">Ratio of average winning trade to average losing trade. Higher ratios are better.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Consistency</h4>
                  <p className="text-sm text-muted-foreground">How stable your returns are over time. Measures volatility of your P&L.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-foreground">Recovery Factor</h4>
                  <p className="text-sm text-muted-foreground">Net profit divided by maximum drawdown. Shows how well you recover from losses.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Score Ranges</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-300">80-100: Excellent</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Professional-level performance</p>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="font-medium text-yellow-700 dark:text-yellow-300">60-79: Good</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Solid trading foundation</p>
              </div>
              
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="font-medium text-orange-700 dark:text-orange-300">40-59: Fair</span>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400">Room for improvement</p>
              </div>
              
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-300">0-39: Needs Work</span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">Focus on risk management</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Pro Tip
            </h4>
            <p className="text-sm text-muted-foreground">
              The Zen Score is designed to be balanced - a trader with a 50% win rate but excellent risk management 
              can score higher than someone with 80% wins but poor position sizing. Focus on improving your weakest areas first.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Tooltip component for metric explanations
const MetricTooltip: React.FC<{ 
  title: string; 
  description: string; 
  calculation: string;
  children: React.ReactNode;
}> = ({ title, description, calculation, children }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState<'right' | 'left'>('right');
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVisible && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Check if tooltip would go off the right edge or under sidebar/other elements
      const wouldGoOffRight = rect.right + 320 + 8 > viewportWidth;
      const wouldGoOffLeft = rect.left - 320 - 8 < 0;
      
      // Prefer right positioning unless it would go off screen
      if (wouldGoOffRight && !wouldGoOffLeft) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [isVisible]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={cn(
            "absolute z-[9999] w-80 p-4 bg-popover border border-border rounded-lg shadow-xl -top-2",
            position === 'right' ? "left-full ml-2" : "right-full mr-2"
          )}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-popover-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Calculation:</span> {calculation}
              </p>
            </div>
          </div>
          {/* Arrow pointing to the element */}
          {position === 'right' ? (
            <div className="absolute top-4 -left-2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-popover" />
          ) : (
            <div className="absolute top-4 -right-2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-popover" />
          )}
        </div>
      )}
    </div>
  );
};

// TradeZella-style half circle with segmented trade counts
const TradeWinHalfCircle: React.FC<{ 
  winCount: number; 
  lossCount: number; 
  breakEvenCount: number;
  winRate: number;
  size?: number;
}> = ({ winCount, lossCount, breakEvenCount, winRate, size = 70 }) => {
  const radius = (size - 8) / 2;
  const totalTrades = winCount + lossCount + breakEvenCount;
  const centerX = size / 2;
  const centerY = size / 2;
  
  if (totalTrades === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-xs text-muted-foreground">No trades</div>
      </div>
    );
  }
  
  // Calculate percentages
  const winPercentage = winCount / totalTrades;
  const breakEvenPercentage = breakEvenCount / totalTrades;
  const lossPercentage = lossCount / totalTrades;
  
  // Half circle circumference
  const circumference = Math.PI * radius;
  
  // Calculate stroke dash arrays for layered approach
  const winLength = winPercentage * circumference;
  const breakEvenLength = breakEvenPercentage * circumference;
  const lossLength = lossPercentage * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Half circle container */}
      <div className="relative mb-1">
        <svg 
          width={size} 
          height={size / 2 + 2}
          viewBox={`0 0 ${size} ${size / 2 + 2}`}
          className="overflow-visible"
        >
          {/* Background half circle */}
          <path
            d={`M 4 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 4} ${centerY}`}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Win segment (green) */}
          {winCount > 0 && (
            <path
              d={`M 4 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 4} ${centerY}`}
              stroke="#22c55e"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${winLength} ${circumference}`}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          )}
          
          {/* Breakeven segment (gray) */}
          {breakEvenCount > 0 && (
            <path
              d={`M 4 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 4} ${centerY}`}
              stroke="#9ca3af"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`0 ${winLength} ${breakEvenLength} ${circumference}`}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          )}
          
          {/* Loss segment (red) */}
          {lossCount > 0 && (
            <path
              d={`M 4 ${centerY} A ${radius} ${radius} 0 0 1 ${size - 4} ${centerY}`}
              stroke="#ef4444"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`0 ${winLength + breakEvenLength} ${lossLength} ${circumference}`}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          )}
        </svg>
      </div>
      
      {/* Trade count indicators */}
      <div className="flex justify-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-medium text-foreground">{winCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="font-medium text-foreground">{breakEvenCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="font-medium text-foreground">{lossCount}</span>
        </div>
      </div>
    </div>
  );
};

// Circular progress component for other percentage metrics
const CircularProgress: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 60 }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  const getColor = (pct: number) => {
    if (pct >= 70) return '#22c55e'; // green
    if (pct >= 50) return '#eab308'; // yellow  
    return '#ef4444'; // red
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// Profit Factor circular progress - shows win/loss ratio like TradeZella
const ProfitFactorProgress: React.FC<{ 
  winCount: number; 
  lossCount: number; 
  profitFactor: number;
  size?: number 
}> = ({ winCount, lossCount, profitFactor, size = 60 }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const totalTrades = winCount + lossCount;
  
  if (totalTrades === 0) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <div className="text-xs text-muted-foreground text-center">No trades</div>
      </div>
    );
  }
  
  const winPercentage = (winCount / totalTrades) * 100;
  const lossPercentage = (lossCount / totalTrades) * 100;
  
  const winStrokeDasharray = `${(winPercentage / 100) * circumference} ${circumference}`;
  const lossStrokeDasharray = `${(lossPercentage / 100) * circumference} ${circumference}`;
  const lossStrokeDashoffset = -((winPercentage / 100) * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Win segment (green) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#22c55e"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={winStrokeDasharray}
          strokeLinecap="butt"
          className="transition-all duration-700"
        />
        {/* Loss segment (red) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ef4444"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={lossStrokeDasharray}
          strokeDashoffset={lossStrokeDashoffset}
          strokeLinecap="butt"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground">{profitFactor.toFixed(1)}</span>
      </div>
    </div>
  );
};

// Mini bar chart component
const MiniBarChart: React.FC<{ data: number[]; height?: number }> = ({ data, height = 40 }) => {
  const max = Math.max(...data.map(Math.abs));
  const min = Math.min(...data);
  
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.slice(-10).map((value, index) => {
        const barHeight = max > 0 ? Math.abs(value / max) * height : 0;
        const isPositive = value >= 0;
        
        return (
          <div
            key={index}
            className={cn(
              "w-2 rounded-sm transition-all duration-300",
              isPositive ? "bg-green-500" : "bg-red-500"
            )}
            style={{ height: Math.max(2, barHeight) }}
          />
        );
      })}
    </div>
  );
};

// Win/Loss comparison bar - like TradeZella's avg win/loss trade visual
const WinLossBar: React.FC<{ 
  avgWin: number; 
  avgLoss: number; 
  ratio: number;
}> = ({ avgWin, avgLoss, ratio }) => {
  // Calculate proportions for the bar
  const totalAmount = avgWin + Math.abs(avgLoss);
  const winPercent = totalAmount > 0 ? (avgWin / totalAmount) * 100 : 50;
  const lossPercent = 100 - winPercent;
  
  return (
    <div className="w-full">
      {/* Horizontal bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
        <div 
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-700"
          style={{ width: `${winPercent}%` }}
        />
        <div 
          className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-700"
          style={{ width: `${lossPercent}%` }}
        />
      </div>
      
      {/* Amount labels */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-green-600 font-medium">
          ${Math.abs(avgWin).toFixed(0)}
        </span>
        <span className="text-red-600 font-medium">
          -${Math.abs(avgLoss).toFixed(0)}
        </span>
      </div>
    </div>
  );
};

// Clean metric tile component - TradeZella style with visuals
const MetricTile: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
  isPositive?: boolean;
  visualType?: 'circular' | 'bars' | 'tradeWin' | 'profitFactor' | 'winLoss' | 'none';
  visualData?: number | number[] | { winCount: number; lossCount: number; breakEvenCount: number; winRate: number } | { winCount: number; lossCount: number; profitFactor: number } | { avgWin: number; avgLoss: number; ratio: number };
  tooltip?: {
    title: string;
    description: string;
    calculation: string;
  };
}> = ({ title, value, icon, format = 'number', isPositive, visualType = 'none', visualData, tooltip }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency': return formatCurrency(val);
      case 'percentage': return `${val.toFixed(1)}%`;
      case 'number': return typeof val === 'number' ? val.toFixed(2) : val;
      default: return typeof val === 'number' ? val.toFixed(2) : val;
    }
  };

  const renderVisual = () => {
    if (visualType === 'circular' && typeof visualData === 'number') {
      return <CircularProgress percentage={visualData} />;
    }
    if (visualType === 'bars' && Array.isArray(visualData)) {
      return <MiniBarChart data={visualData} />;
    }
    if (visualType === 'tradeWin' && visualData && typeof visualData === 'object' && !Array.isArray(visualData)) {
      const data = visualData as { winCount: number; lossCount: number; breakEvenCount: number; winRate: number };
      return (
        <TradeWinHalfCircle
          winCount={data.winCount}
          lossCount={data.lossCount}
          breakEvenCount={data.breakEvenCount}
          winRate={data.winRate}
        />
      );
    }
    if (visualType === 'profitFactor' && visualData && typeof visualData === 'object' && !Array.isArray(visualData)) {
      const data = visualData as { winCount: number; lossCount: number; profitFactor: number };
      return (
        <ProfitFactorProgress
          winCount={data.winCount}
          lossCount={data.lossCount}
          profitFactor={data.profitFactor}
        />
      );
    }
    if (visualType === 'winLoss' && visualData && typeof visualData === 'object' && !Array.isArray(visualData)) {
      const data = visualData as { avgWin: number; avgLoss: number; ratio: number };
      return (
        <WinLossBar
          avgWin={data.avgWin}
          avgLoss={data.avgLoss}
          ratio={data.ratio}
        />
      );
    }
    return null;
  };

  const tileContent = (
    <motion.div
      className="bg-background rounded-xl border border-border p-6 hover:border-primary/30 transition-all duration-200 h-full min-h-[140px] flex flex-col"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4 min-h-[24px]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-muted-foreground flex-shrink-0">{icon}</div>
          {tooltip && (
            <HelpCircle className="w-4 h-4 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
        </div>
        <div className="flex-shrink-0 flex items-center justify-center min-h-[60px]">
          {renderVisual()}
        </div>
      </div>
      <div className="space-y-2 mt-auto">
        <div className={cn(
          "text-2xl font-bold leading-tight",
          isPositive === true ? "text-green-600" : 
          isPositive === false ? "text-red-600" : 
          "text-foreground"
        )}>
          {formatValue(value)}
        </div>
        <div className="text-sm text-muted-foreground leading-tight">{title}</div>
      </div>
    </motion.div>
  );

  if (tooltip) {
    return (
      <MetricTooltip
        title={tooltip.title}
        description={tooltip.description}
        calculation={tooltip.calculation}
      >
        {tileContent}
      </MetricTooltip>
    );
  }

  return tileContent;
};

// Clean Edge Score Radar Chart with theme colors
const EdgeScoreChart: React.FC<{ trades: any[] }> = ({ trades }) => {
  const edge = React.useMemo(() => computeEdgeScore(trades), [trades]);
  const [showInfoModal, setShowInfoModal] = React.useState(false);

  const data = [
    { metric: 'Win %', value: edge.breakdown.winRate },
    { metric: 'Profit Factor', value: edge.breakdown.profitFactor },
    { metric: 'Max Drawdown', value: edge.breakdown.maxDrawdown },
    { metric: 'Avg W/L', value: edge.breakdown.avgWinLoss },
    { metric: 'Consistency', value: edge.breakdown.consistency },
    { metric: 'Recovery', value: edge.breakdown.recoveryFactor },
  ];

  return (
    <>
      <div className="bg-background rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Award className="w-5 h-5 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Zen Score</h3>
            <div className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
              BETA
            </div>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Learn about Zen Score"
            >
              <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div 
            className="text-3xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => setShowInfoModal(true)}
            title="Click to learn more"
          >
            {edge.score}
          </div>
        </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            {/* Custom grid with subtle styling */}
            <PolarGrid 
              stroke="currentColor" 
              strokeOpacity={0.08}
              strokeWidth={1}
              gridType="polygon"
            />
            
            {/* Metric labels with better positioning */}
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ 
                fill: 'currentColor', 
                fontSize: 12, 
                opacity: 0.8,
                fontWeight: 500
              }}
              tickSize={8}
            />
            
            {/* Hidden radius axis for cleaner look */}
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false} 
            />
            
            {/* Main radar area with gradient effect */}
            <Radar 
              name="Zen Score" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              fill="url(#zenGradient)"
              fillOpacity={0.25}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ 
                fill: 'hsl(var(--primary))', 
                strokeWidth: 3, 
                stroke: 'hsl(var(--background))',
                r: 5,
                className: "drop-shadow-sm"
              }}
            />
            
            {/* Subtle tooltip */}
            <RechartsTooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '13px',
                color: 'hsl(var(--popover-foreground))',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                backdropFilter: 'blur(8px)'
              }}
              labelStyle={{ 
                color: 'hsl(var(--primary))', 
                fontWeight: 600,
                marginBottom: '4px'
              }}
            />
            
            {/* Custom gradient definition */}
            <defs>
              <radialGradient id="zenGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              </radialGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
    
    <ZenScoreInfoModal 
      isOpen={showInfoModal} 
      onClose={() => setShowInfoModal(false)} 
    />
  </>
  );
};

// Clean P&L Chart with theme colors
const PnLChart: React.FC<{ trades: any[] }> = ({ trades }) => {
  const [mode, setMode] = React.useState<'daily' | 'cumulative'>('daily');
  
  const chartData = React.useMemo(() => {
    if (trades.length === 0) return [];
    
    if (mode === 'daily') {
      const dailyData = new Map<string, number>();
      trades.forEach(trade => {
        const dateStr = new Date(trade.entryTime).toISOString().split('T')[0];
        dailyData.set(dateStr, (dailyData.get(dateStr) || 0) + (trade.pnl || 0));
      });
      return Array.from(dailyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30) // Last 30 days
        .map(([date, pnl]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pnl
        }));
    } else {
      let cumulative = 0;
      return trades
        .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
        .slice(-30) // Last 30 trades
        .map(trade => {
          cumulative += (trade.pnl || 0);
          return {
            date: new Date(trade.entryTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            pnl: cumulative
          };
        });
    }
  }, [trades, mode]);

  return (
    <div className="bg-background rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            {mode === 'daily' ? 'Daily net cumulative P&L' : 'Net daily P&L'}
          </h3>
        </div>
        <div className="flex bg-muted rounded-lg p-1">
          {(['daily', 'cumulative'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1 rounded text-sm font-medium transition-colors',
                mode === m 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'daily' ? 'Daily' : 'Cumulative'}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'currentColor', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'currentColor', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--popover-foreground))'
              }}
              formatter={(value: any) => [formatCurrency(value), 'P&L']}
            />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Recent Trades component styled like the main trades table
const RecentTrades: React.FC<{ trades: any[] }> = ({ trades }) => {
  const recentTrades = React.useMemo(() => {
    return trades
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .slice(0, 8); // Show last 8 trades to fit height
  }, [trades]);

  const getTradeStatus = (pnl: number) => {
    if (Math.abs(pnl) < 0.01) return 'scratch'; // Breakeven/scratch
    return pnl > 0 ? 'win' : 'loss';
  };

  return (
    <div className="bg-background rounded-xl border border-border p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Recent Trades</h3>
      </div>
      
      {recentTrades.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No trades found
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Symbol</th>
                <th className="text-left py-3 px-3 text-sm font-medium text-muted-foreground">Side</th>
                <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">P&L</th>
                <th className="text-right py-3 px-3 text-sm font-medium text-muted-foreground">R:R</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, index) => {
                const status = getTradeStatus(trade.pnl || 0);
                return (
                  <motion.tr
                    key={trade.id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3 text-sm">
                      <div>{new Date(trade.entryTime).toLocaleDateString()}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-2">
                        {trade.symbol || 'Unknown'}
                        {status === 'scratch' && (
                          <div className="group relative">
                            <MinusCircle className="w-4 h-4 text-yellow-500/60" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              Scratch (excluded from win rate)
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        trade.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {trade.direction?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className={cn(
                      "p-3 text-right font-medium",
                      status === 'win' ? "text-green-500" :
                      status === 'loss' ? "text-red-500" :
                      "text-muted-foreground"
                    )}>
                      {formatCurrency(trade.pnl || 0)}
                    </td>
                    <td className="p-3 text-right text-sm text-muted-foreground">
                      {Number.isFinite(trade.riskRewardRatio) ? trade.riskRewardRatio.toFixed(2) : '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Streaks & Patterns component
const StreaksAndPatterns: React.FC<{ trades: any[] }> = ({ trades }) => {
  const patterns = React.useMemo(() => {
    if (trades.length === 0) {
      return {
        bestWinStreak: 0,
        worstLossStreak: 0,
        avgHoldTime: '0h',
        bestDay: { date: '', pnl: 0 },
        worstDay: { date: '', pnl: 0 }
      };
    }

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let bestWinStreak = 0;
    let worstLossStreak = 0;

    // Sort trades by date for streak calculation
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

    sortedTrades.forEach(trade => {
      const pnl = trade.pnl || 0;
      if (pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        bestWinStreak = Math.max(bestWinStreak, currentWinStreak);
      } else if (pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        worstLossStreak = Math.max(worstLossStreak, currentLossStreak);
      }
    });

    // Calculate daily P&L for best/worst days
    const dailyPnL = new Map<string, number>();
    trades.forEach(trade => {
      const date = new Date(trade.entryTime).toISOString().split('T')[0];
      dailyPnL.set(date, (dailyPnL.get(date) || 0) + (trade.pnl || 0));
    });

    const dailyResults = Array.from(dailyPnL.entries()).map(([date, pnl]) => ({ date, pnl }));
    const bestDay = dailyResults.reduce((best, day) => day.pnl > best.pnl ? day : best, { date: '', pnl: -Infinity });
    const worstDay = dailyResults.reduce((worst, day) => day.pnl < worst.pnl ? day : worst, { date: '', pnl: Infinity });

    // Calculate average hold time (simplified - assuming same day trades)
    const avgHoldTime = '0.4h'; // Placeholder

    return {
      bestWinStreak,
      worstLossStreak,
      avgHoldTime,
      bestDay: bestDay.pnl === -Infinity ? { date: '', pnl: 0 } : bestDay,
      worstDay: worstDay.pnl === Infinity ? { date: '', pnl: 0 } : worstDay
    };
  }, [trades]);

  return (
    <div className="bg-background rounded-xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Streaks & Patterns</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Best Win Streak:</span>
          <span className="font-semibold text-green-600">{patterns.bestWinStreak}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Worst Loss Streak:</span>
          <span className="font-semibold text-red-600">{patterns.worstLossStreak}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Avg Hold Time:</span>
          <span className="font-semibold text-foreground">{patterns.avgHoldTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Best Day:</span>
          <span className="font-semibold text-green-600">{formatCurrency(patterns.bestDay.pnl)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Worst Day:</span>
          <span className="font-semibold text-red-600">{formatCurrency(patterns.worstDay.pnl)}</span>
        </div>
      </div>
    </div>
  );
};

// Top Performing Symbols component
const TopPerformingSymbols: React.FC<{ trades: any[] }> = ({ trades }) => {
  const topSymbols = React.useMemo(() => {
    if (trades.length === 0) return [];

    // Group trades by symbol
    const symbolStats = new Map<string, { pnl: number; trades: number; winRate: number; wins: number }>();
    
    trades.forEach(trade => {
      const symbol = trade.symbol || 'Unknown';
      const pnl = trade.pnl || 0;
      const existing = symbolStats.get(symbol) || { pnl: 0, trades: 0, winRate: 0, wins: 0 };
      
      existing.pnl += pnl;
      existing.trades += 1;
      if (pnl > 0) existing.wins += 1;
      existing.winRate = (existing.wins / existing.trades) * 100;
      
      symbolStats.set(symbol, existing);
    });

    // Convert to array and sort by P&L
    return Array.from(symbolStats.entries())
      .map(([symbol, stats]) => ({ symbol, ...stats }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 4); // Top 4 symbols
  }, [trades]);

  return (
    <div className="bg-background rounded-xl border border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Top Performing Symbols</h3>
      </div>
      
      <div className="space-y-4">
        {topSymbols.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No symbols found
          </div>
        ) : (
          topSymbols.map((symbolData, index) => (
            <div key={symbolData.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-foreground">{symbolData.symbol}</div>
                  <div className="text-sm text-muted-foreground">
                    {symbolData.winRate.toFixed(0)}% • {symbolData.trades} trades
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "font-semibold",
                  symbolData.pnl > 0 ? "text-green-600" : 
                  symbolData.pnl < 0 ? "text-red-600" : 
                  "text-muted-foreground"
                )}>
                  {formatCurrency(symbolData.pnl)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const CleanAnalyticsDashboard: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const [selectedPeriod, setSelectedPeriod] = React.useState<'7d' | '30d' | '90d' | '1y' | 'all'>('all');

  // Time period options
  const timePeriods = [
    { value: '7d' as const, label: '7D' },
    { value: '30d' as const, label: '30D' },
    { value: '90d' as const, label: '90D' },
    { value: '1y' as const, label: '1Y' },
    { value: 'all' as const, label: 'All' },
  ];
  
  const filteredTrades = React.useMemo(() => {
    let filtered = trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId);
    
    // Apply time period filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(trade => new Date(trade.entryTime) >= cutoffDate);
    }
    
    return filtered;
  }, [trades, selectedAccountId, selectedPeriod]);

  const metrics = React.useMemo(() => {
    if (filteredTrades.length === 0) {
      return { 
        totalPnL: 0, 
        winRate: 0, 
        profitFactor: 0, 
        maxDrawdown: 0, 
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        breakEvenCount: 0
      };
    }

    const { wins: winCount, losses: lossCount, scratches: breakEvenCount, winRateExclScratches } = summarizeWinLossScratch(filteredTrades);
    
    // Debug log to check the trade counts
    // console.log('Trade counts:', { winCount, lossCount, breakEvenCount, total: filteredTrades.length, winRate: winRateExclScratches });
    // console.log('Percentages:', { 
    //   winPct: (winCount / (winCount + lossCount + breakEvenCount) * 100).toFixed(1),
    //   bePct: (breakEvenCount / (winCount + lossCount + breakEvenCount) * 100).toFixed(1),
    //   lossPct: (lossCount / (winCount + lossCount + breakEvenCount) * 100).toFixed(1)
    // });
    const winTrades = filteredTrades.filter(t => (t.pnl || 0) > 0);
    const lossTrades = filteredTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winTrades.length : 0;
    const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / lossTrades.length : 0;
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin * winTrades.length) / Math.abs(avgLoss * lossTrades.length) : 0;
    
    // Calculate max drawdown
    let equity = 0, peak = 0, maxDrawdown = 0;
    filteredTrades.forEach(trade => {
      equity += (trade.pnl || 0);
      if (equity > peak) peak = equity;
      if (peak > 0) maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
    });

    // Calculate win/loss ratio
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalPnL,
      winRate: winRateExclScratches,
      profitFactor,
      maxDrawdown,
      totalTrades: filteredTrades.length,
      winCount,
      lossCount,
      breakEvenCount,
      avgWin,
      avgLoss,
      winLossRatio
    };
  }, [filteredTrades]);

  // Generate sample data for visuals
  const dailyPnLData = React.useMemo(() => {
    const dailyData = new Map<string, number>();
    filteredTrades.forEach(trade => {
      const dateStr = new Date(trade.entryTime).toISOString().split('T')[0];
      dailyData.set(dateStr, (dailyData.get(dateStr) || 0) + (trade.pnl || 0));
    });
    
    // Sort dates chronologically and take the last 10 days
    const sortedEntries = Array.from(dailyData.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-10);
    
    return sortedEntries.map(([_, pnl]) => pnl);
  }, [filteredTrades]);

  // Calculate daily win rate metrics
  const dailyMetrics = React.useMemo(() => {
    const dailyData = new Map<string, { pnl: number; trades: number }>();
    filteredTrades.forEach(trade => {
      const dateStr = new Date(trade.entryTime).toISOString().split('T')[0];
      const existing = dailyData.get(dateStr) || { pnl: 0, trades: 0 };
      dailyData.set(dateStr, {
        pnl: existing.pnl + (trade.pnl || 0),
        trades: existing.trades + 1
      });
    });
    
    const dailyResults = Array.from(dailyData.values());
    const winDays = dailyResults.filter(day => day.pnl > 0).length;
    const lossDays = dailyResults.filter(day => day.pnl < 0).length;
    const breakEvenDays = dailyResults.filter(day => day.pnl === 0).length;
    const totalDays = dailyResults.length;
    const dayWinRate = totalDays > 0 ? (winDays / totalDays) * 100 : 0;
    
    return {
      winDays,
      lossDays,
      breakEvenDays,
      totalDays,
      dayWinRate
    };
  }, [filteredTrades]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Time Period Filters */}
      <div className="bg-popover border-b border-border">
        <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2600px] mx-auto px-6 2xl:px-8 3xl:px-10 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Last import: Aug 15, 2025 07:09 AM</span>
              <button className="text-sm text-primary hover:text-primary/80">Resync</button>
            </div>
          </div>
          
          {/* Time Period Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Period:</span>
            {timePeriods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-colors",
                  selectedPeriod === period.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2600px] mx-auto px-6 2xl:px-8 3xl:px-10 py-8">
        {/* Top 5 Metric Tiles - TradeZella Style with Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8 items-stretch">
          <MetricTile
            title="Net P&L"
            value={metrics.totalPnL}
            icon={<DollarSign className="w-5 h-5" />}
            format="currency"
            isPositive={metrics.totalPnL > 0}
            visualType="bars"
            visualData={dailyPnLData}
            tooltip={{
              title: "Net Profit & Loss",
              description: "Your total profit or loss across all trades. This is the sum of all your winning trades minus all your losing trades.",
              calculation: "Sum of all trade P&L = (Win 1 + Win 2 + ...) - (Loss 1 + Loss 2 + ...)"
            }}
          />
          <MetricTile
            title="Trade win %"
            value={metrics.winRate}
            icon={<Target className="w-5 h-5" />}
            format="percentage"
            visualType="tradeWin"
            visualData={{
              winCount: metrics.winCount,
              lossCount: metrics.lossCount,
              breakEvenCount: metrics.breakEvenCount,
              winRate: metrics.winRate
            }}
            tooltip={{
              title: "Trade Win Rate",
              description: "The percentage of your trades that were profitable. This excludes breakeven trades (scratches) from the calculation.",
              calculation: "(Number of Winning Trades ÷ Total Trades) × 100"
            }}
          />
          <MetricTile
            title="Profit factor"
            value={metrics.profitFactor}
            icon={<TrendingUp className="w-5 h-5" />}
            format="number"
            visualType="profitFactor"
            visualData={{
              winCount: metrics.winCount,
              lossCount: metrics.lossCount,
              profitFactor: metrics.profitFactor
            }}
            tooltip={{
              title: "Profit Factor",
              description: "A ratio showing how much profit you make for every dollar you lose. A profit factor above 1.0 means you're profitable overall.",
              calculation: "Total Gross Profit ÷ Total Gross Loss"
            }}
          />
          <MetricTile
            title="Days win %"
            value={dailyMetrics.dayWinRate}
            icon={<Calendar className="w-5 h-5" />}
            format="percentage"
            visualType="tradeWin"
            visualData={{
              winCount: dailyMetrics.winDays,
              lossCount: dailyMetrics.lossDays,
              breakEvenCount: dailyMetrics.breakEvenDays,
              winRate: dailyMetrics.dayWinRate
            }}
            tooltip={{
              title: "Daily Win Rate",
              description: "The percentage of trading days where you ended with a net profit. This measures your consistency on a daily basis.",
              calculation: "(Number of Profitable Days ÷ Total Trading Days) × 100"
            }}
          />
          <MetricTile
            title="Avg win/loss trade"
            value={metrics.winLossRatio ?? 0}
            icon={<Activity className="w-5 h-5" />}
            format="number"
            visualType="winLoss"
            visualData={{
              avgWin: metrics.avgWin ?? 0,
              avgLoss: metrics.avgLoss ?? 0,
              ratio: metrics.winLossRatio ?? 0,
            }}
            tooltip={{
              title: "Average Win/Loss Ratio",
              description: "How much you make on average per winning trade compared to how much you lose per losing trade. A higher ratio means your wins are larger than your losses.",
              calculation: "Average Win Amount ÷ Average Loss Amount"
            }}
          />
        </div>

        {/* Main Charts - TradeZella Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EdgeScoreChart trades={filteredTrades} />
          <PnLChart trades={filteredTrades} />
        </div>

        {/* Bottom Section: Recent Trades + Streaks & Top Symbols */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentTrades trades={filteredTrades} />
          </div>
          <div className="space-y-6">
            <StreaksAndPatterns trades={filteredTrades} />
            <TopPerformingSymbols trades={filteredTrades} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanAnalyticsDashboard;
