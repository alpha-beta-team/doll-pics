import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useEmployeeAuth } from '../EmployeeAuthContext';
import { EmployeeAlert, EmployeeButton, employeeFieldClass } from '../components/EmployeeUi';

export function EmployeeLoginPage() {
  const auth = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!auth.isLoading && auth.isAuthenticated) return <Navigate to="/employee" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const account = await auth.login(employeeCode.trim().toUpperCase(), password);
      const requested = (location.state as { from?: string } | null)?.from;
      navigate(account.mustChangePassword ? '/employee/change-password' : requested || '/employee', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-900">
      <main className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="text-center"><img src="/logo-doll.png" alt="Doll Pictures" className="mx-auto h-16 w-16 rounded-2xl object-cover" /><h1 className="mt-4 text-2xl font-bold">Employee sign in</h1><p className="mt-1 text-sm text-slate-500">Attendance, leave and shoot schedule</p></div>
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          {error && <EmployeeAlert>{error}</EmployeeAlert>}
          <label className="block text-sm font-semibold text-slate-700">Employee code<input autoFocus required minLength={3} maxLength={20} value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} autoComplete="username" className={employeeFieldClass} placeholder="DP-001" /></label>
          <label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={employeeFieldClass} /></label>
          <EmployeeButton type="submit" disabled={submitting || employeeCode.length < 3 || password.length < 8} className="w-full"><KeyRound className="h-4 w-4" />{submitting ? 'Signing in…' : 'Sign in'}</EmployeeButton>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">Use the employee code and temporary password given by the studio owner.</p>
      </main>
    </div>
  );
}

