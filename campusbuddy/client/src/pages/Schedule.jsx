import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { api } from '../lib/api.js';
import { cn, shortDate, todayIndex, to12h, WEEKDAYS } from '../lib/format.js';

export default function Schedule() {
  const [courses, setCourses] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const today = todayIndex();

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/tasks')])
      .then(([c, t]) => {
        setCourses(c.courses);
        setTasks(t.tasks);
      })
      .catch((err) => setError(err.message));
  }, []);

  const byDay = useMemo(() => {
    const groups = new Map();
    (courses || []).forEach((c) => groups.set(c.day, [...(groups.get(c.day) || []), c]));
    // Monday first, Sunday last
    return [1, 2, 3, 4, 5, 6, 0].filter((d) => groups.has(d)).map((d) => [d, groups.get(d)]);
  }, [courses]);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const data = await api.post('/tasks', { title, dueDate: dueDate || undefined });
      setTasks((t) => [data.task, ...t]);
      setTitle('');
      setDueDate('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTask(task) {
    setTasks((list) => list.map((t) => (t._id === task._id ? { ...t, done: !t.done } : t)));
    try {
      await api.patch(`/tasks/${task._id}`, { done: !task.done });
    } catch (err) {
      setTasks((list) => list.map((t) => (t._id === task._id ? task : t)));
      setError(err.message);
    }
  }

  async function removeTask(task) {
    const previous = tasks;
    setTasks((list) => list.filter((t) => t._id !== task._id));
    try {
      await api.delete(`/tasks/${task._id}`);
    } catch (err) {
      setTasks(previous);
      setError(err.message);
    }
  }

  if (!courses && !error) return <Spinner label="Loading your schedule..." />;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-3">
        <h1 className="text-2xl font-bold tracking-tight">Weekly schedule</h1>
        {error && <ErrorNote>{error}</ErrorNote>}

        {byDay.map(([day, items]) => (
          <section key={day} className={cn('card p-4', day === today && '!border-brand/40 ring-2 ring-brand/10')}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              {WEEKDAYS[day]}
              {day === today && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">Today</span>
              )}
            </h2>
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c._id} className="flex items-center gap-3 rounded-xl border border-line bg-white/60 p-3">
                  <div className="w-24 shrink-0 text-xs font-medium text-muted">
                    {to12h(c.startTime)}
                    <br />
                    {to12h(c.endTime)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.code} &middot; {c.title}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {c.building?.name ?? 'Venue to be announced'}
                      {c.room ? `, ${c.room}` : ''}
                    </p>
                  </div>
                  {c.building && (
                    <Link
                      to={`/map?focus=${c.building._id}`}
                      className="rounded-lg p-2 text-brand hover:bg-brand/10"
                      aria-label={`Locate ${c.building.name}`}
                    >
                      <MapPin size={18} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <aside className="lg:col-span-2">
        <section className="card p-5 lg:sticky lg:top-0" aria-labelledby="tasks-title">
          <h2 id="tasks-title" className="mb-3 font-semibold">
            Tasks
          </h2>

          <form onSubmit={addTask} className="mb-4 space-y-2">
            <input
              className="input"
              placeholder="Add a task..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              aria-label="Task title"
            />
            <div className="flex gap-2">
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Due date"
              />
              <button className="btn-primary shrink-0" disabled={!title.trim()}>
                <Plus size={16} /> Add
              </button>
            </div>
          </form>

          {tasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t._id} className="flex items-center gap-3 rounded-xl border border-line bg-white/60 p-3">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggleTask(t)}
                    className="size-4 accent-brand"
                    aria-label={`Mark "${t.title}" as ${t.done ? 'not done' : 'done'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm font-medium', t.done && 'text-muted line-through')}>{t.title}</p>
                    {t.dueDate && <p className="text-xs text-muted">Due {shortDate(t.dueDate)}</p>}
                  </div>
                  <button
                    onClick={() => removeTask(t)}
                    className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete "${t.title}"`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
