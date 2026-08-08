import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ChangePasswordPage() {
  const { isAuthenticated, isLoading, changePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const requested = (location.state as { from?: string } | null)?.from || '/admin/today';
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-admin-canvas text-sm text-admin-subtle">Checking your account…</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace state={{ from: requested }} />;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (newPassword.length < 8) return setError('Use at least 8 characters.'); if (newPassword !== confirmPassword) return setError('The new passwords do not match.'); setSaving(true); setError(''); try { await changePassword(currentPassword, newPassword); navigate(requested, { replace: true }); } catch (err) { setError(err instanceof Error ? err.message : 'Could not change the password.'); } finally { setSaving(false); } };
  return <div className="flex min-h-screen items-center justify-center bg-admin-canvas p-4 text-admin-text"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-elevated p-6 shadow-xl shadow-black/20"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><KeyRound className="h-6 w-6" /></span><h1 className="mt-4 text-2xl font-bold text-admin-text">Choose your password</h1><p className="mt-1 text-sm text-admin-subtle">This one-time step keeps your staff account private.</p>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="mt-5 block text-sm font-semibold text-admin-secondary">Temporary password<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-text focus:border-admin-focus focus:outline-none focus:ring-2 focus:ring-admin-focus/30" required /></label><label className="mt-4 block text-sm font-semibold text-admin-secondary">New password<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-text focus:border-admin-focus focus:outline-none focus:ring-2 focus:ring-admin-focus/30" required /></label><label className="mt-4 block text-sm font-semibold text-admin-secondary">Type new password again<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-admin-text focus:border-admin-focus focus:outline-none focus:ring-2 focus:ring-admin-focus/30" required /></label><button disabled={saving} className="mt-6 h-12 w-full rounded-xl bg-admin-action font-semibold text-white transition-colors hover:bg-admin-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-elevated disabled:opacity-50">{saving ? 'Saving…' : 'Save and continue'}</button></form></div>;
}
