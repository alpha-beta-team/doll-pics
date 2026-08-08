import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdminAlert, AdminButton, AdminField, adminFieldClass } from '../components/ui';

export function ChangePasswordPage() {
  const { isAuthenticated, isLoading, changePassword, user } = useAuth();
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
  const firstTime = user?.mustChangePassword;
  return <div className="flex min-h-screen items-center justify-center bg-admin-canvas p-4 text-admin-text"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-elevated p-6 shadow-[0_24px_70px_rgba(62,56,46,0.12)]"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><KeyRound className="h-6 w-6" /></span><p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-admin-gold">Account security</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-admin-text">{firstTime ? 'Choose your password' : 'Change your password'}</h1><p className="mt-1 text-sm text-admin-subtle">{firstTime ? 'This one-time step keeps your staff account private.' : 'Use your current password to protect your studio account.'}</p>{error && <div className="mt-4"><AdminAlert>{error}</AdminAlert></div>}<div className="mt-5 space-y-4"><AdminField label={firstTime ? 'Temporary password' : 'Current password'}><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={adminFieldClass} required autoFocus /></AdminField><AdminField label="New password" hint="Use at least 8 characters."><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={adminFieldClass} required /></AdminField><AdminField label="Type new password again"><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={adminFieldClass} required /></AdminField></div><div className={`mt-6 grid gap-3 ${firstTime ? '' : 'grid-cols-2'}`}>{!firstTime && <Link to={requested} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-admin-border-strong bg-admin-surface px-4 text-sm font-semibold text-admin-secondary transition hover:bg-admin-muted">Cancel</Link>}<AdminButton disabled={saving} className="w-full">{saving ? 'Saving…' : firstTime ? 'Save and continue' : 'Update password'}</AdminButton></div></form></div>;
}
