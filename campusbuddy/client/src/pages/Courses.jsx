import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, UserRound } from 'lucide-react';
import Spinner, { ErrorNote } from '../components/Spinner.jsx';
import { api } from '../lib/api.js';
import { to12h, WEEKDAYS } from '../lib/format.js';

export default function Courses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/courses')
      .then((data) => setCourses(data.courses))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!courses) return <Spinner label="Loading courses..." />;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Courses</h1>
      <p className="mb-6 text-sm text-muted">{courses.length} courses this semester</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <article key={c._id} className="card flex flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{c.code}</span>
              <span className="text-xs text-muted">{c.credits} credit units</span>
            </div>
            <h2 className="font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
              {c.lecturer && (
                <li className="flex items-center gap-2">
                  <UserRound size={14} className="text-muted" /> {c.lecturer}
                </li>
              )}
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-muted" /> {WEEKDAYS[c.day]}, {to12h(c.startTime)} - {to12h(c.endTime)}
              </li>
              {c.building && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-muted" /> {c.building.name}
                  {c.room ? `, ${c.room}` : ''}
                </li>
              )}
            </ul>
            {c.building && (
              <Link to={`/map?focus=${c.building._id}`} className="btn-ghost mt-4 !py-2 text-xs">
                Locate on map
              </Link>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
