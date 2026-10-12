const TZ = 'Africa/Lagos';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Weekday index (0 = Sunday) in campus time. */
export function todayIndex(date = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long' }).format(date);
  return WEEKDAYS.indexOf(name);
}

export function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hourCycle: 'h23' }).format(date)
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const longDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));

export const shortDate = (date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(date)
  );

export const timeOfDay = (date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(date));

export const dayParts = (date) => {
  const d = new Date(date);
  return {
    day: new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: 'numeric' }).format(d),
    month: new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short' }).format(d).toUpperCase(),
  };
};

/** "14:00" -> "2:00 PM" */
export function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

export const formatDistance = (meters) =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

/** Great-circle distance in metres between two [lat, lng] points. */
export function haversine([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
