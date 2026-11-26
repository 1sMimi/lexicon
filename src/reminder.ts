export interface Reminder { enabled: boolean; time: string; days: number[] }
export const defaultReminder: Reminder = {enabled: false, time: '19:00', days: [0, 1, 2, 3, 4, 5, 6]};
export const reminderKey = 'daily-reminder';

export function readReminder(value: unknown): Reminder {
  if (typeof value !== 'string') return defaultReminder;
  try {
    const parsed = JSON.parse(value) as Partial<Reminder> | null;
    if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.time === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(parsed.time) && Array.isArray(parsed.days) && parsed.days.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
      return {enabled:parsed.enabled,time:parsed.time,days:[...new Set(parsed.days)]};
    }
  } catch { /* Fall back on invalid imported settings. */ }
  return defaultReminder;
}

export function localDate(now: Date) {
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
}

export function reminderDue(reminder: Reminder, now: Date, dismissed: unknown) {
  const localTime = [now.getHours(), now.getMinutes()].map(value => String(value).padStart(2, '0')).join(':');
  return reminder.enabled && reminder.days.includes(now.getDay()) && localTime >= reminder.time && dismissed !== localDate(now);
}
