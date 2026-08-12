import type { StaffAccount, StaffAccountOption } from '../types';
import { normalizePermissionOverrides, normalizeStaffAccountRole } from '../access/roles';
import { request } from './http';

type StaffAccountResponse = Omit<StaffAccount, 'jobTitle' | 'role' | 'permissionOverrides'> & {
  jobTitle?: unknown;
  role?: unknown;
  permissionOverrides?: unknown;
};

export function normalizeStaffAccount(account: StaffAccountResponse): StaffAccount {
  return {
    ...account,
    jobTitle: typeof account.jobTitle === 'string' ? account.jobTitle : '',
    role: normalizeStaffAccountRole(account.role),
    permissionOverrides: normalizePermissionOverrides(account.permissionOverrides),
    employeeCode: typeof account.employeeCode === 'string' ? account.employeeCode : undefined,
    attendanceEnabled: account.attendanceEnabled === true,
    joiningDate: typeof account.joiningDate === 'string' ? account.joiningDate : '',
    employmentEndDate: typeof account.employmentEndDate === 'string' ? account.employmentEndDate : '',
    punchPinConfigured: account.punchPinConfigured === true,
  };
}

export const staffAccountsApi = {
  getAssignableStaffAccounts(): Promise<StaffAccountOption[]> {
    return request<StaffAccountOption[]>('/admin/staff-accounts/assignable', { auth: true });
  },
  async getStaffAccounts(): Promise<StaffAccount[]> {
    const accounts = await request<StaffAccountResponse[]>('/admin/staff-accounts', { auth: true });
    return accounts.map(normalizeStaffAccount);
  },
  async createStaffAccount(data: {
    name: string;
    jobTitle: string;
    email?: string;
    temporaryPassword?: string;
    role: StaffAccount['role'];
    permissionOverrides?: StaffAccount['permissionOverrides'];
    employeeCode?: string;
    attendanceEnabled?: boolean;
    joiningDate?: string;
    employmentEndDate?: string;
  }): Promise<StaffAccount> {
    const account = await request<StaffAccountResponse>('/admin/staff-accounts', {
      method: 'POST', auth: true, body: JSON.stringify(data),
    });
    return normalizeStaffAccount(account);
  },
  async updateStaffAccount(id: string, data: Partial<Pick<StaffAccount, 'name' | 'jobTitle' | 'role' | 'permissionOverrides' | 'isActive' | 'employeeCode' | 'attendanceEnabled' | 'joiningDate' | 'employmentEndDate'>>): Promise<StaffAccount> {
    const account = await request<StaffAccountResponse>(`/admin/staff-accounts/${id}`, {
      method: 'PATCH', auth: true, body: JSON.stringify(data),
    });
    return normalizeStaffAccount(account);
  },
  async resetStaffAccountPassword(id: string, temporaryPassword: string): Promise<StaffAccount> {
    const account = await request<StaffAccountResponse>(`/admin/staff-accounts/${id}/reset-password`, {
      method: 'POST', auth: true, body: JSON.stringify({ temporaryPassword }),
    });
    return normalizeStaffAccount(account);
  },
  resetStaffAccountPunchPin(id: string): Promise<{ punchPinConfigured: boolean }> {
    return request<{ punchPinConfigured: boolean }>(`/admin/staff-accounts/${id}/reset-punch-pin`, {
      method: 'POST', auth: true,
    });
  },
};
