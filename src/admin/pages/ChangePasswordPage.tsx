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
  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Checking your account…</div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace state={{ from: requested }} />;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (newPassword.length < 8) return setError('Use at least 8 characters.'); if (newPassword !== confirmPassword) return setError('The new passwords do not match.'); setSaving(true); setError(''); try { await changePassword(currentPassword, newPassword); navigate(requested, { replace: true }); } catch (err) { setError(err instanceof Error ? err.message : 'Could not change the password.'); } finally { setSaving(false); } };
  return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><KeyRound className="h-6 w-6" /></span><h1 className="mt-4 text-2xl font-bold text-slate-900">Choose your password</h1><p className="mt-1 text-sm text-slate-500">This one-time step keeps your staff account private.</p>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="mt-5 block text-sm font-semibold text-slate-700">Temporary password<input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" required /></label><label className="mt-4 block text-sm font-semibold text-slate-700">New password<input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" required /></label><label className="mt-4 block text-sm font-semibold text-slate-700">Type new password again<input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" required /></label><button disabled={saving} className="mt-6 h-12 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save and continue'}</button></form></div>;
}
