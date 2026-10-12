import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const FAQ = [
  {
    q: 'How do I find a building on the map?',
    a: 'Open the Map page and search for the building name, or use the category chips (Faculty, Library, Admin, Medical, Hostel...). Tap a pin to see details and tap Get Directions for a walking route.',
  },
  {
    q: 'What can the AI Assistant answer?',
    a: 'It knows the campus buildings and opening hours, your weekly timetable, upcoming events and the latest announcements. Ask in plain English, for example "Where is the Medical Centre?" or "What classes do I have today?".',
  },
  {
    q: 'Why does my route start at the main gate?',
    a: 'If your browser blocks location access, or you are far from campus, the route starts at the main gate instead. Allow location access in your browser to route from where you are.',
  },
  {
    q: 'How do I switch to satellite view?',
    a: 'On the Map page tap the layers button on the right, then choose Satellite under Map Type.',
  },
  {
    q: 'Something is wrong with the information shown',
    a: 'Campus data is managed by the university administrators. Email support@campusbuddy.edu.ng with the page and what looks wrong.',
  },
];

export default function Help() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Help &amp; Support</h1>
      <p className="mb-6 text-sm text-muted">Quick answers to common questions.</p>

      <div className="space-y-3">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="card group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              {q}
              <ChevronDown size={16} className="shrink-0 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">{a}</p>
          </details>
        ))}
      </div>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">Still stuck?</p>
          <p className="text-sm text-muted">Ask CampusBuddy AI, or email support@campusbuddy.edu.ng.</p>
        </div>
        <Link to="/assistant" className="btn-primary">
          Chat Now
        </Link>
      </div>
    </div>
  );
}
