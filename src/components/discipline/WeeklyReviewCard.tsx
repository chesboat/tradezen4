import React from 'react';

type DayStatus = 'open' | 'completed' | 'skipped' | 'broken';

export interface WeeklyDay {
  date: string;
  status: DayStatus;
  respectedLimit?: boolean;
  lateLogging?: boolean;
  disciplineEnabled?: boolean;
}

export const WeeklyReviewCard: React.FC<{ days: WeeklyDay[]; streak?: number; xp?: number; }> = ({ days, streak, xp }) => {
  const renderColor = (d: WeeklyDay) => {
    if (!d.disciplineEnabled) return 'bg-muted text-muted-foreground border-border';
    if (d.status === 'broken') return 'bg-red-500/15 text-red-400 border-red-500/30';
    if (d.status === 'skipped') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    if (d.lateLogging) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    if (d.status === 'completed' && d.respectedLimit) return 'bg-green-500/15 text-green-400 border-green-500/30';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="p-4 border rounded-xl bg-card">
      <div className="text-sm font-medium mb-3">Weekly Review</div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d.date} className={`text-[11px] text-center px-2 py-3 rounded-lg border ${renderColor(d)}`} title={`${d.date} • ${d.status}`}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2)}</div>
        ))}
      </div>
      {(typeof streak === 'number' || typeof xp === 'number') && (
        <div className="mt-3 text-xs text-muted-foreground">{typeof streak === 'number' ? `Streak: ${streak} ` : ''}{typeof xp === 'number' ? `• XP: ${xp}` : ''}</div>
      )}
    </div>
  );
};

export default WeeklyReviewCard;


