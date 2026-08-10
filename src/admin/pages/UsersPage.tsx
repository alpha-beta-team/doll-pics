import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
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
  getAccessSummary,
  getOverrideCount,
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
import type { User, UserAccessArea, UserPermissionOverrides, UserRole } from '../types';
import { filterAdminUsers } from './users.utils';

type PageTab = 'users' | 'roles';

type UserFormErrors = Partial<Record<'name' | 'email' | 'password', string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initials(name: string) {
  const value = name.trim();
  if (!value) return '?';
  return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drawerUser, setDrawerUser] = useState<User | 'new' | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await api.getAdminUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load staff accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const visibleUsers = useMemo(() => filterAdminUsers(users, query), [query, users]);

  const saveUser = (saved: User, isNew: boolean) => {
    setUsers((current) => isNew
      ? [...current, saved]
      : current.map((user) => user.id === saved.id ? saved : user));
    setDrawerUser(null);
    setError('');
    setSuccess(isNew ? `${saved.name} was added.` : `${saved.name} was updated.`);
  };

  const toggleUser = async (user: User) => {
    setUpdatingUserId(user.id);
    setError('');
    setSuccess('');
    try {
      const saved = await api.updateAdminUser(user.id, { isActive: !user.isActive });
      setUsers((current) => current.map((item) => item.id === saved.id ? saved : item));
      setSuccess(`${saved.name} is now ${saved.isActive ? 'active' : 'inactive'}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update the account.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const finishPasswordReset = (saved: User) => {
    setUsers((current) => current.map((item) => item.id === saved.id ? saved : item));
    setResetUser(null);
    setError('');
    setSuccess(`A temporary password was set for ${saved.name}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminPageHeader
        eyebrow="Studio Settings"
        title="Users & Access"
        description="Manage staff accounts and review what each fixed role is intended to access."
        actions={activeTab === 'users' ? (
          <AdminButton onClick={() => { setSuccess(''); setDrawerUser('new'); }}>
            <Plus className="h-4 w-4" /> Add team member
          </AdminButton>
        ) : undefined}
      />

      <div className="border-b border-admin-border" role="tablist" aria-label="Users and roles">
        <div className="flex gap-1">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            <UsersRound className="h-4 w-4" /> Users
          </TabButton>
          <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>
            <ShieldCheck className="h-4 w-4" /> Roles Overview
          </TabButton>
        </div>
      </div>

      {activeTab === 'users' ? (
        <section role="tabpanel" aria-label="Users">
          <div className="space-y-4">
            {error && <AdminAlert>{error}</AdminAlert>}
            {success && <AdminAlert tone="success">{success}</AdminAlert>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block w-full sm:max-w-sm">
                <span className="sr-only">Search team members</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-subtle" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or email"
                  className="min-h-11 w-full rounded-xl border border-admin-control bg-admin-surface pl-10 pr-3 text-sm text-admin-text outline-none transition placeholder:text-admin-subtle focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20"
                />
              </label>
              {!loading && (
                <p className="text-sm text-admin-subtle">
                  {visibleUsers.length} {visibleUsers.length === 1 ? 'team member' : 'team members'}
                </p>
              )}
            </div>

            {loading ? (
              <AdminCard><AdminLoadingState label="Loading team members…" /></AdminCard>
            ) : users.length === 0 ? (
              <AdminEmptyState
                icon={UsersRound}
                title="No team members yet"
                description="Add a staff account and choose the role that best matches their work."
                action={<AdminButton onClick={() => setDrawerUser('new')}><Plus className="h-4 w-4" /> Add team member</AdminButton>}
              />
            ) : visibleUsers.length === 0 ? (
              <AdminEmptyState
                icon={Search}
                title="No matching team members"
                description="Try a different name or email address."
                action={<AdminButton variant="secondary" onClick={() => setQuery('')}>Clear search</AdminButton>}
              />
            ) : (
              <>
                <DesktopUsersTable
                  users={visibleUsers}
                  updatingUserId={updatingUserId}
                  onEdit={setDrawerUser}
                  onReset={setResetUser}
                  onToggle={(user) => void toggleUser(user)}
                />
                <MobileUsersList
                  users={visibleUsers}
                  updatingUserId={updatingUserId}
                  onEdit={setDrawerUser}
                  onReset={setResetUser}
                  onToggle={(user) => void toggleUser(user)}
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

      <UserDrawer
        key={drawerUser === 'new' ? 'new' : drawerUser?.id ?? 'closed'}
        open={drawerUser !== null}
        user={drawerUser === 'new' ? undefined : drawerUser ?? undefined}
        onClose={() => setDrawerUser(null)}
        onSaved={saveUser}
      />

      <ResetPasswordDialog
        key={resetUser?.id ?? 'closed'}
        user={resetUser}
        onClose={() => setResetUser(null)}
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

type UserListProps = {
  users: User[];
  updatingUserId: string | null;
  onEdit: (user: User) => void;
  onReset: (user: User) => void;
  onToggle: (user: User) => void;
};

function DesktopUsersTable({ users, updatingUserId, onEdit, onReset, onToggle }: UserListProps) {
  return (
    <AdminTableSurface className="hidden md:block">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="border-b border-admin-border bg-admin-muted/60 text-xs font-semibold uppercase tracking-wide text-admin-subtle">
          <tr>
            <th className="px-5 py-3">Team member</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-border">
          {users.map((user) => (
            <tr key={user.id} className="transition hover:bg-admin-muted/40">
              <td className="px-5 py-4">
                <UserIdentity user={user} />
              </td>
              <td className="px-5 py-4"><RoleSummary user={user} /></td>
              <td className="px-5 py-4"><AccountStatus user={user} /></td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <AdminIconButton label={`Edit ${user.name}`} onClick={() => onEdit(user)}><Pencil className="h-4 w-4" /></AdminIconButton>
                  <AdminIconButton label={`Reset password for ${user.name}`} onClick={() => onReset(user)}><KeyRound className="h-4 w-4" /></AdminIconButton>
                  <AdminIconButton
                    label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
                    disabled={updatingUserId === user.id}
                    onClick={() => onToggle(user)}
                    className={user.isActive ? 'hover:border-red-300 hover:bg-red-50 hover:text-red-700' : 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'}
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

function MobileUsersList({ users, updatingUserId, onEdit, onReset, onToggle }: UserListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {users.map((user) => (
        <AdminCard key={user.id} className="p-4">
          <UserIdentity user={user} />
          <div className="mt-4 flex flex-wrap gap-2">
            <RoleSummary user={user} />
            <AccountStatus user={user} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-admin-border pt-4">
            <AdminButton variant="secondary" className="px-2" onClick={() => onEdit(user)}><Pencil className="h-4 w-4" /> Edit</AdminButton>
            <AdminButton variant="secondary" className="px-2" onClick={() => onReset(user)}><KeyRound className="h-4 w-4" /> Password</AdminButton>
            <AdminButton
              variant="quiet"
              className={user.isActive ? 'px-2 text-red-700' : 'px-2 text-emerald-700'}
              disabled={updatingUserId === user.id}
              onClick={() => onToggle(user)}
            >
              <Power className="h-4 w-4" /> {user.isActive ? 'Disable' : 'Enable'}
            </AdminButton>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-admin-muted text-sm font-bold text-admin-primary">
        {initials(user.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-admin-text">{user.name}</p>
        <p className="truncate text-sm text-admin-subtle">{user.email}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const details = ROLE_CATALOG[role];
  return <AdminBadge className={details.badgeClassName}>{details.label}</AdminBadge>;
}

function RoleSummary({ user }: { user: User }) {
  const overrideCount = getOverrideCount(user.permissionOverrides);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RoleBadge role={user.role} />
      {overrideCount > 0 && user.role !== 'owner' && (
        <AdminBadge className="bg-violet-100 text-violet-800">
          <SlidersHorizontal className="mr-1 h-3 w-3" />
          {overrideCount} {overrideCount === 1 ? 'override' : 'overrides'}
        </AdminBadge>
      )}
    </div>
  );
}

function AccountStatus({ user }: { user: User }) {
  return (
    <div className="flex flex-wrap gap-2">
      <AdminBadge className={user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </AdminBadge>
      {user.mustChangePassword && <AdminBadge className="bg-orange-100 text-orange-800">Password change pending</AdminBadge>}
    </div>
  );
}

function UserDrawer({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user?: User;
  onClose: () => void;
  onSaved: (user: User, isNew: boolean) => void;
}) {
  const isNew = !user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>(user?.role ?? 'sales');
  const [permissionOverrides, setPermissionOverrides] = useState<UserPermissionOverrides>(
    user?.role === 'owner' ? {} : user?.permissionOverrides ?? {},
  );
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const nextErrors: UserFormErrors = {};
    if (!name.trim()) nextErrors.name = 'Enter the team member’s name.';
    if (isNew && !email.trim()) nextErrors.email = 'Enter an email address.';
    else if (isNew && !EMAIL_PATTERN.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (isNew && password.length < 8) nextErrors.password = 'Use at least 8 characters.';
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
        ? await api.createAdminUser({
          name: name.trim(),
          email: email.trim().toLocaleLowerCase(),
          temporaryPassword: password,
          role,
          permissionOverrides: savedOverrides,
        })
        : await api.updateAdminUser(user.id, {
          name: name.trim(),
          role,
          permissionOverrides: savedOverrides,
          isActive,
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
      title={isNew ? 'Add team member' : 'Edit team member'}
      description={isNew ? 'Create a staff login and choose their role.' : `Update access for ${user.name}.`}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton type="submit" form="user-access-form" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
          </AdminButton>
        </div>
      )}
    >
      <form id="user-access-form" className="space-y-6" onSubmit={(event) => void submit(event)} noValidate>
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

          <AdminField label="Email" error={errors.email} hint={!isNew ? 'Email cannot be changed after the account is created.' : undefined}>
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
            <AdminField label="Temporary password" error={errors.password} hint="The user will be asked to change it after signing in.">
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
                    if (roleOption === 'owner') setPermissionOverrides({});
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
              <span className="mt-1 block text-sm text-admin-subtle">Inactive users should not be able to sign in.</span>
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

function AccessPreview({ role, overrides }: { role: UserRole; overrides: UserPermissionOverrides }) {
  const summary = role === 'owner'
    ? getAccessSummary(role)
    : ROLE_ACCESS_AREAS
      .filter(({ id }) => getEffectiveAccess(role, id, overrides) !== 'none')
      .map(({ id, label }) => {
        const level = getEffectiveAccess(role, id, overrides);
        const customized = overrides[id] !== undefined;
        return `${label}${level === 'view' ? ' (view only)' : ''}${customized ? ' · customized' : ''}`;
      });
  return (
    <section className="rounded-xl border border-admin-border bg-admin-muted/40 p-4">
      <h3 className="text-sm font-semibold text-admin-text">Access preview</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {summary.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-admin-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {item}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-admin-subtle">This preview combines the selected role with this user’s individual overrides.</p>
    </section>
  );
}

type OverrideChoice = RoleAccessLevel | 'inherit';

function PermissionOverridesPanel({
  role,
  overrides,
  onChange,
}: {
  role: UserRole;
  overrides: UserPermissionOverrides;
  onChange: (overrides: UserPermissionOverrides) => void;
}) {
  const overrideCount = getOverrideCount(overrides);
  const [expanded, setExpanded] = useState(overrideCount > 0);
  const [showCustomizedOnly, setShowCustomizedOnly] = useState(false);
  const visibleAreas = showCustomizedOnly
    ? ROLE_ACCESS_AREAS.filter(({ id }) => overrides[id] !== undefined)
    : ROLE_ACCESS_AREAS;
  const grantsSensitiveAccess = (overrides.payments === 'view' || overrides.payments === 'manage')
    || (overrides.users === 'view' || overrides.users === 'manage');

  const setOverride = (area: UserAccessArea, value: OverrideChoice) => {
    const next = { ...overrides };
    if (value === 'inherit') delete next[area];
    else next[area] = value;
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
          <span className="mt-1 block text-sm text-admin-subtle">Override this user’s role defaults only when necessary.</span>
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

          {grantsSensitiveAccess && (
            <div className="mx-3 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              Sensitive payment or staff access has been added outside this role.
            </div>
          )}

          <div className="px-3 pb-3 pt-3">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_150px] gap-3 border-b border-admin-border px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-admin-subtle sm:grid">
              <span>Area</span>
              <span>Role default</span>
              <span>Custom access</span>
            </div>
            <div className="divide-y divide-admin-border">
            {visibleAreas.map((area) => {
              const defaultLevel = ROLE_CATALOG[role].access[area.id];
              const selectedValue: OverrideChoice = overrides[area.id] ?? 'inherit';
              const customized = selectedValue !== 'inherit';
              return (
                <div key={area.id} className={`grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_110px_150px] ${customized ? 'bg-violet-50/70' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {customized && <span className="h-2 w-2 shrink-0 rounded-full bg-violet-600" aria-label="Customized" />}
                      <p className="truncate text-sm font-semibold text-admin-text">{area.label}</p>
                    </div>
                    <div className="mt-1 sm:hidden"><AccessBadge level={defaultLevel} /></div>
                  </div>
                  <div className="hidden sm:block"><AccessBadge level={defaultLevel} /></div>
                  <select
                    aria-label={`Custom access for ${area.label}`}
                    value={selectedValue}
                    onChange={(event) => setOverride(area.id, event.target.value as OverrideChoice)}
                    className={`h-9 w-full rounded-lg border bg-admin-surface px-2.5 text-sm font-medium text-admin-text outline-none transition focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20 ${customized ? 'border-violet-300' : 'border-admin-control'}`}
                  >
                    <option value="inherit">Role default</option>
                    <option value="none">No access</option>
                    <option value="view">View only</option>
                    <option value="manage">Manage</option>
                  </select>
                </div>
              );
            })}
            {visibleAreas.length === 0 && (
              <p className="p-6 text-center text-sm text-admin-subtle">No customized permissions yet.</p>
            )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ResetPasswordDialog({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: (user: User) => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onSaved(await api.resetAdminUserPassword(user.id, password));
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Could not reset the password.');
      setSaving(false);
    }
  };

  return (
    <AdminModal
      open={user !== null}
      title="Reset temporary password"
      description={user ? `Set a temporary password for ${user.name}.` : undefined}
      onClose={onClose}
      footer={(
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton>
          <AdminButton type="submit" form="reset-password-form" disabled={saving}>{saving ? 'Saving…' : 'Reset password'}</AdminButton>
        </div>
      )}
    >
      <form id="reset-password-form" onSubmit={(event) => void submit(event)}>
        <AdminField label="Temporary password" error={error} hint="The user will be asked to change it after signing in.">
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
                {getAccessSummary(role).map((item) => <AdminBadge key={item}>{item}</AdminBadge>)}
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
          <tbody className="divide-y divide-admin-border">
            {ROLE_ACCESS_AREAS.map((area) => (
              <tr key={area.id}>
                <th className="px-5 py-4 font-semibold text-admin-text">{area.label}</th>
                {ROLE_ORDER.map((role) => (
                  <td key={role} className="px-5 py-4"><AccessBadge level={ROLE_CATALOG[role].access[area.id]} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableSurface>

      <AdminAlert tone="info">
        This overview documents the planned role model only. Page visibility, route guards, and API permissions are unchanged in this phase.
      </AdminAlert>
    </div>
  );
}

function AccessBadge({ level }: { level: RoleAccessLevel }) {
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
  return <AdminBadge className={styles[level]}>{level !== 'none' && <Check className="mr-1 h-3 w-3" />}{labels[level]}</AdminBadge>;
}
