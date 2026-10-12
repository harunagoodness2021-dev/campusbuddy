import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { ErrorNote } from '../components/Spinner.jsx';
import { api } from '../lib/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
          <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-1 text-sm text-muted">Enter your email and we will send you a link to choose a new one.</p>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {sent ? (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
            If that email has an account, a reset link is on its way. Check your inbox and spam folder. The link works for 30 minutes.
          </p>
        ) : (
          <>
            <label className="block text-sm font-medium">
              Email
              <input className="input mt-1" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 size={16} className="animate-spin" />} Send reset link
            </button>
          </>
        )}

        <p className="text-center text-sm text-muted">
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
