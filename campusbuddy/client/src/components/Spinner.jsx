import { Loader2 } from 'lucide-react';

export default function Spinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-sm text-muted ${className}`} role="status">
      <Loader2 className="animate-spin" size={18} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNote({ children }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      {children}
    </div>
  );
}
