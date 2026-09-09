import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../../src/admin/contexts/AuthContext';
import { api } from '../../../src/admin/api/client';
import type { StaffAccount } from '../../../src/admin/types';

const pending: Array<(user: StaffAccount | null) => void> = [];
if (new URLSearchParams(location.search).has('hold')) api.getCurrentUser = () => new Promise(resolve => { pending.push(resolve); });
const account = { id: 'old', name: 'Old Account', email: 'old@example.invalid', role: 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false } as StaffAccount;
function Probe() {
  const auth = useAuth(); const [error, setError] = useState('');
  return <><output data-testid="auth">{JSON.stringify({ status: auth.status, id: auth.user?.id, error })}</output>
    <button onClick={() => void auth.logout()}>Logout</button>
    <button onClick={() => void auth.login('new@example.invalid', 'test-only').catch(error => setError(String(error)))}>Login new</button>
    <button onClick={() => pending.splice(0).forEach(resolve => resolve(account))}>Resolve old verification</button>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
