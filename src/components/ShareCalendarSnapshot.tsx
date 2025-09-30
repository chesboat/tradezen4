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

  return (
    <div className={cn('min-h-screen', theme)}>
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-6">
        <div className="bg-background rounded-2xl border w-full max-w-[1200px]" data-share-calendar-card>
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
    </div>
  );
};

export default ShareCalendarSnapshot;


