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

export const ShareCalendarSnapshot: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const theme = (params.get('theme') as 'light' | 'dark') || 'dark';
  const accentColor = (params.get('accent') as 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono') || 'blue';
  const raw = params.get('data') || '';
  let data: RenderData | null = null;
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

  return (
    <div className={cn('min-h-screen overflow-x-hidden flex items-center justify-center bg-gradient-to-br', gradientClass, theme)}>
      {/* Match preview exactly */}
      <div className="relative p-8 w-full max-w-5xl flex items-center justify-center" style={{ aspectRatio: '16/10' }}>
        <div className="max-w-4xl w-[85%] relative">
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
            <div className="space-y-1">
              {/* Headers Row */}
              <div className="grid grid-cols-8 gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground py-2">{day}</div>
                ))}
                <div className="text-center font-semibold text-muted-foreground py-2">Week</div>
              </div>

              {/* Calendar Rows */}
              {data.weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-8 gap-1">
                  {week.map((day, dayIndex) => {
                    const dayDate = new Date(day.date);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`${getDayClassName(day)} w-full`}
                        style={{ aspectRatio: '6/5', minHeight: '80px' }}
                      >
                        <div className="flex flex-col h-full justify-between">
                          <div className="flex items-center justify-between px-2 pt-2 flex-shrink-0">
                            <span className={cn('text-sm font-medium', day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground')}>
                              {dayDate.getDate()}
                            </span>
                            <div className="flex items-center gap-1">
                              {day.hasReflection && <BookOpen className="w-3 h-3 text-green-500" />}
                            </div>
                          </div>
                          
                          {isWeekend ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-center pb-2">
                              <div className="text-xs text-muted-foreground/70">Weekend</div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center flex-1 gap-0.5 pb-2">
                              {formatPnL(day.pnl)}
                              {day.tradesCount > 0 && (
                                <div className="text-xs text-muted-foreground text-center">
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
                  <div className={cn(
                    'relative p-3 rounded-xl border border-border/50 bg-card aspect-[6/5] w-full',
                    data.weeklySummaries[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                    data.weeklySummaries[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10',
                  )}>
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
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
                </div>
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
    </div>
  );
};
