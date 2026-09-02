import type { StaffAccount } from '../types';

export const VIEW_CLIENT_PHONE_PERMISSION = 'view_client_phone_number';

export function canViewClientPhone(user: StaffAccount | null | undefined): boolean {
  return user?.role === 'owner' || Boolean(user?.permissions?.includes(VIEW_CLIENT_PHONE_PERMISSION));
}

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone ? '••••' : '';
  const visiblePrefix = digits.slice(0, 2);
  const visibleSuffix = digits.slice(-2);
  return `${visiblePrefix}${'*'.repeat(Math.max(4, digits.length - 4))}${visibleSuffix}`;
}
