import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorNote } from '../components/Spinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LEVELS = ['100', '200', '300', '400', '500', '600'];

export default function Settings() {
  const { user, updateProfile, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name, department: user.department || '', level: user.level || '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  async function savePassword(e) {
    e.preventDefault();
    setPwMessage('');
    setPwError('');
    if (pw.next !== pw.confirm) return setPwError('The new passwords do not match');
    setPwBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMessage('Password changed');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwBusy(false);
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile(form);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <form onSubmit={save} className="card space-y-4 p-6">
        <h2 className="font-semibold">Profile</h2>
        {error && <ErrorNote>{error}</ErrorNote>}
        {message && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
            {message}
          </p>
        )}

        <label className="block text-sm font-medium">
          Full name
          <input className="input mt-1" value={form.name} onChange={set('name')} required />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input className="input mt-1 opacity-70" value={user.email} disabled />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Department
            <input className="input mt-1" value={form.department} onChange={set('department')} />
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

        <button className="btn-primary" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />} Save changes
        </button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 space-y-4 p-6">
        <h2 className="font-semibold">Change password</h2>
        {pwError && <ErrorNote>{pwError}</ErrorNote>}
        {pwMessage && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">
            {pwMessage}
          </p>
        )}
        <label className="block text-sm font-medium">
          Current password
          <input className="input mt-1" type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            New password
            <input className="input mt-1" type="password" autoComplete="new-password" minLength={6} required value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </label>
          <label className="block text-sm font-medium">
            Confirm new password
            <input className="input mt-1" type="password" autoComplete="new-password" minLength={6} required value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
          </label>
        </div>
        <button className="btn-primary" disabled={pwBusy}>
          {pwBusy && <Loader2 size={16} className="animate-spin" />} Change password
        </button>
      </form>

      <div className="card mt-6 flex items-center justify-between p-6">
        <div>
          <h2 className="font-semibold">Sign out</h2>
          <p className="text-sm text-muted">You will need to sign in again to see your dashboard.</p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => {
            logout();
            navigate('/', { replace: true });
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
