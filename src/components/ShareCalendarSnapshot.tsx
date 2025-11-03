import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

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
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    root.style.setProperty('--primary', palette.primary, 'important');
    root.style.setProperty('--primary-foreground', palette.primaryForeground, 'important');
    root.style.setProperty('--ring', palette.ring, 'important');
  }, [theme, accentColor]);

  const formatCurrency = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    const abs = Math.abs(amount);
    
    if (abs >= 1000) {
      return `${sign}$${(abs / 1000).toFixed(1)}k`;
    }
    
    return `${sign}$${Math.round(abs)}`;
  };

  const getDayClassName = (day: Day) => {
    const dayDate = new Date(day.date);
    const today = new Date();
    const isToday = dayDate.getDate() === today.getDate() && 
                    dayDate.getMonth() === today.getMonth() && 
                    dayDate.getFullYear() === today.getFullYear();
    
    return cn(
      'relative p-2 rounded-lg border transition-all duration-200',
      theme === 'dark' ? 'bg-zinc-900/50' : 'bg-white',
      'border-border/50',
      isToday && 'border-primary ring-2 ring-primary/50',
      !isToday && day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
      !isToday && day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
      day.isOtherMonth && 'opacity-40'
    );
  };

  // Apply theme to document
  React.useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Get accent color values for inline styles
  const accentPalette = accentColorPalettes[accentColor][theme];
  
  // ============================================================
  // DESKTOP LAYOUT (≥768px) - Original beautiful grid
  // ============================================================
  if (!isMobile) {
    return (
      <div className={cn('min-h-screen overflow-x-hidden flex items-start justify-center bg-gradient-to-br', gradientClass, theme)} style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="relative w-full h-full flex items-start justify-center">
          <div 
            className="w-full relative"
            style={{
              maxWidth: '1000px',
              transform: 'scale(0.82)',
              transformOrigin: 'top center'
            }}
          >
            <div 
              className="bg-background rounded-xl pt-4 pb-6 px-6 border relative" 
              style={{ 
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)',
                filter: 'drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15))',
                '--primary': accentPalette.primary,
                '--primary-foreground': accentPalette.primaryForeground,
                '--ring': accentPalette.ring,
              } as React.CSSProperties
            }>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-foreground">{data.monthName} {data.year}</h1>
                  <div className="px-5 py-2.5 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-base font-medium leading-none">TODAY</div>
                </div>
                <div className="text-base text-muted-foreground">
                  Monthly: <span className={cn("font-semibold", data.monthlyPnl > 0 ? "text-green-500" : data.monthlyPnl < 0 ? "text-red-500" : "text-muted-foreground")}>{formatCurrency(data.monthlyPnl)}</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-8" style={{ gap: '4px', rowGap: '4px' }}>
                {/* Headers Row */}
                {DAYS_OF_WEEK.map((day) => (
                  <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground text-sm" style={{ paddingTop: '8px', paddingBottom: '8px' }}>{day}</div>
                ))}
                <div className="text-center font-semibold text-muted-foreground text-sm" style={{ paddingTop: '8px', paddingBottom: '8px' }}>Week</div>

                {/* Calendar Rows */}
                {data.weeks.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      const dayDate = new Date(day.date);
                      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                      return (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`${getDayClassName(day)} w-full`}
                          style={{ aspectRatio: '1', minHeight: '50px', display: 'flex', flexDirection: 'column' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4px 6px' }}>
                            {/* Date - Top Left */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'auto' }}>
                              <span className={cn(
                                'text-sm font-normal leading-none',
                                day.isOtherMonth ? 'text-muted-foreground/60' : 'text-muted-foreground'
                              )}>
                                {dayDate.getDate()}
                              </span>
                              {day.hasReflection && (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              )}
                            </div>
                            
                            {isWeekend ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                                <div className="text-[10px] text-muted-foreground/50 font-normal">Weekend</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '4px' }}>
                                {/* P&L */}
                                {day.pnl !== 0 && (
                                  <div 
                                    className={cn(
                                      'font-bold tracking-tight leading-none',
                                      day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                                    )}
                                    style={{
                                      fontSize: '26px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '100%'
                                    }}
                                  >
                                    {formatCurrency(day.pnl)}
                                  </div>
                                )}
                                
                                {/* Trade Count */}
                                {day.tradesCount > 0 && (
                                  <div className="text-base text-muted-foreground/50 font-normal leading-none">
                                    {day.tradesCount}t
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
                        'relative rounded-lg border border-border/50 bg-card w-full',
                        data.weeklySummaries[weekIndex]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                        data.weeklySummaries[weekIndex]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10',
                      )}
                      style={{ aspectRatio: '1', minHeight: '50px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '4px', padding: '12px' }}>
                        <div className="text-xs font-medium text-muted-foreground leading-none">
                          W{data.weeklySummaries[weekIndex]?.weekNumber}
                        </div>
                        <div 
                          className={cn(
                            'font-bold',
                            data.weeklySummaries[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                            data.weeklySummaries[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                          )}
                          style={{
                            fontSize: '16px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                        >
                          {formatCurrency(data.weeklySummaries[weekIndex]?.totalPnl || 0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground leading-none">
                          {data.weeklySummaries[weekIndex]?.activeDays || 0}d
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
        
        {/* CTA - Desktop only */}
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
  }

  // ============================================================
  // MOBILE LAYOUT (<768px) - Card-based, stacked, NO OVERLAPS
  // ============================================================
  return (
    <div className={cn('min-h-screen overflow-x-hidden flex flex-col items-center justify-start bg-gradient-to-br p-4', gradientClass, theme)}>
      <div className="w-full max-w-md">
        <div 
          className="bg-background rounded-xl pt-4 pb-4 px-4 border" 
          style={{ 
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
            '--primary': accentPalette.primary,
            '--primary-foreground': accentPalette.primaryForeground,
            '--ring': accentPalette.ring,
          } as React.CSSProperties
        }>
          {/* Mobile Header */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h1 className="text-xl font-bold text-foreground">{data.monthName} {data.year}</h1>
              <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium leading-none whitespace-nowrap">TODAY</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Monthly: <span className={cn("font-semibold text-sm", data.monthlyPnl > 0 ? "text-green-500" : data.monthlyPnl < 0 ? "text-red-500" : "text-muted-foreground")}>{formatCurrency(data.monthlyPnl)}</span>
            </div>
          </div>

          {/* Day headers - Mon-Fri + Week */}
          <div className="grid grid-cols-6 gap-1 mb-3">
            {DAYS_OF_WEEK.slice(1, 6).map((day) => (
              <div key={`h-${day}`} className="text-center font-semibold text-muted-foreground text-[11px] py-1">
                {day}
              </div>
            ))}
            <div className="text-center font-semibold text-muted-foreground text-[11px] py-1">
              Week
            </div>
          </div>

          {/* Calendar - Weeks stacked vertically */}
          <div className="space-y-3">
            {data.weeks.map((week, weekIndex) => (
              <div key={weekIndex}>
                {/* Week grid - 6 columns (Mon-Fri + Week Summary), square tiles */}
                <div className="grid grid-cols-6 gap-1">
                  {/* Mon-Fri only (indices 1-5) */}
                  {week.slice(1, 6).map((day, dayIndex) => {
                    const dayDate = new Date(day.date);
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={cn(
                          getDayClassName(day),
                          'w-full flex flex-col items-center justify-between h-16 text-center relative overflow-hidden'
                        )}
                      >
                        {/* Date number - top */}
                        <span className={cn(
                          'text-xs font-semibold leading-none pt-1',
                          day.isOtherMonth ? 'text-muted-foreground/40' : 'text-muted-foreground'
                        )}>
                          {dayDate.getDate()}
                        </span>

                        {/* Center content */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 px-0.5">
                          {isWeekend ? (
                            <span className="text-[8px] text-muted-foreground/50 font-normal">wknd</span>
                          ) : (
                            <>
                              {/* P&L - HERO, never overlaps */}
                              {day.pnl !== 0 && (
                                <span className={cn(
                                  'text-xs font-bold leading-none truncate w-full',
                                  day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                  {formatCurrency(day.pnl)}
                                </span>
                              )}
                              
                              {/* Trade count - subtle, small */}
                              {day.tradesCount > 0 && (
                                <span className="text-[7px] text-muted-foreground/60 font-normal leading-none">
                                  {day.tradesCount}t
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Reflection indicator - bottom corner */}
                        {day.hasReflection && !day.isOtherMonth && (
                          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-green-500" />
                        )}
                      </div>
                    );
                  })}

                  {/* Week Summary - 6th column (rightmost) */}
                  <div 
                    className={cn(
                      'rounded-lg border flex flex-col items-center justify-center h-16 text-center relative overflow-hidden',
                      data.weeklySummaries[weekIndex]?.totalPnl > 0 ? 'bg-green-50/10 border-green-500/30' : 
                      data.weeklySummaries[weekIndex]?.totalPnl < 0 ? 'bg-red-50/10 border-red-500/30' : 'bg-card border-border/50'
                    )}
                  >
                    <div className="text-[9px] text-muted-foreground mb-0.5">
                      W{data.weeklySummaries[weekIndex]?.weekNumber}
                    </div>
                    <div className={cn(
                      'text-xs font-bold leading-none truncate w-full px-1',
                      data.weeklySummaries[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                      data.weeklySummaries[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {formatCurrency(data.weeklySummaries[weekIndex]?.totalPnl || 0)}
                    </div>
                    <div className="text-[7px] text-muted-foreground leading-none">
                      {data.weeklySummaries[weekIndex]?.activeDays || 0}d
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Branding */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 backdrop-blur-sm">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-foreground">Refine</span>
              <span className="text-[10px] text-muted-foreground">· refine.trading</span>
            </div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50">
          <div className="text-center mb-3">
            <div className="font-semibold text-foreground text-sm">Track your edge</div>
            <div className="text-xs text-muted-foreground">Like this trader</div>
          </div>
          <a
            href="/"
            className="block w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-semibold text-center text-sm"
          >
            Start Free Trial
          </a>
        </div>

        {/* Spacing for mobile */}
        <div className="h-4" />
      </div>
    </div>
  );
};
