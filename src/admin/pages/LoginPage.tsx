import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Camera, AlertCircle } from 'lucide-react';

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
      if (user.mustChangePassword) {
        navigate('/admin/change-password', {
          replace: true,
          state: { from: requested || '/admin/today' },
        });
      } else {
        navigate(requested || '/admin/today', { replace: true });
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
        <div className="rounded-xl border border-admin-border bg-admin-elevated p-8 shadow-xl shadow-black/20">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-admin-primary">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-admin-text">Doll Pictures Work</h1>
            <p className="mt-1 text-sm text-admin-subtle">Sign in to see today’s enquiries and bookings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-admin-secondary">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-admin-control bg-admin-surface px-3 py-2 text-admin-text placeholder:text-admin-subtle transition-all focus:border-admin-focus focus:outline-none focus:ring-2 focus:ring-admin-focus/30"
                placeholder="admin@studio.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-admin-secondary">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-admin-control bg-admin-surface px-3 py-2 text-admin-text placeholder:text-admin-subtle transition-all focus:border-admin-focus focus:outline-none focus:ring-2 focus:ring-admin-focus/30"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-admin-action px-4 py-2.5 font-medium text-white transition-all hover:bg-admin-action-hover focus:outline-none focus:ring-2 focus:ring-admin-focus focus:ring-offset-2 focus:ring-offset-admin-elevated disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
