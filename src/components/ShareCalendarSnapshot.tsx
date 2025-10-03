import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/localStorageUtils';
import { Calendar as CalendarIcon, BookOpen, Zap } from 'lucide-react';


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
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(mobile);
      console.log('[ShareCalendarSnapshot] isMobile:', mobile, 'width:', window.innerWidth, 'userAgent:', navigator.userAgent);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const params = new URLSearchParams(window.location.search);
  const theme = (params.get('theme') as 'light' | 'dark') || 'dark';
  const raw = params.get('data') || '';
  let data: RenderData | null = null;
  try {
    const json = atob(decodeURIComponent(raw));
    const parsed = JSON.parse(json);
    // Normalize dates: JSON deserializes Date objects as ISO strings, convert back to Date
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
    // show minimal error state
  }

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!data) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme)}>
        <div className="text-muted-foreground">Invalid share data</div>
      </div>
    );
  }

  // Universal gradient (not personalized per user - keeps backgrounds neutral)
  const gradientClass = theme === 'dark' 
    ? 'from-indigo-950 via-purple-900 to-pink-900' 
    : 'from-blue-100 via-purple-100 to-pink-100';

  return (
    <div className={cn('min-h-screen overflow-x-hidden', theme)}>
      {/* Mobile version - clean and scrollable */}
      {isMobile && (
      <div className={cn("w-full min-h-screen bg-gradient-to-br p-3", gradientClass)}>
        <div className="bg-background rounded-xl border-2 border-blue-500 shadow-xl max-w-md mx-auto">
          <div className="p-3">
            {/* Mobile Header */}
            <div className="mb-3 text-center bg-blue-500/10 rounded p-2">
              <div className="text-[10px] text-blue-400 mb-1">📱 MOBILE VIEW v2</div>
              <h1 className="text-lg font-bold text-foreground mb-1">{data.monthName} {data.year}</h1>
              <div className="text-xs text-muted-foreground">
                Monthly: <span className="font-semibold text-green-500">{formatCurrency(data.monthlyPnl)}</span>
              </div>
            </div>

            {/* Mobile Grid - 7 columns only */}
            <div className="space-y-0.5">
              <div className="grid grid-cols-7 gap-0.5">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={`h-${d}`} className="text-center font-semibold text-muted-foreground text-[9px] py-0.5">{d.slice(0, 3)}</div>
                ))}
              </div>

              {data.weeks.map((week, wi) => (
                <div key={`w-${wi}`} className="grid grid-cols-7 gap-0.5">
                  {week.map((day, di) => {
                    const dayDate = new Date(day.date);
                    const isWeekend = day.isWeekend || dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                      <div key={`d-${wi}-${di}`} className={cn(
                        'relative p-0.5 rounded border bg-card min-h-[42px] flex flex-col text-center',
                        day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
                        day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
                        day.isOtherMonth && 'opacity-40'
                      )}>
                        <div className="flex flex-col h-full items-center justify-between py-0.5">
                          <div className="flex items-center justify-between w-full px-0.5">
                            <span className={cn('text-[9px] font-medium', day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground')}>{dayDate.getDate()}</span>
                            {day.hasReflection && <BookOpen className="w-1.5 h-1.5 text-green-500" />}
                          </div>
                          {isWeekend ? (
                            <div className="flex-1 flex items-center justify-center">
                              <div className="text-[7px] text-muted-foreground/70">Wknd</div>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-center items-center">
                              {day.pnl !== 0 && (
                                <div className={cn('text-[8px] font-bold', day.pnl > 0 ? 'text-green-500' : 'text-red-500')}>
                                  {formatCurrency(day.pnl)}
                                </div>
                              )}
                              {day.tradesCount > 0 && (
                                <div className="text-[7px] text-muted-foreground/80 mt-0.5">{day.tradesCount}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Mobile Branding */}
            <div className="flex items-center justify-center mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">TradeFutura</h3>
                  <p className="text-[10px] text-muted-foreground">Your edge, future-proofed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Desktop/Screenshot version - shown on tablet+ */}
      {!isMobile && (
      <div className={cn("w-full bg-gradient-to-br py-16 px-12", gradientClass)} data-share-calendar-card>
        <div className="bg-background rounded-2xl border w-full max-w-[1100px] mx-auto shadow-2xl">
          <div className="pt-6 pb-8 px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-foreground">{data.monthName} {data.year}</h1>
              <div className="text-sm text-muted-foreground">
                Monthly: <span className="font-semibold text-green-500">{formatCurrency(data.monthlyPnl)}</span>
              </div>
            </div>

            {/* Grid */}
            <div className="space-y-1">
              <div className="grid grid-cols-8 gap-1">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={`h-${d}`} className="text-center font-semibold text-muted-foreground py-2">{d}</div>
                ))}
                <div className="text-center font-semibold text-muted-foreground py-2">Week</div>
              </div>

              {data.weeks.map((week, wi) => (
                <div key={`w-${wi}`} className="grid grid-cols-8 gap-1">
                  {week.map((day, di) => {
                    const dayDate = new Date(day.date);
                    const isWeekend = day.isWeekend || dayDate.getDay() === 0 || dayDate.getDay() === 6;
                    return (
                      <div key={`d-${wi}-${di}`} className={cn(
                        'relative p-3 rounded-xl border transition-all duration-200 bg-card aspect-[7/6] w-full',
                        day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
                        day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
                        day.isOtherMonth && 'opacity-40'
                      )}>
                        <div className="flex flex-col h-full space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-sm font-medium', day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground')}>{dayDate.getDate()}</span>
                            <div className="flex items-center gap-1">
                              {day.hasReflection && <BookOpen className="w-3 h-3 text-green-500" />}
                            </div>
                          </div>
                          {isWeekend ? (
                            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-0.5">
                              <div className="text-xs text-muted-foreground/70">Weekend</div>
                            </div>
                          ) : (
                            <>
                              {day.pnl !== 0 && (
                                <div className={cn('text-sm font-bold truncate', day.pnl > 0 ? 'text-green-500' : 'text-red-500')}>
                                  {formatCurrency(day.pnl)}
                                </div>
                              )}
                              {day.tradesCount > 0 && (
                                <div className="text-xs text-muted-foreground">{day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}</div>
                              )}
                              {day.tradesCount > 0 && (
                                <div className="text-xs text-muted-foreground">{day.avgRR.toFixed(1)}:1R, {Math.round(day.winRate)}%</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Week summary */}
                  <div className={cn(
                    'relative p-3 rounded-xl border transition-all duration-200 bg-card aspect-[7/6] w-full',
                    data.weeklySummaries[wi]?.totalPnl > 0 && 'border-green-500/30 bg-green-50/10',
                    data.weeklySummaries[wi]?.totalPnl < 0 && 'border-red-500/30 bg-red-50/10'
                  )}>
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Week {data.weeklySummaries[wi]?.weekNumber}</div>
                      <div className={cn('text-sm font-bold',
                        (data.weeklySummaries[wi]?.totalPnl || 0) > 0 ? 'text-green-500' :
                        (data.weeklySummaries[wi]?.totalPnl || 0) < 0 ? 'text-red-500' : 'text-muted-foreground')
                      }>
                        {formatCurrency(data.weeklySummaries[wi]?.totalPnl || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">{data.weeklySummaries[wi]?.activeDays || 0} days</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Branding */}
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
      )}
    </div>
  );
};

export default ShareCalendarSnapshot;