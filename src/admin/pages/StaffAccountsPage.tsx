import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UsersRound,
} from 'lucide-react';
import {
  getEffectiveAccess,
  getOverrideCount,
  FEATURE_CATALOG,
  FEATURE_GROUPS,
  isOwnerLockedFeature,
  ROLE_ACCESS_AREAS,
  ROLE_CATALOG,
  ROLE_ORDER,
  type RoleAccessLevel,
} from '../access/roles';
import { api } from '../api/client';
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminDrawer,
  AdminEmptyState,
  AdminField,
  AdminIconButton,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  AdminTableSurface,
  adminFieldClass,
} from '../components/ui';
import type { StaffAccount, StaffAccessArea, StaffPermissionOverrides, StaffAccountRole } from '../types';
import { filterStaffAccounts } from './staffAccounts.utils';

type PageTab = 'accounts' | 'roles';

type StaffAccountFormErrors = Partial<Record<'name' | 'email' | 'password' | 'employeeCode' | 'joiningDate', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initials(name: string) {
  const value = name.trim();
  if (!value) return '?';
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function StaffAccountsPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('accounts');
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawerAccount, setDrawerAccount] = useState<StaffAccount | 'new' | null>(null);
  const [resetAccount, setResetAccount] = useState<StaffAccount | null>(null);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);

  const loadStaffAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAccounts(await api.getStaffAccounts());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaffAccounts();
  }, [loadStaffAccounts]);

  const visibleAccounts = useMemo(() => filterStaffAccounts(accounts, query), [accounts, query]);

  const saveStaffAccount = (saved: StaffAccount, isNew: boolean) => {
    setAccounts((current) => isNew
      ? [...current, saved]
      : current.map((account) => account.id === saved.id ? saved : account));
    setDrawerAccount(null);
    setError('');
    setSuccess(isNew ? `${saved.name} was added.` : `${saved.name} was updated.`);
  };

  const toggleStaffAccount = async (account: StaffAccount) => {
    setUpdatingAccountId(account.id);
    setError('');
    setSuccess('');
    try {
      const saved = await api.updateStaffAccount(account.id, { isActive: !account.isActive });
      setAccounts((current) => current.map((item) => item.id === saved.id ? saved : item));
      setSuccess(`${saved.name} is now ${saved.isActive ? 'active' : 'inactive'}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update the account.');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const resetPunchPin = async (account: StaffAccount) => {
    if (!window.confirm(`Reset the kiosk PIN for ${account.name}? They must create a new PIN in the employee portal.`)) return;
    setUpdatingAccountId(account.id);
    setError('');
    setSuccess('');
    try {
      await api.resetStaffAccountPunchPin(account.id);
      setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, punchPinConfigured: false } : item));
      setSuccess(`The kiosk PIN for ${account.name} was reset.`);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset the kiosk PIN.');
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const finishPasswordReset = (saved: StaffAccount) => {
    setAccounts((current) => current.map((item) => item.id === saved.id ? saved : item));
    setResetAccount(null);
    setError('');
    setSuccess(`A temporary password was set for ${saved.name}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminPageHeader
        eyebrow="Studio Settings"
        title="Staff Accounts & Access"
        description="Manage staff accounts and review what each fixed role is intended to access."
        actions={activeTab === 'accounts' ? (
          <AdminButton onClick={() => { setSuccess(''); setDrawerAccount('new'); }}>
            <Plus className="h-4 w-4" /> Add staff account
          </AdminButton>
        ) : undefined}
      />

      <div className="border-b border-admin-border" role="tablist" aria-label="Staff accounts and roles">
        <div className="flex gap-1">
          <TabButton active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')}>
            <UsersRound className="h-4 w-4" /> Staff Accounts
          </TabButton>
          <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>
            <ShieldCheck className="h-4 w-4" /> Roles Overview
          </TabButton>
        </div>
      </div>

      {activeTab === 'accounts' ? (
        <section role="tabpanel" aria-label="Staff accounts">
          <div className="space-y-4">
            {error && <AdminAlert>{error}</AdminAlert>}
            {success && <AdminAlert tone="success">{success}</AdminAlert>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Search staff accounts</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-subtle" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, title, or email"
                  className="min-h-11 w-full rounded-xl border border-admin-control bg-admin-surface pl-10 pr-3 text-sm text-admin-text outline-none transition placeholder:text-admin-subtle focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20"
                />
              </label>
              {!loading && (
                <p className="text-sm text-admin-subtle">
                  {visibleAccounts.length} {visibleAccounts.length === 1 ? 'staff account' : 'staff accounts'}
                </p>
              )}
            </div>

            {loading ? (
              <AdminCard><AdminLoadingState label="Loading staff accounts…" /></AdminCard>
            ) : accounts.length === 0 ? (
              <AdminEmptyState
                icon={UsersRound}
                title="No staff accounts yet"
                description="Add a staff account and choose the role that best matches their work."
                action={<AdminButton onClick={() => setDrawerAccount('new')}><Plus className="h-4 w-4" /> Add staff account</AdminButton>}
              />
            ) : visibleAccounts.length === 0 ? (
              <AdminEmptyState
                icon={Search}
                title="No matching staff accounts"
                description="Try a different name or email address."
                action={<AdminButton variant="secondary" onClick={() => setQuery('')}>Clear search</AdminButton>}
              />
            ) : (
              <>
                <DesktopStaffAccountsTable
                  accounts={visibleAccounts}
                  updatingAccountId={updatingAccountId}
                  onEdit={setDrawerAccount}
                  onReset={setResetAccount}
                  onResetPin={(account) => void resetPunchPin(account)}
                  onToggle={(account) => void toggleStaffAccount(account)}
                />
                <MobileStaffAccountsList
                  accounts={visibleAccounts}
                  updatingAccountId={updatingAccountId}
                  onEdit={setDrawerAccount}
                  onReset={setResetAccount}
                  onResetPin={(account) => void resetPunchPin(account)}
                  onToggle={(account) => void toggleStaffAccount(account)}
                />
              </>
            )}
          </div>
        </section>
      ) : (
        <section role="tabpanel" aria-label="Roles overview">
          <RolesOverview />
        </section>
      )}

      <StaffAccountDrawer
        key={`staff-account-drawer:${drawerAccount === 'new' ? 'new' : drawerAccount?.id ?? 'closed'}`}
        open={drawerAccount !== null}
        account={drawerAccount === 'new' ? undefined : drawerAccount ?? undefined}
        onClose={() => setDrawerAccount(null)}
        onSaved={saveStaffAccount}
      />

      <ResetPasswordDialog
        key={`password-reset:${resetAccount?.id ?? 'closed'}`}
        account={resetAccount}
        onClose={() => setResetAccount(null)}
        onSaved={finishPasswordReset}
      />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center gap-2 px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${active ? 'text-admin-primary' : 'text-admin-subtle hover:text-admin-text'}`}
    >
      {children}
      {active && <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-admin-primary" />}
    </button>
  );
}

type StaffAccountListProps = {
  accounts: StaffAccount[];
  updatingAccountId: string | null;
  onEdit: (account: StaffAccount) => void;
  onReset: (account: StaffAccount) => void;
  onResetPin: (account: StaffAccount) => void;
  onToggle: (account: StaffAccount) => void;
};

function DesktopStaffAccountsTable({ accounts, updatingAccountId, onEdit, onReset, onResetPin, onToggle }: StaffAccountListProps) {
  return (
    <AdminTableSurface className="hidden md:block">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-admin-border bg-admin-muted/60 text-xs font-semibold uppercase tracking-wide text-admin-subtle">
          <tr>
            <th className="px-5 py-3">Staff account</th>
            <th className="px-5 py-3">Title</th>
            <th className="px-5 py-3">Access role</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {accounts.map((account) => (
            <tr key={account.id} className="transition hover:bg-admin-muted/40">
              <td className="px-5 py-4">
                <StaffAccountIdentity account={account} showJobTitle={false} />
              </td>
              <td className="px-5 py-4 text-admin-secondary">{account.jobTitle || '—'}</td>
              <td className="px-5 py-4"><RoleSummary account={account} /></td>
              <td className="px-5 py-4"><AccountStatus account={account} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <AdminIconButton label={`Edit ${account.name}`} onClick={() => onEdit(account)}><Pencil className="h-4 w-4" /></AdminIconButton>
                  <AdminIconButton label={`Reset password for ${account.name}`} onClick={() => onReset(account)}><KeyRound className="h-4 w-4" /></AdminIconButton>
                  {account.attendanceEnabled && <AdminIconButton label={`Reset kiosk PIN for ${account.name}`} onClick={() => onResetPin(account)}><LockKeyhole className="h-4 w-4" /></AdminIconButton>}
                  <AdminIconButton
                    label={`${account.isActive ? 'Deactivate' : 'Activate'} ${account.name}`}
                    disabled={updatingAccountId === account.id}
                    onClick={() => onToggle(account)}
                    className={account.isActive ? 'hover:border-red-300 hover:bg-red-50 hover:text-red-700' : 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}
                  >
                    <Power className="h-4 w-4" />
                  </AdminIconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminTableSurface>
  );
}

function MobileStaffAccountsList({ accounts, updatingAccountId, onEdit, onReset, onResetPin, onToggle }: StaffAccountListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {accounts.map((account) => (
        <AdminCard key={account.id} className="p-4">
          <StaffAccountIdentity account={account} />
          <div className="mt-4 flex flex-wrap gap-2">
            <RoleSummary account={account} />
            <AccountStatus account={account} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-admin-border pt-4">
            <AdminButton variant="secondary" className="px-2" onClick={() => onEdit(account)}><Pencil className="h-4 w-4" /> Edit</AdminButton>
            <AdminButton variant="secondary" className="px-2" onClick={() => onReset(account)}><KeyRound className="h-4 w-4" /> Password</AdminButton>
            {account.attendanceEnabled && <AdminButton variant="secondary" className="px-2" onClick={() => onResetPin(account)}><LockKeyhole className="h-4 w-4" /> Kiosk PIN</AdminButton>}
            <AdminButton
              variant="quiet"
              className={account.isActive ? 'px-2 text-red-700' : 'px-2 text-emerald-700'}
              disabled={updatingAccountId === account.id}
              onClick={() => onToggle(account)}
            >
              <Power className="h-4 w-4" /> {account.isActive ? 'Disable' : 'Enable'}
            </AdminButton>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

function StaffAccountIdentity({ account, showJobTitle = true }: { account: StaffAccount; showJobTitle?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-admin-muted text-sm font-bold text-admin-primary">
        {initials(account.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-admin-text">{account.name}</p>
        {showJobTitle && account.jobTitle && <p className="truncate text-sm font-medium text-admin-secondary">{account.jobTitle}</p>}
        <p className="truncate text-sm text-admin-subtle">{account.email || account.employeeCode || 'No login identifier'}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: StaffAccountRole }) {
  const details = ROLE_CATALOG[role];
  return <AdminBadge className={details.badgeClassName}>{details.label}</AdminBadge>;
}

function RoleSummary({ account }: { account: StaffAccount }) {
  const overrideCount = getOverrideCount(account.permissionOverrides);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RoleBadge role={account.role} />
      {overrideCount > 0 && account.role !== 'owner' && (
        <AdminBadge className="bg-violet-100 text-violet-800">
          <SlidersHorizontal className="mr-1 h-3 w-3" />
          {overrideCount} {overrideCount === 1 ? 'override' : 'overrides'}
        </AdminBadge>
      )}
    </div>
  );
}

function AccountStatus({ account }: { account: StaffAccount }) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminBadge className={account.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}>
        {account.isActive ? 'Active' : 'Inactive'}
      </AdminBadge>
      {account.mustChangePassword && <AdminBadge className="bg-orange-100 text-orange-800">Password change pending</AdminBadge>}
      {account.attendanceEnabled && <AdminBadge className="bg-blue-100 text-blue-800">Attendance enabled</AdminBadge>}
      {account.attendanceEnabled && <AdminBadge className={account.punchPinConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}>{account.punchPinConfigured ? 'Kiosk PIN ready' : 'PIN setup needed'}</AdminBadge>}
    </div>
  );
}

function StaffAccountDrawer({
  open,
  account,
  onClose,
  onSaved,
}: {
  open: boolean;
  account?: StaffAccount;
  onClose: () => void;
  onSaved: (account: StaffAccount, isNew: boolean) => void;
}) {
  const isNew = !account;
  const [name, setName] = useState(account?.name ?? '');
  const [jobTitle, setJobTitle] = useState(account?.jobTitle ?? '');
  const [email, setEmail] = useState(account?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffAccountRole>(account?.role ?? 'sales');
  const [permissionOverrides, setPermissionOverrides] = useState<StaffPermissionOverrides>(
    account?.role === 'owner' ? {} : account?.permissionOverrides ?? {},
  );
  const [isActive, setIsActive] = useState(account?.isActive ?? true);
  const [employeeCode, setEmployeeCode] = useState(account?.employeeCode ?? '');
  const [attendanceEnabled, setAttendanceEnabled] = useState(account?.role === 'employee' ? true : account?.attendanceEnabled ?? false);
  const [joiningDate, setJoiningDate] = useState(account?.joiningDate ?? '');
  const [employmentEndDate, setEmploymentEndDate] = useState(account?.employmentEndDate ?? '');
  const [errors, setErrors] = useState<StaffAccountFormErrors>({});
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const nextErrors: StaffAccountFormErrors = {};
    if (!name.trim()) nextErrors.name = 'Enter the staff account name.';
    if (isNew && role !== 'employee' && !email.trim()) nextErrors.email = 'Enter an email address for CMS access.';
    else if (email.trim() && !EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (isNew && password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (attendanceEnabled && !/^[A-Z0-9-]{3,20}$/.test(employeeCode.trim().toUpperCase())) nextErrors.employeeCode = 'Use 3–20 uppercase letters, numbers, or hyphens.';
    if (attendanceEnabled && !joiningDate) nextErrors.joiningDate = 'Choose the attendance joining date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setRequestError('');
    try {
      const savedOverrides = role === 'owner' ? {} : permissionOverrides;
      const saved = isNew
        ? await api.createStaffAccount({
          name: name.trim(),
          jobTitle: jobTitle.trim(),
          ...(email.trim() ? { email: email.trim().toLocaleLowerCase() } : {}),
          temporaryPassword: password,
          role,
          permissionOverrides: savedOverrides,
          ...(employeeCode.trim() ? { employeeCode: employeeCode.trim().toUpperCase() } : {}),
          attendanceEnabled,
          ...(joiningDate ? { joiningDate } : {}),
          ...(employmentEndDate ? { employmentEndDate } : {}),
        })
        : await api.updateStaffAccount(account.id, {
          name: name.trim(),
          jobTitle: jobTitle.trim(),
          role,
          permissionOverrides: savedOverrides,
          isActive,
          ...(employeeCode.trim() ? { employeeCode: employeeCode.trim().toUpperCase() } : {}),
          attendanceEnabled,
          ...(joiningDate ? { joiningDate } : {}),
          employmentEndDate,
        });
      onSaved(saved, isNew);
    } catch (saveError) {
      setRequestError(saveError instanceof Error ? saveError.message : 'Could not save the account.');
      setSaving(false);
    }
  };

  return (
    <AdminDrawer
      open={open}
      title={isNew ? 'Add staff account' : 'Edit staff account'}
      description={isNew ? 'Create a CMS login, employee attendance login, or both.' : `Update access and attendance setup for ${account.name}.`}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton type="submit" form="staff-account-access-form" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
          </AdminButton>
        </div>
      )}
    >
      <form id="staff-account-access-form" className="space-y-6" onSubmit={(event) => void submit(event)} noValidate>
        {requestError && <AdminAlert>{requestError}</AdminAlert>}

        <div className="space-y-4">
          <AdminField label="Name" error={errors.name}>
            <input
              autoFocus
              className={adminFieldClass}
              value={name}
              onChange={(event) => { setName(event.target.value); setErrors((current) => ({ ...current, name: undefined })); }}
              autoComplete="name"
            />
          </AdminField>

          <AdminField label="Job title" hint="Displayed for identification; it does not control access.">
            <input
              className={adminFieldClass}
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="For example, Senior Photographer"
              autoComplete="organization-title"
            />
          </AdminField>

          <AdminField label={role === 'employee' ? 'Email (optional)' : 'CMS email'} error={errors.email} hint={!isNew ? 'Email cannot be changed after the account is created.' : role === 'employee' ? 'Attendance-only employees sign in with their employee code.' : undefined}>
            <input
              type="email"
              className={adminFieldClass}
              value={email}
              readOnly={!isNew}
              onChange={(event) => { setEmail(event.target.value); setErrors((current) => ({ ...current, email: undefined })); }}
              autoComplete="email"
            />
          </AdminField>

          {isNew && (
            <AdminField label="Temporary password" error={errors.password} hint="The staff account will require a password change after signing in.">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${adminFieldClass} pr-12`}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl text-admin-subtle hover:text-admin-text"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </AdminField>
          )}
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-admin-secondary">Role</legend>
          <p className="mt-1 text-sm text-admin-subtle">Choose the closest match for this person’s responsibilities.</p>
          <div className="mt-3 space-y-3" role="radiogroup" aria-label="Choose a role">
            {ROLE_ORDER.map((roleOption) => {
              const details = ROLE_CATALOG[roleOption];
              const selected = role === roleOption;
              return (
                <button
                  key={roleOption}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setRole(roleOption);
                    if (roleOption === 'owner' || roleOption === 'employee') setPermissionOverrides({});
                    if (roleOption === 'employee') setAttendanceEnabled(true);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus ${selected ? `${details.selectionClassName} ring-2` : 'border-admin-border bg-admin-surface hover:border-admin-border-strong hover:bg-admin-muted/50'}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-admin-primary bg-admin-primary text-white' : 'border-admin-border-strong bg-white'}`}>
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-admin-text">{details.label}</span>
                    <span className="mt-1 block text-sm leading-5 text-admin-subtle">{details.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {role === 'owner' && (
          <AdminAlert tone="warning">
            <strong className="block">Owner access includes sensitive information.</strong>
            This role can view payments, manage staff accounts, and access every studio area.
          </AdminAlert>
        )}

        <fieldset className="space-y-4 rounded-xl border border-admin-border bg-admin-muted/30 p-4">
          <legend className="px-1 text-sm font-semibold text-admin-secondary">Attendance and leave</legend>
          <label className="flex items-center justify-between gap-4">
            <span><span className="block text-sm font-semibold text-admin-text">Enable attendance</span><span className="mt-1 block text-sm text-admin-subtle">Allows employee portal and office kiosk access.</span></span>
            <input type="checkbox" checked={attendanceEnabled} disabled={role === 'employee'} onChange={(event) => setAttendanceEnabled(event.target.checked)} className="h-5 w-5 rounded border-admin-control text-admin-primary focus:ring-admin-focus" />
          </label>
          {attendanceEnabled && <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Employee code" error={errors.employeeCode} hint="Used for employee login and kiosk punching."><input className={adminFieldClass} value={employeeCode} maxLength={20} onChange={(event) => { setEmployeeCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setErrors((current) => ({ ...current, employeeCode: undefined })); }} placeholder="DP-001" /></AdminField>
            <AdminField label="Joining date" error={errors.joiningDate}><input type="date" className={adminFieldClass} value={joiningDate} onChange={(event) => { setJoiningDate(event.target.value); setErrors((current) => ({ ...current, joiningDate: undefined })); }} /></AdminField>
            <AdminField label="Employment end date" hint="Leave empty for current employees."><input type="date" min={joiningDate || undefined} className={adminFieldClass} value={employmentEndDate} onChange={(event) => setEmploymentEndDate(event.target.value)} /></AdminField>
            <div className="rounded-xl border border-admin-border bg-admin-surface p-3 text-sm"><p className="font-semibold text-admin-text">Kiosk PIN</p><p className="mt-1 text-admin-subtle">{account?.punchPinConfigured ? 'Configured by employee' : 'Employee must set it after signing in'}</p></div>
          </div>}
        </fieldset>

        <AccessPreview role={role} overrides={permissionOverrides} />

        <PermissionOverridesPanel
          role={role}
          overrides={permissionOverrides}
          onChange={setPermissionOverrides}
        />

        {!isNew && (
          <label className="flex items-center justify-between gap-4 rounded-xl border border-admin-border bg-admin-muted/40 p-4">
            <span>
              <span className="block text-sm font-semibold text-admin-text">Account active</span>
              <span className="mt-1 block text-sm text-admin-subtle">Inactive staff accounts cannot sign in.</span>
            </span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-5 w-5 rounded border-admin-control text-admin-primary focus:ring-admin-focus"
            />
          </label>
        )}
      </form>
    </AdminDrawer>
  );
}

function AccessPreview({ role, overrides }: { role: StaffAccountRole; overrides: StaffPermissionOverrides }) {
  const visible = ROLE_ACCESS_AREAS.filter(({ id }) => getEffectiveAccess(role, id, overrides) !== 'none');
  const manageCount = visible.filter(({ id }) => getEffectiveAccess(role, id, overrides) === 'manage').length;
  const viewCount = visible.length - manageCount;
  const customizedCount = getOverrideCount(overrides);
  return (
    <section className="rounded-xl border border-admin-border bg-admin-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-admin-text">Access preview</h3>
        {customizedCount > 0 && <AdminBadge className="bg-violet-100 text-violet-800">{customizedCount} customized</AdminBadge>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {manageCount > 0 && <AccessBadge level="manage" label={`${manageCount} areas`} />}
        {viewCount > 0 && <AccessBadge level="view" label={`${viewCount} areas`} />}
      </div>
      <p className="mt-3 text-xs leading-5 text-admin-subtle">Effective access combines the selected role with this staff account’s individual changes.</p>
    </section>
  );
}

type OverrideChoice = RoleAccessLevel | 'inherit';

function PermissionOverridesPanel({
  role,
  overrides,
  onChange,
}: {
  role: StaffAccountRole;
  overrides: StaffPermissionOverrides;
  onChange: (overrides: StaffPermissionOverrides) => void;
}) {
  const overrideCount = getOverrideCount(overrides);
  const [expanded, setExpanded] = useState(overrideCount > 0);
  const [showCustomizedOnly, setShowCustomizedOnly] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FEATURE_GROUPS.map((group) => [
      group.id,
      ROLE_ACCESS_AREAS.some(({ id }) => FEATURE_CATALOG[id].group === group.id && overrides[id] !== undefined),
    ])),
  );

  const setOverride = (area: StaffAccessArea, value: OverrideChoice) => {
    const next = { ...overrides };
    if (value === 'inherit') delete next[area];
    else next[area] = value;
    onChange(next);
    if (value !== 'inherit') {
      setExpandedGroups((current) => ({ ...current, [FEATURE_CATALOG[area].group]: true }));
    }
  };

  const resetGroup = (groupId: string) => {
    const next = { ...overrides };
    ROLE_ACCESS_AREAS.forEach(({ id }) => {
      if (FEATURE_CATALOG[id].group === groupId) delete next[id];
    });
    onChange(next);
  };

  if (role === 'owner') {
    return (
      <section className="rounded-xl border border-admin-border bg-admin-muted/40 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h3 className="text-sm font-semibold text-admin-text">Advanced access</h3>
            <p className="mt-1 text-sm leading-6 text-admin-subtle">Owner accounts always receive full access, so individual overrides are unavailable.</p>
          </div>
        </div>
      </section>
    );
  }

  if (role === 'employee') {
    return (
      <section className="rounded-xl border border-admin-border bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <h3 className="text-sm font-semibold text-admin-text">Employee portal only</h3>
            <p className="mt-1 text-sm leading-6 text-admin-subtle">Employee accounts cannot sign in to the CMS. They use their employee code for attendance, leave, off-days, and assigned outdoor shoots.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 p-4 text-left outline-none transition hover:bg-admin-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <SlidersHorizontal className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-admin-text">Advanced access</span>
            {overrideCount > 0 && <AdminBadge className="bg-violet-100 text-violet-800">{overrideCount} customized</AdminBadge>}
          </span>
          <span className="mt-1 block text-sm text-admin-subtle">Override this staff account’s role defaults only when necessary.</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-admin-subtle transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-admin-border">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-admin-muted/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-admin-subtle">
              <span>Defaults from</span>
              <RoleBadge role={role} />
              <span>unless changed</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={overrideCount === 0}
                aria-pressed={showCustomizedOnly}
                onClick={() => setShowCustomizedOnly((current) => !current)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:opacity-40 ${showCustomizedOnly ? 'bg-violet-100 text-violet-800' : 'text-admin-secondary hover:bg-admin-surface'}`}
              >
                {showCustomizedOnly && <Check className="h-3.5 w-3.5" />}
                Only changes
              </button>
              <button
                type="button"
                disabled={overrideCount === 0}
                onClick={() => { onChange({}); setShowCustomizedOnly(false); }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-admin-secondary outline-none transition hover:bg-admin-surface focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          <div className="space-y-2 p-3">
            {FEATURE_GROUPS.map((group) => {
              const areas = ROLE_ACCESS_AREAS.filter(({ id }) => FEATURE_CATALOG[id].group === group.id);
              const visibleAreas = showCustomizedOnly ? areas.filter(({ id }) => overrides[id] !== undefined) : areas;
              const groupOverrideCount = areas.filter(({ id }) => overrides[id] !== undefined).length;
              if (showCustomizedOnly && visibleAreas.length === 0) return null;
              const groupExpanded = Boolean(expandedGroups[group.id]);
              return (
                <section key={group.id} className="overflow-hidden rounded-xl border border-admin-border">
                  <div className="flex items-center gap-2 bg-admin-muted/40 pr-2">
                    <button
                      type="button"
                      aria-expanded={groupExpanded}
                      onClick={() => setExpandedGroups((current) => ({ ...current, [group.id]: !groupExpanded }))}
                      className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admin-focus"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 text-admin-subtle transition ${groupExpanded ? 'rotate-180' : ''}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-admin-text">{group.label}</span>
                        <span className="block truncate text-xs text-admin-subtle">{group.description}</span>
                      </span>
                      {groupOverrideCount > 0 && <AdminBadge className="bg-violet-100 text-violet-800">{groupOverrideCount}</AdminBadge>}
                    </button>
                    {groupOverrideCount > 0 && (
                      <button type="button" onClick={() => resetGroup(group.id)} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-admin-secondary hover:bg-admin-surface">
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    )}
                  </div>
                  {groupExpanded && (
                    <div className="divide-y divide-admin-border">
                      {visibleAreas.map((area) => {
                        const defaultLevel = ROLE_CATALOG[role].access[area.id];
                        const selectedValue: OverrideChoice = overrides[area.id] ?? 'inherit';
                        const customized = selectedValue !== 'inherit';
                        const locked = isOwnerLockedFeature(area.id);
                        const choices: Array<{ value: OverrideChoice; label: string }> = [
                          { value: 'inherit', label: 'Default' },
                          ...FEATURE_CATALOG[area.id].supportedLevels.map((level) => ({
                            value: level as OverrideChoice,
                            label: level === 'none' ? 'None' : level === 'view' ? 'View' : 'Manage',
                          })),
                        ];
                        return (
                          <div key={area.id} className={`p-3 ${customized ? 'bg-violet-50/60' : 'bg-admin-surface'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                {customized && <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" aria-label="Customized" />}
                                <span className="text-sm font-semibold text-admin-text">{area.label}</span>
                                {locked && <LockKeyhole className="h-3.5 w-3.5 text-amber-700" aria-label="Owner only" />}
                              </div>
                              <AccessBadge level={defaultLevel} />
                            </div>
                            {locked ? (
                              <p className="mt-2 text-xs text-admin-subtle">Owner only · protected by existing backend guards</p>
                            ) : (
                              <div className="mt-2 grid grid-cols-4 rounded-lg border border-admin-control bg-admin-muted p-1" aria-label={`Custom access for ${area.label}`}>
                                {choices.map((choice) => (
                                  <button
                                    key={choice.value}
                                    type="button"
                                    aria-pressed={selectedValue === choice.value}
                                    onClick={() => setOverride(area.id, choice.value)}
                                    className={`min-h-8 rounded-md px-1.5 text-xs font-semibold transition ${selectedValue === choice.value ? 'bg-admin-surface text-admin-text shadow-sm' : 'text-admin-subtle hover:text-admin-secondary'}`}
                                  >
                                    {choice.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
            {showCustomizedOnly && overrideCount === 0 && <p className="p-6 text-center text-sm text-admin-subtle">No customized access yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function ResetPasswordDialog({ account, onClose, onSaved }: { account: StaffAccount | null; onClose: () => void; onSaved: (account: StaffAccount) => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!account) return;
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onSaved(await api.resetStaffAccountPassword(account.id, password));
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset the password.');
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open={account !== null}
      title="Reset temporary password"
      description={account ? `Set a temporary password for ${account.name}.` : undefined}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton type="submit" form="reset-password-form" disabled={saving}>{saving ? 'Saving…' : 'Reset password'}</AdminButton>
        </div>
      )}
    >
      <form id="reset-password-form" onSubmit={(event) => void submit(event)}>
        <AdminField label="Temporary password" error={error} hint="The staff account will require a password change after signing in.">
          <div className="relative">
            <input
              autoFocus
              type={showPassword ? 'text' : 'password'}
              className={`${adminFieldClass} pr-12`}
              value={password}
              onChange={(event) => { setPassword(event.target.value); setError(''); }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-xl text-admin-subtle hover:text-admin-text"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </AdminField>
      </form>
    </AdminModal>
  );
}

function RolesOverview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLE_ORDER.map((role) => {
          const details = ROLE_CATALOG[role];
          return (
            <AdminCard key={role} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${details.badgeClassName}`}>
                  {role === 'owner' ? <ShieldCheck className="h-5 w-5" /> : role === 'sales' ? <UsersRound className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                </span>
                <AdminBadge className={details.badgeClassName}>{details.shortLabel}</AdminBadge>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-admin-text">{details.label}</h2>
              <p className="mt-1 text-sm leading-6 text-admin-subtle">{details.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <AccessBadge level="manage" label={`${ROLE_ACCESS_AREAS.filter(({ id }) => details.access[id] === 'manage').length} manage`} />
                <AccessBadge level="view" label={`${ROLE_ACCESS_AREAS.filter(({ id }) => details.access[id] === 'view').length} view only`} />
              </div>
            </AdminCard>
          );
        })}
      </div>

      <AdminTableSurface>
        <div className="border-b border-admin-border px-5 py-4">
          <h2 className="font-semibold text-admin-text">Role comparison</h2>
          <p className="mt-1 text-sm text-admin-subtle">A display-only summary of the intended access for each role.</p>
        </div>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-admin-border bg-admin-muted/60 text-xs font-semibold uppercase tracking-wide text-admin-subtle">
            <tr>
              <th className="px-5 py-3">Area</th>
              {ROLE_ORDER.map((role) => <th key={role} className="px-5 py-3">{ROLE_CATALOG[role].label}</th>)}
            </tr>
          </thead>
          {FEATURE_GROUPS.map((group) => (
            <tbody key={group.id} className="divide-y divide-admin-border border-b border-admin-border last:border-b-0">
              <tr className="bg-admin-muted/45">
                <th colSpan={ROLE_ORDER.length + 1} className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-admin-secondary">{group.label}</th>
              </tr>
              {ROLE_ACCESS_AREAS.filter(({ id }) => FEATURE_CATALOG[id].group === group.id).map((area) => (
                <tr key={area.id}>
                  <th className="px-5 py-3 font-semibold text-admin-text">
                    <span className="inline-flex items-center gap-2">{area.label}{isOwnerLockedFeature(area.id) && <LockKeyhole className="h-3.5 w-3.5 text-amber-700" />}</span>
                  </th>
                  {ROLE_ORDER.map((role) => (
                    <td key={role} className="px-5 py-3"><AccessBadge level={ROLE_CATALOG[role].access[area.id]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </AdminTableSurface>

      <AdminAlert tone="info">
        Navigation, frontend routes, and page controls use this catalog. Owner-locked settings also keep their existing backend guards; other frontend restrictions are not an API security boundary.
      </AdminAlert>
    </div>
  );
}

function AccessBadge({ level, label }: { level: RoleAccessLevel; label?: string }) {
  const styles: Record<RoleAccessLevel, string> = {
    manage: 'bg-emerald-100 text-emerald-800',
    view: 'bg-blue-100 text-blue-800',
    none: 'bg-slate-100 text-slate-500',
  };
  const labels: Record<RoleAccessLevel, string> = {
    manage: 'Manage',
    view: 'View only',
    none: 'No access',
  };
  return <AdminBadge className={styles[level]}>{level !== 'none' && <Check className="mr-1 h-3 w-3" />}{label ?? labels[level]}</AdminBadge>;
}
