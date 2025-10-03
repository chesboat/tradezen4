import React from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, Zap } from 'lucide-react';

type Day = {
  date: string | Date;
  pnl: number;
  tradesCount: number;
  winRate: number;
  avgRR: number;
  isOtherMonth?: boolean;
  isWeekend?: boolean;
  hasReflection?: boolean;
};

type WeekSummary = { weekNumber: number; totalPnl: number; activeDays: number };

type RenderData = {
  monthName: string;
  year: number;
  weeks: Day[][];
  weeklySummaries: WeekSummary[];
  monthlyPnl: number;
};

interface ShareCalendarSnapshotProps {
  data?: RenderData;
  theme?: 'light' | 'dark';
  accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono';
}

export const ShareCalendarSnapshot: React.FC<ShareCalendarSnapshotProps> = ({ 
  data: propsData, 
  theme: propsTheme, 
  accentColor: propsAccentColor 
}) => {
  // Support both props (new) and URL params (legacy)
  const params = new URLSearchParams(window.location.search);
  const theme = propsTheme || (params.get('theme') as 'light' | 'dark') || 'dark';
  const accentColor = propsAccentColor || (params.get('accent') as 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono') || 'blue';
  
  let data: RenderData | null = propsData || null;
  
  // If no props data, try URL params (legacy support)
  if (!data) {
    const raw = params.get('data') || '';
    try {
      const json = atob(decodeURIComponent(raw));
      const parsed = JSON.parse(json);
      // Normalize dates
      parsed.weeks = (parsed.weeks || []).map((w: any[]) => w.map((d: any) => {
        const dateObj = typeof d.date === 'string' ? new Date(d.date) : d.date;
        return {
          ...d,
          date: dateObj,
          isWeekend: d.isWeekend ?? (dateObj.getDay() === 0 || dateObj.getDay() === 6)
        };
      }));
      data = parsed;
    } catch (e) {
      console.error('Failed to parse share data:', e);
    }
  } else {
    // Normalize dates from props
    data.weeks = (data.weeks || []).map((w: any[]) => w.map((d: any) => {
      const dateObj = typeof d.date === 'string' ? new Date(d.date) : d.date;
      return {
        ...d,
        date: dateObj,
        isWeekend: d.isWeekend ?? (dateObj.getDay() === 0 || dateObj.getDay() === 6)
      };
    }));
  }

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!data) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme)}>
        <div className="text-muted-foreground">Invalid share data</div>
      </div>
    );
  }

  // Universal gradient
  const gradientClass = theme === 'dark' 
    ? 'from-indigo-950 via-purple-900 to-pink-900' 
    : 'from-blue-100 via-purple-100 to-pink-100';

  // Accent color palette mapping
  const accentColorPalettes = {
    blue: {
      light: { primary: '221.2 83.2% 53.3%', primaryForeground: '210 40% 98%', ring: '221.2 83.2% 53.3%' },
      dark: { primary: '217 91% 60%', primaryForeground: '0 0% 100%', ring: '217 91% 60%' }
    },
    purple: {
      light: { primary: '271 91% 65%', primaryForeground: '210 40% 98%', ring: '271 91% 65%' },
      dark: { primary: '271 91% 70%', primaryForeground: '0 0% 100%', ring: '271 91% 70%' }
    },
    green: {
      light: { primary: '142 76% 36%', primaryForeground: '0 0% 100%', ring: '142 76% 36%' },
      dark: { primary: '142 71% 45%', primaryForeground: '0 0% 100%', ring: '142 71% 45%' }
    },
    orange: {
      light: { primary: '25 95% 53%', primaryForeground: '0 0% 100%', ring: '25 95% 53%' },
      dark: { primary: '25 95% 58%', primaryForeground: '0 0% 100%', ring: '25 95% 58%' }
    },
    red: {
      light: { primary: '0 84% 60%', primaryForeground: '0 0% 100%', ring: '0 84% 60%' },
      dark: { primary: '0 84% 65%', primaryForeground: '0 0% 100%', ring: '0 84% 65%' }
    },
    pink: {
      light: { primary: '330 81% 60%', primaryForeground: '0 0% 100%', ring: '330 81% 60%' },
      dark: { primary: '330 81% 65%', primaryForeground: '0 0% 100%', ring: '330 81% 65%' }
    },
    mono: {
      light: { primary: '0 0% 20%', primaryForeground: '0 0% 100%', ring: '0 0% 20%' },
      dark: { primary: '0 0% 80%', primaryForeground: '0 0% 10%', ring: '0 0% 80%' }
    }
  };

  // Set accent color
  React.useEffect(() => {
    const root = document.documentElement;
    const palette = accentColorPalettes[accentColor][theme];
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--primary-foreground', palette.primaryForeground);
    root.style.setProperty('--ring', palette.ring);
  }, [theme, accentColor]);

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return null;
    return (
      <div className={cn(
        'text-base font-bold tracking-tight',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrency(pnl)}
      </div>
    );
  };

  const getDayClassName = (day: Day) => {
    return cn(
      'relative p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer bg-card',
      day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
      day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
      day.isOtherMonth && 'opacity-40'
    );
  };

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <div className={cn('min-h-screen overflow-x-hidden flex items-center justify-center bg-gradient-to-br', gradientClass, theme)}>
      {/* Match preview exactly */}
      <div className="relative p-6 w-full max-w-6xl flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
        <div className="max-w-5xl w-[92%] relative">
          <div className="bg-background rounded-xl pt-4 pb-6 px-6 border relative" 
            style={{ 
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)',
              filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))'
            }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-foreground">{data.monthName} {data.year}</h1>
                <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">TODAY</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Monthly: <span className={cn("font-semibold", data.monthlyPnl > 0 ? "text-green-500" : data.monthlyPnl < 0 ? "text-red-500" : "text-muted-foreground")}>{formatCurrency(data.monthlyPnl)}</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-8" style={{ gap: '4px', rowGap: '4px' }}>
              {/* Headers Row */}
              {DAYS_OF_WEEK.map((day) => (
                <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground py-2">{day}</div>
              ))}
              <div className="text-center font-semibold text-muted-foreground py-2">Week</div>

              {/* Calendar Rows - flattened into single grid */}
              {data.weeks.map((week, weekIndex) => (
                <React.Fragment key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dayDate = new Date(day.date);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`${getDayClassName(day)} w-full`}
                        style={{ aspectRatio: '6/5', minHeight: '80px', display: 'flex', flexDirection: 'column' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
                          {/* Date - Top Left, subtle */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
                            <span className={cn(
                              'text-xs font-normal leading-none',
                              day.isOtherMonth ? 'text-muted-foreground/60' : 'text-muted-foreground'
                            )}>
                              {dayDate.getDate()}
                            </span>
                            {day.hasReflection && (
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ marginTop: '2px' }} />
                            )}
                          </div>
                          
                          {isWeekend ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                              <div className="text-[10px] text-muted-foreground/50 font-normal">Weekend</div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '4px' }}>
                              {/* P&L - Hero element, large and bold */}
                              {day.pnl !== 0 && (
                                <div className={cn(
                                  'text-base font-bold tracking-tight leading-none whitespace-nowrap',
                                  day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                  {formatCurrency(day.pnl)}
                                </div>
                              )}
                              
                              {/* Trade Count - Very subtle */}
                              {day.tradesCount > 0 && (
                                <div className="text-[10px] text-muted-foreground/50 font-normal leading-none">
                                  {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Week Summary */}
                  <div 
                    className={cn(
                      'relative rounded-xl border border-border/50 bg-card w-full',
                      data.weeklySummaries[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                      data.weeklySummaries[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10',
                    )}
                    style={{ aspectRatio: '6/5', minHeight: '80px', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '4px', padding: '12px' }}>
                      <div className="text-xs font-medium text-muted-foreground">
                        Week {data.weeklySummaries[weekIndex]?.weekNumber}
                      </div>
                      <div className={cn(
                        'text-sm font-bold',
                        data.weeklySummaries[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                        data.weeklySummaries[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                      )}>
                        {formatCurrency(data.weeklySummaries[weekIndex]?.totalPnl || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.weeklySummaries[weekIndex]?.activeDays || 0} days
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Refine Branding */}
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
      
      {/* CTA for conversions - only shown on web, not in screenshots */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/95 via-background/80 to-transparent backdrop-blur-sm border-t border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="font-semibold text-foreground">Track your edge like this trader</div>
            <div className="text-sm text-muted-foreground">Journal, analyze, and refine your trading strategy</div>
          </div>
          <a
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium whitespace-nowrap"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  );
};
