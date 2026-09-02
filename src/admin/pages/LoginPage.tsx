import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { AdminAlert, AdminButton, AdminField, adminFieldClass } from '../components/ui';
import { getPostLoginRoute } from '../access/roles';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      const requested = (location.state as { from?: string } | null)?.from;
      const destination = getPostLoginRoute(user, requested);
      if (user.mustChangePassword) {
        navigate('/admin/change-password', {
          replace: true,
          state: { from: destination },
        });
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-canvas p-4 text-admin-text">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-admin-border bg-admin-elevated p-7 shadow-[0_24px_70px_rgba(62,56,46,0.12)] sm:p-8">
          <div className="flex flex-col items-center mb-8">
            <img src="/logo-doll.png" alt="Doll Pictures" className="mb-4 h-14 w-14 rounded-2xl border border-admin-border object-cover shadow-sm" />
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-admin-gold">Photography Studio</p>
            <h1 className="text-2xl font-semibold tracking-tight text-admin-text">Welcome back</h1>
            <p className="mt-1 text-center text-sm text-admin-subtle">Sign in to manage today’s studio work.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <AdminAlert>{error}</AdminAlert>
            )}

            <AdminField label="Email">
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={adminFieldClass}
                placeholder="admin@studio.com"
                required
              />
            </AdminField>

            <AdminField label="Password">
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={adminFieldClass}
                placeholder="Enter your password"
                required
              />
            </AdminField>

            <AdminButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </AdminButton>
          </form>
        </div>
      </div>
    </div>
  );
}
