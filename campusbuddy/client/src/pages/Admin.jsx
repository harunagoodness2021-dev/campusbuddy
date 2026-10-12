import { useCallback, useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import ResourceManager from '../components/admin/ResourceManager.jsx';
import { api } from '../lib/api.js';
import { cn } from '../lib/format.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CATEGORIES = ['faculty', 'library', 'admin', 'medical', 'hostel', 'sports', 'food', 'worship', 'other'];
const fmtDate = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const clip = (s, n = 80) => (s && s.length > n ? `${s.slice(0, n)}…` : s || '—');

const TABS = [
  {
    key: 'buildings',
    label: 'Buildings',
    noun: 'building',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, default: 'other', options: CATEGORIES.map((c) => ({ value: c, label: c })) },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'lat', label: 'Latitude', type: 'number', step: 'any', required: true, hint: 'Right-click a spot on Google/OpenStreetMap maps to copy it. Keffi is about 8.84' },
      { name: 'lng', label: 'Longitude', type: 'number', step: 'any', required: true, hint: 'Keffi is about 7.87' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'hours', label: 'Opening hours', type: 'text', placeholder: 'Mon–Fri 8am–5pm' },
      { name: 'image', label: 'Image link (URL)', type: 'text' },
      { name: 'facilities', label: 'Facilities', type: 'list', hint: 'Separate with commas' },
      { name: 'aliases', label: 'Other names', type: 'list', hint: 'Names people use for it, separated by commas. The chatbot uses these.' },
    ],
    columns: [
      { label: 'Name', render: (b) => <span className="font-medium">{b.name}</span> },
      { label: 'Category', render: (b) => <span className="capitalize">{b.category}</span> },
      { label: 'Location', render: (b) => `${b.lat}, ${b.lng}` },
    ],
  },
  {
    key: 'announcements',
    label: 'Announcements',
    noun: 'announcement',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'body', label: 'Message', type: 'textarea', required: true },
      { name: 'pinned', label: 'Pin to the top', type: 'checkbox' },
    ],
    columns: [
      { label: 'Title', render: (a) => <span className="font-medium">{a.pinned ? '📌 ' : ''}{a.title}</span> },
      { label: 'Message', render: (a) => clip(a.body) },
      { label: 'Posted', render: (a) => fmtDate(a.publishedAt) },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    noun: 'event',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'startsAt', label: 'Starts', type: 'datetime', required: true },
      { name: 'endsAt', label: 'Ends', type: 'datetime' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'building', label: 'Building (optional)', type: 'select', options: 'buildings' },
      { name: 'category', label: 'Category', type: 'text', default: 'general' },
    ],
    columns: [
      { label: 'Title', render: (e) => <span className="font-medium">{e.title}</span> },
      { label: 'Starts', render: (e) => fmtDate(e.startsAt) },
      { label: 'Venue', render: (e) => e.building?.name || e.venue || '—' },
    ],
  },
  {
    key: 'courses',
    label: 'Courses',
    noun: 'course',
    fields: [
      { name: 'code', label: 'Course code', type: 'text', required: true, placeholder: 'CSC 301' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'lecturer', label: 'Lecturer', type: 'text' },
      { name: 'credits', label: 'Credit units', type: 'number' },
      { name: 'day', label: 'Day', type: 'select', required: true, default: 1, options: DAYS.map((d, i) => ({ value: i, label: d })) },
      { name: 'startTime', label: 'Starts', type: 'time', required: true },
      { name: 'endTime', label: 'Ends', type: 'time', required: true },
      { name: 'room', label: 'Room', type: 'text' },
      { name: 'building', label: 'Building (optional)', type: 'select', options: 'buildings' },
    ],
    columns: [
      { label: 'Course', render: (c) => <span className="font-medium">{c.code} — {c.title}</span> },
      { label: 'When', render: (c) => `${DAYS[c.day]} ${c.startTime}–${c.endTime}` },
      { label: 'Where', render: (c) => [c.room, c.building?.name].filter(Boolean).join(', ') || '—' },
    ],
  },
];

const STAT_LABELS = [
  ['users', 'Users'],
  ['admins', 'Admins'],
  ['buildings', 'Buildings'],
  ['courses', 'Courses'],
  ['events', 'Events'],
  ['announcements', 'Announcements'],
  ['chatMessages', 'Chat messages'],
];

function Overview({ refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((r) => setStats(r.stats))
      .catch((e) => setError(e.message));
  }, [refreshKey]);

  if (error) return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!stats) return <p className="text-muted">Loading...</p>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STAT_LABELS.map(([key, label]) => (
        <div key={key} className="card p-5">
          <p className="text-3xl font-bold text-brand">{stats[key]}</p>
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

function RoleSelect({ user, onChanged }) {
  const [error, setError] = useState('');
  const change = async (role) => {
    setError('');
    try {
      await api.patch(`/admin/users/${user._id}`, { role });
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div>
      <select className="input !w-auto !py-1.5" value={user.role} onChange={(e) => change(e.target.value)} aria-label={`Role for ${user.name}`}>
        <option value="student">student</option>
        <option value="staff">staff</option>
        <option value="admin">admin</option>
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState('overview');
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShieldCheck size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted">Manage the campus data students see in the app.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {[{ key: 'overview', label: 'Overview' }, ...TABS, { key: 'users', label: 'Users' }].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview refreshKey={version} />}

      {current && (
        <ResourceManager
          key={current.key}
          endpoint={current.key}
          noun={current.noun}
          fields={current.fields}
          columns={current.columns}
          onChanged={bump}
        />
      )}

      {tab === 'users' && (
        <UsersTab onChanged={bump} />
      )}
    </div>
  );
}

function UsersTab({ onChanged }) {
  // Re-render the table after a role change by remounting it
  const [n, setN] = useState(0);
  return (
    <ResourceManager
      key={n}
      endpoint="users"
      noun="user"
      fields={[]}
      canCreate={false}
      onChanged={onChanged}
      extraActions={(u, { setError }) => (
        <button
          className="rounded-lg p-2 hover:bg-black/5"
          title="Make a password reset link"
          aria-label="Make a password reset link"
          onClick={async () => {
            try {
              const { link } = await api.post(`/admin/users/${u._id}/reset-link`);
              window.prompt(`Send this one-time link to ${u.name} (works for 30 minutes). Copy it with Ctrl+C:`, link);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <KeyRound size={16} />
        </button>
      )}
      columns={[
        { label: 'Name', render: (u) => <span className="font-medium">{u.name}</span> },
        { label: 'Email', render: (u) => u.email },
        { label: 'Role', render: (u) => <RoleSelect user={u} onChanged={() => { setN((x) => x + 1); onChanged(); }} /> },
        { label: 'Joined', render: (u) => fmtDate(u.createdAt) },
      ]}
    />
  );
}
