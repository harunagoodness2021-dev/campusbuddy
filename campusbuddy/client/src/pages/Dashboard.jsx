import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, CalendarDays, CheckCircle2, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { cn, dayParts, greeting, longDate, shortDate, timeOfDay, to12h } from '../lib/format.js';

function StatCard({ Icon, label, value, tone, to }) {
  const body = (
    <>
      <span className={cn('flex size-10 items-center justify-center rounded-xl', tone)}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl font-bold leading-tight">{value}</p>
      </div>
    </>
  );
  const classes = 'card flex items-center gap-4 p-4 transition';
  return to ? (
    <Link to={to} className={cn(classes, 'hover:bg-white')}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await api.get('/dashboard'));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(announcement) {
    if (announcement.read) return;
    setData((d) => ({
      ...d,
      stats: { ...d.stats, unreadNotices: Math.max(0, d.stats.unreadNotices - 1) },
      announcements: d.announcements.map((a) => (a._id === announcement._id ? { ...a, read: true } : a)),
    }));
    try {
      await api.post(`/announcements/${announcement._id}/read`);
    } catch {
      load();
    }
  }

  async function markAllRead() {
    setData((d) => ({
      ...d,
      stats: { ...d.stats, unreadNotices: 0 },
      announcements: d.announcements.map((a) => ({ ...a, read: true })),
    }));
    try {
      await api.post('/announcements/read-all');
    } catch {
      load();
    }
  }

  if (!data && !error) return <Spinner label="Loading your dashboard..." />;
  if (!data) return <ErrorNote>{error}</ErrorNote>;

  const { stats, announcements, events, todaysClasses } = data;
  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted">{longDate()}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost !py-2" onClick={load} disabled={refreshing}>
            <RefreshCw size={15} className={cn(refreshing && 'animate-spin')} /> Refresh
          </button>
          <Link to="/assistant" className="btn-gold !py-2">
            <Sparkles size={15} /> Ask AI
          </Link>
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard Icon={BookOpen} label="Today's Classes" value={stats.todaysClasses} tone="bg-blue-100 text-blue-600" to="/schedule" />
        <StatCard Icon={CheckCircle2} label="Pending Tasks" value={stats.pendingTasks} tone="bg-green-100 text-green-600" to="/schedule" />
        <StatCard Icon={Bell} label="Unread Notices" value={stats.unreadNotices} tone="bg-amber-100 text-amber-600" />
        <StatCard Icon={CalendarDays} label="Upcoming Events" value={stats.upcomingEvents} tone="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3" aria-labelledby="announcements-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="announcements-title" className="font-semibold">
              Recent Announcements
            </h2>
            {stats.unreadNotices > 0 && (
              <button className="text-xs font-semibold text-brand hover:underline" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          {announcements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {announcements.map((a) => (
                <li key={a._id}>
                  <button className="flex w-full gap-3 py-3 text-left" onClick={() => markRead(a)}>
                    <span
                      className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.read ? 'bg-transparent' : 'bg-brand')}
                      aria-label={a.read ? 'Read' : 'Unread'}
                    />
                    <span>
                      <span className="block text-xs text-muted">{shortDate(a.publishedAt)}</span>
                      <span className={cn('block text-sm', a.read ? 'font-medium' : 'font-semibold')}>{a.title}</span>
                      <span className="mt-0.5 block text-sm text-ink/70">{a.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 lg:col-span-2" aria-labelledby="events-title">
          <h2 id="events-title" className="mb-3 font-semibold">
            Upcoming Events
          </h2>
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => {
                const { day, month } = dayParts(e.startsAt);
                return (
                  <li key={e._id}>
                    <button
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-black/5 disabled:cursor-default disabled:hover:bg-transparent"
                      onClick={() => e.building && navigate(`/map?focus=${e.building._id}`)}
                      disabled={!e.building}
                    >
                      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-center leading-none shadow-sm">
                        <span className="text-lg font-bold">{day}</span>
                        <span className="mt-0.5 text-[10px] font-semibold text-muted">{month}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{e.title}</span>
                        <span className="block text-xs text-muted">{timeOfDay(e.startsAt)}</span>
                        <span className="block truncate text-xs text-muted">{e.venue}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5" aria-labelledby="classes-title">
        <h2 id="classes-title" className="mb-3 font-semibold">
          Today&apos;s Classes
        </h2>
        {todaysClasses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No classes today 🎉</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {todaysClasses.map((c) => (
              <li key={c._id} className="flex items-center gap-3 rounded-xl border border-line bg-white/60 p-3">
                <span className="rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand">{c.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.title}</span>
                  <span className="block text-xs text-muted">
                    {to12h(c.startTime)} - {to12h(c.endTime)}
                    {c.building ? ` · ${c.building.name}` : ''}
                    {c.room ? `, ${c.room}` : ''}
                  </span>
                </span>
                {c.building && (
                  <Link
                    to={`/map?focus=${c.building._id}`}
                    className="rounded-lg p-2 text-brand hover:bg-brand/10"
                    aria-label={`Locate ${c.building.name} on the map`}
                  >
                    <MapPin size={18} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
