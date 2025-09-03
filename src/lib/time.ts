import { DateTime } from 'luxon';

export function todayInTZ(timezone: string): string {
  try {
    return DateTime.now().setZone(timezone || 'America/New_York').toFormat('yyyy-MM-dd');
  } catch {
    return DateTime.now().setZone('America/New_York').toFormat('yyyy-MM-dd');
  }
}

export function isAfterMarketClose(timezone: string, closeHourLocal = 16, closeMinuteLocal = 10): boolean {
  const zone = timezone || 'America/New_York';
  const now = DateTime.now().setZone(zone);
  const cutoff = now.set({ hour: closeHourLocal, minute: closeMinuteLocal, second: 0, millisecond: 0 });
  return now.toMillis() >= cutoff.toMillis();
}

export function startOfWeekDates(timezone: string): string[] {
  const zone = timezone || 'America/New_York';
  const now = DateTime.now().setZone(zone);
  const start = now.startOf('week');
  return Array.from({ length: 7 }).map((_, idx) => start.plus({ days: idx }).toFormat('yyyy-MM-dd'));
}


