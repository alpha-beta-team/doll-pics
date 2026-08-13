import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useEmployeeAuth } from '../EmployeeAuthContext';
import { EmployeeAlert, EmployeeButton, EmployeeCard, EmployeePageHeader, employeeFieldClass } from '../components/EmployeeUi';

export function EmployeeProfilePage() {
  const { user, changePassword, setPunchPin } = useEmployeeAuth();
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [pin, setPin] = useState({ password: '', value: '', confirm: '' });
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [saving, setSaving] = useState('');

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next.length < 8) return setMessage({ text: 'Use at least 8 characters.', tone: 'danger' });
    if (passwords.next !== passwords.confirm) return setMessage({ text: 'The new passwords do not match.', tone: 'danger' });
    setSaving('password'); setMessage(null);
    try { await changePassword(passwords.current, passwords.next); setPasswords({ current: '', next: '', confirm: '' }); setMessage({ text: 'Password updated.', tone: 'success' }); }
    catch (error) { setMessage({ text: error instanceof Error ? error.message : 'Could not update password.', tone: 'danger' }); }
    finally { setSaving(''); }
  };

  const savePin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pin.value)) return setMessage({ text: 'PIN must contain exactly six digits.', tone: 'danger' });
    if (pin.value !== pin.confirm) return setMessage({ text: 'The PIN values do not match.', tone: 'danger' });
    setSaving('pin'); setMessage(null);
    try { await setPunchPin(pin.password, pin.value); setPin({ password: '', value: '', confirm: '' }); setMessage({ text: 'Kiosk PIN updated.', tone: 'success' }); }
    catch (error) { setMessage({ text: error instanceof Error ? error.message : 'Could not update PIN.', tone: 'danger' }); }
    finally { setSaving(''); }
  };

  return <><EmployeePageHeader title="Profile" description={`${user?.name} · ${user?.employeeCode}`} />{message && <EmployeeAlert tone={message.tone}>{message.text}</EmployeeAlert>}<div className="grid gap-4 lg:grid-cols-2"><EmployeeCard className="p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><KeyRound className="h-5 w-5" /></span><div><h2 className="font-bold">Login password</h2><p className="text-sm text-slate-500">Used on your phone</p></div></div><form className="mt-5 space-y-4" onSubmit={(event) => void savePassword(event)}><label className="block text-sm font-semibold">Current password<input type="password" className={employeeFieldClass} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label><label className="block text-sm font-semibold">New password<input type="password" minLength={8} className={employeeFieldClass} value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label><label className="block text-sm font-semibold">Confirm password<input type="password" minLength={8} className={employeeFieldClass} value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></label><EmployeeButton className="w-full" disabled={saving === 'password'}>{saving === 'password' ? 'Saving…' : 'Update password'}</EmployeeButton></form></EmployeeCard><EmployeeCard className="p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-bold">Office kiosk PIN</h2><p className="text-sm text-slate-500">{user?.punchPinConfigured ? 'A PIN is configured' : 'Set your PIN before office punching'}</p></div></div><form className="mt-5 space-y-4" onSubmit={(event) => void savePin(event)}><label className="block text-sm font-semibold">Current login password<input type="password" className={employeeFieldClass} value={pin.password} onChange={(event) => setPin({ ...pin, password: event.target.value })} /></label><label className="block text-sm font-semibold">New 6-digit PIN<input type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} className={employeeFieldClass} value={pin.value} onChange={(event) => setPin({ ...pin, value: event.target.value.replace(/\D/g, '').slice(0, 6) })} /></label><label className="block text-sm font-semibold">Confirm PIN<input type="password" inputMode="numeric" pattern="\d{6}" maxLength={6} className={employeeFieldClass} value={pin.confirm} onChange={(event) => setPin({ ...pin, confirm: event.target.value.replace(/\D/g, '').slice(0, 6) })} /></label><EmployeeButton className="w-full" disabled={saving === 'pin'}>{saving === 'pin' ? 'Saving…' : user?.punchPinConfigured ? 'Change kiosk PIN' : 'Set kiosk PIN'}</EmployeeButton></form></EmployeeCard></div></>;
}
