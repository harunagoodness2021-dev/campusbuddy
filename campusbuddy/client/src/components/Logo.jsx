import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Logo({ to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="CampusBuddy home">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-dark text-white shadow-sm">
        <GraduationCap size={20} strokeWidth={2.2} />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">CampusBuddy</span>
    </Link>
  );
}
