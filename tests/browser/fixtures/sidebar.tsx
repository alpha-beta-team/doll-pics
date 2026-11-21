import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../src/admin/contexts/AuthContext';
import { AdminShellProvider, useAdminShell } from '../../../src/admin/contexts/AdminShellContext';
import { Sidebar } from '../../../src/admin/components/sidebar';
import { api } from '../../../src/admin/api/client';
import type { StaffAccount } from '../../../src/admin/types';
import '../../../src/index.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-600.css';
const params = new URLSearchParams(location.search);
document.documentElement.setAttribute('data-admin-theme', 'studio');
localStorage.setItem('auth_token', 'sidebar-test-only');
api.getCurrentUser = async () => ({ id: 'test', name: 'Super Admin', email: 'test@example.invalid', role: params.get('role') || 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false }) as StaffAccount;
export function Shell() {
  const { openMobile } = useAdminShell();
  return <><button onClick={openMobile} style={{ marginLeft: 260 }}>Open navigation</button><Sidebar /></>;
}
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={[params.has('record') ? '/admin/bookings/one' : '/admin/bookings']}><AuthProvider><AdminShellProvider><Shell /></AdminShellProvider></AuthProvider></MemoryRouter>);
