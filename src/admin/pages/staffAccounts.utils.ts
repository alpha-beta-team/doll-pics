import type { StaffAccount } from '../types';

export function filterStaffAccounts(accounts: StaffAccount[], query: string): StaffAccount[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return accounts;
  return accounts.filter((account) =>
    `${account.name} ${account.jobTitle ?? ''} ${account.email ?? ''} ${account.employeeCode ?? ''}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}
