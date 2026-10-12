import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { ErrorNote } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('The two passwords do not match');
    setBusy(true);
    try {
      await resetPassword(token, password); // also signs the person in
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4 py-10">
      <Logo className="mb-6" />
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted">Use at least 6 characters.</p>
        </div>

        {!token && <ErrorNote>This link is incomplete. Please request a new reset link.</ErrorNote>}
        {error && <ErrorNote>{error}</ErrorNote>}

        <label className="block text-sm font-medium">
          New password
          <input className="input mt-1" type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">
          Confirm new password
          <input className="input mt-1" type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>

        <button className="btn-primary w-full" disabled={busy || !token}>
          {busy && <Loader2 size={16} className="animate-spin" />} Save new password
        </button>
        <p className="text-center text-sm text-muted">
          <Link to="/forgot-password" className="font-semibold text-brand hover:underline">
            Need a new link?
          </Link>
        </p>
      </form>
    </div>
  );
}
