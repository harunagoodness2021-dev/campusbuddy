import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { ErrorNote } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LEVELS = ['100', '200', '300', '400', '500', '600'];
const DEMO = { email: 'johnson@nsuk.edu.ng', password: 'campus123' };

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', level: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirectTo} replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(form);
      else await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4 py-10">
      <Logo className="mb-6" />

      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister ? 'Join CampusBuddy to get around campus smarter.' : 'Sign in to open your campus dashboard.'}
          </p>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {isRegister && (
          <label className="block text-sm font-medium">
            Full name
            <input className="input mt-1" value={form.name} onChange={set('name')} required autoComplete="name" />
          </label>
        )}

        <label className="block text-sm font-medium">
          Email
          <input
            className="input mt-1"
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
            placeholder="you@nsuk.edu.ng"
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            className="input mt-1"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            minLength={6}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>

        {!isRegister && (
          <p className="-mt-2 text-right text-sm">
            <Link to="/forgot-password" className="font-semibold text-brand hover:underline">
              Forgot password?
            </Link>
          </p>
        )}

        {isRegister && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Department
              <input className="input mt-1" value={form.department} onChange={set('department')} placeholder="Computer Science" />
            </label>
            <label className="block text-sm font-medium">
              Level
              <select className="input mt-1" value={form.level} onChange={set('level')}>
                <option value="">Select</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <button className="btn-primary w-full" disabled={submitting}>
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {isRegister ? 'Create account' : 'Sign in'}
        </button>

        {!isRegister && (
          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() => setForm((f) => ({ ...f, ...DEMO }))}
          >
            Fill in the demo account
          </button>
        )}

        <p className="text-center text-sm text-muted">
          {isRegister ? 'Already have an account? ' : 'New to CampusBuddy? '}
          <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-brand hover:underline">
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </div>
  );
}
