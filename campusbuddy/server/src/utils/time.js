import { config } from '../config.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const dayName = (i) => DAYS[i];

/** Current weekday index (0 = Sunday) and "HH:mm" in the campus time zone. */
export function campusNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    day: DAYS.indexOf(get('weekday')),
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: config.timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: config.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/** "14:00" -> "2:00 PM" */
export function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}
