import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Navigation, Radio } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import CampusMap from '../components/map/CampusMap.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const FEATURES = [
  { Icon: Bot, label: 'AI Powered' },
  { Icon: Navigation, label: 'Campus Navigation' },
  { Icon: Radio, label: 'Real-time Information' },
];

export default function Landing() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState([]);

  // The preview map is decoration - if the API is down the page still works
  useEffect(() => {
    api
      .get('/buildings')
      .then((data) => setBuildings(data.buildings))
      .catch(() => {});
  }, []);

  const cta = user ? { to: '/dashboard', text: 'Open dashboard' } : { to: '/login', text: 'Sign in' };

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to={cta.to} className="btn-ghost !py-2">
          {cta.text}
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-8 md:grid-cols-2 md:py-14">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Navigate Your Campus <span className="text-ember">Smarter</span> with AI
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 sm:text-lg">
            An intelligent campus assistant that helps students locate buildings, discover academic departments, find
            lecture schedules, and answer campus queries instantly.
          </p>
          <div className="mt-8">
            <Link to={cta.to} className="btn-gold !px-6 !py-3">
              {cta.text} <ArrowRight size={16} />
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ink/70">
            {FEATURES.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon size={16} className="text-gold-dark" /> {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="relative size-72 overflow-hidden rounded-3xl border border-line bg-paper shadow-xl sm:size-96">
            <div className="pointer-events-none size-full" aria-hidden="true">
              <CampusMap buildings={buildings} interactive={false} zoom={17} />
            </div>
            <span className="absolute left-3 top-3 z-[500] rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold shadow">
              NSUK Campus Map
            </span>
          </div>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-muted">
        <span>&copy; {new Date().getFullYear()} Nasarawa State University, Keffi</span>
        <span>CampusBuddy Platform &middot; support@campusbuddy.edu.ng</span>
      </footer>
    </div>
  );
}
