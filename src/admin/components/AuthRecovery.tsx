import { useAuth } from '../contexts/AuthContext';
import { AdminButton, AdminLoadingState } from './ui';

export function AuthRecovery() {
  const { status, error, retryVerification, logout } = useAuth();
  return <div className="flex min-h-screen items-center justify-center bg-admin-canvas p-4 text-admin-text">
    {status === 'checking' ? <AdminLoadingState label="Checking your account…" /> : <div role="alert" className="max-w-md rounded-xl border border-admin-border bg-admin-surface p-6">
      <h1 className="text-lg font-semibold">Couldn’t connect to your account</h1>
      <p className="mt-2 text-sm">{error}</p>
      <div className="mt-4 flex gap-3"><AdminButton onClick={() => void retryVerification()}>Retry</AdminButton><button type="button" onClick={() => void logout()} className="px-3 text-sm underline">Sign out</button></div>
    </div>}
  </div>;
}
