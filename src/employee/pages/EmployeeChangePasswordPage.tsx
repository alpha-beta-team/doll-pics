import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../EmployeeAuthContext';
import { EmployeeAlert, EmployeeButton, EmployeeCard, employeeFieldClass } from '../components/EmployeeUi';

export function EmployeeChangePasswordPage() {
  const { changePassword } = useEmployeeAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return setError('Use at least 8 characters for the new password.');
    if (newPassword !== confirmPassword) return setError('The new passwords do not match.');
    setSaving(true);
    setError('');
    try {
      await changePassword(currentPassword, newPassword);
      navigate('/employee/profile', { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not change the password.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-lg"><EmployeeCard className="p-5 sm:p-6"><h1 className="text-xl font-bold">Create your private password</h1><p className="mt-1 text-sm text-slate-600">The temporary password must be changed before using the employee portal.</p><form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>{error && <EmployeeAlert>{error}</EmployeeAlert>}<label className="block text-sm font-semibold">Temporary password<input type="password" className={employeeFieldClass} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label className="block text-sm font-semibold">New password<input type="password" minLength={8} className={employeeFieldClass} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label className="block text-sm font-semibold">Confirm new password<input type="password" minLength={8} className={employeeFieldClass} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><EmployeeButton className="w-full" disabled={saving}>{saving ? 'Saving…' : 'Change password'}</EmployeeButton></form></EmployeeCard></div>;
}

