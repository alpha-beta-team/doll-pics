import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api/client';
import type { StaffAccount, StaffPermission } from '../types';
import { AdminAlert, AdminCard, AdminPageHeader } from '../components/ui';
import { hasStaffPermission } from '../access/roles';

type Tab = 'profile' | 'permissions';

const VIEW_CLIENT_PHONE_PERMISSION = 'view_client_phone_number';

export function StaffAccountDetailPage() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('profile');
  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountRow, perms] = await Promise.all([api.getStaffAccount(id), api.getStaffPermissions()]);
      setAccount(accountRow);
      setPermissions(perms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this staff account.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const savePermission = async (permissionKey: string, enabled: boolean) => {
    if (!account) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextPermissions = new Set(account.permissions ?? []);
      if (enabled) nextPermissions.add(permissionKey);
      else nextPermissions.delete(permissionKey);
      const saved = await api.updateStaffAccount(account.id, { permissions: [...nextPermissions] });
      setAccount(saved);
      setSuccess('Permissions updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" /></div>;
  }

  if (!account) {
    return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Staff account not found.'}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/admin/staff-accounts" className="inline-flex h-11 items-center gap-2 text-sm font-semibold text-admin-secondary">
          <ArrowLeft className="h-4 w-4" /> Staff accounts
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Staff Accounts"
        title={account.name}
        description={`${account.jobTitle || 'No job title'} · ${account.email || account.employeeCode || 'No login identifier'}`}
      />

      {error && <AdminAlert>{error}</AdminAlert>}
      {success && <AdminAlert tone="success">{success}</AdminAlert>}

      <div className="flex gap-1 border-b border-admin-border">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={UserRound} label="Profile" />
        <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')} icon={ShieldCheck} label="Permissions" />
      </div>

      {tab === 'profile' ? (
        <AdminCard className="space-y-4 p-5">
          <DetailRow label="Role" value={account.role} />
          <DetailRow label="Status" value={account.isActive ? 'Active' : 'Inactive'} />
          <DetailRow label="CMS login" value={account.email || 'Not set'} />
          <DetailRow label="Attendance login" value={account.attendanceEnabled ? 'Enabled' : 'Disabled'} />
          <DetailRow label="Phone visibility" value={hasStaffPermission(account, VIEW_CLIENT_PHONE_PERMISSION) ? 'Can view client phone numbers' : 'Phone numbers are masked'} />
        </AdminCard>
      ) : (
        <AdminCard className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-admin-text">Permission settings</h2>
              <p className="mt-1 text-sm text-admin-subtle">Toggle access per staff account. More permissions can be added here later without changing the account layout.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {permissions.map((permission) => (
              <label key={permission.id} className="flex items-center justify-between gap-4 rounded-xl border border-admin-border bg-admin-surface p-4">
                <span className="min-w-0">
                  <span className="block font-semibold text-admin-text">{permission.label}</span>
                  <span className="mt-1 block text-sm text-admin-subtle">{permission.description}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-admin-subtle">{permission.category}</span>
                  <input
                    type="checkbox"
                    disabled={saving || account.role === 'owner'}
                    checked={permission.key === VIEW_CLIENT_PHONE_PERMISSION ? hasStaffPermission(account, VIEW_CLIENT_PHONE_PERMISSION) : (account.permissions ?? []).includes(permission.key)}
                    onChange={(event) => void savePermission(permission.key, event.target.checked)}
                    className="h-5 w-5 rounded border-admin-control text-admin-primary focus:ring-admin-focus disabled:opacity-40"
                  />
                </span>
              </label>
            ))}
          </div>
          {account.role === 'owner' && <div className="mt-4"><AdminAlert tone="warning">Owner accounts always retain phone visibility.</AdminAlert></div>}
        </AdminCard>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof UserRound; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold outline-none transition ${active ? 'text-admin-primary' : 'text-admin-subtle hover:text-admin-text'}`}
    >
      <Icon className="h-4 w-4" /> {label}
      {active && <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-admin-primary" />}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-admin-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-admin-subtle">{label}</span>
      <span className="text-sm font-medium text-admin-text">{value}</span>
    </div>
  );
}
