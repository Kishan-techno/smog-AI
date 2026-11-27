import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { MagneticButton } from './MagneticButton';

export function AuthModal({ open, onClose }) {
  const { login, register } = useAuth();
  const { pushToast } = useToast();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        pushToast({ title: 'Welcome back', description: 'Your family profile is synced.', type: 'success' });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        pushToast({ title: 'Account created', description: 'Your routine is now saved.', type: 'success' });
      }
      onClose();
    } catch (err) {
      pushToast({ title: 'Authentication error', description: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account sign in"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
    >
      <div className="glass-card-strong w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {mode === 'login' ? 'Sign In to Save Family Plan' : 'Create Family Account'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-500/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="text-xs font-medium">Family / Display Name</span>
              <input
                required
                minLength={2}
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
                placeholder="Sharma Family"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
              placeholder="family@example.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium">Password</span>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/80"
              placeholder="Minimum 6 characters"
            />
          </label>

          <MagneticButton type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </MagneticButton>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {mode === 'login' ? 'New to Smog Saathi? ' : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="font-semibold text-emerald-500 hover:underline"
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
