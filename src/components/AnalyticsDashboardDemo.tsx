import React from 'react';
import { motion } from 'framer-motion';
import { DashboardGrid } from './DashboardGrid';
import { Settings2, Download, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodFilter {
  label: string;
  days: number;
}

const periodFilters: PeriodFilter[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 },
];

export const AnalyticsDashboardDemo: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodFilter>(periodFilters[2]); // 90D default
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card dark:bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Comprehensive trading performance analysis with TradeZella-quality insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Period Filter */}
              <div className="flex bg-muted/30 rounded-lg p-1">
                {periodFilters.map((period) => (
                  <button
                    key={period.label}
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                      selectedPeriod.label === period.label
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw className={cn(
                    "w-4 h-4",
                    isRefreshing && "animate-spin"
                  )} />
                  <span className="text-sm">Refresh</span>
                </motion.button>
                
                <motion.button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Export</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-6">
        <DashboardGrid />
      </div>

      {/* Footer Info */}
      <div className="border-t border-border bg-card dark:bg-card mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>✨ Enhanced Analytics Dashboard</span>
              <span>•</span>
              <span>Drag & drop tiles to customize layout</span>
              <span>•</span>
              <span>Click customize to show/hide tiles</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Powered by TradZen</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardDemo;