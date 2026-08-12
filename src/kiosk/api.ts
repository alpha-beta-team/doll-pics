import type { AttendanceStatus, KioskDevice, PunchDirection } from '../attendance/types';
import { scopedRequest } from '../attendance/scopedHttp';

const TOKEN_KEY = 'doll_kiosk_device_token';
const DEVICE_KEY = 'doll_kiosk_device';

export const kioskStorage = {
  token: () => localStorage.getItem(TOKEN_KEY),
  device: (): KioskDevice | null => {
    try { return JSON.parse(localStorage.getItem(DEVICE_KEY) || 'null') as KioskDevice | null; }
    catch { return null; }
  },
  save: (token: string, device: KioskDevice) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DEVICE_KEY);
  },
};

export type KioskPunchResult = {
  employeeFirstName: string;
  direction: PunchDirection;
  recordedAt: string;
  businessDate: string;
  status: AttendanceStatus | string;
  netMinutes: number;
};

export const kioskApi = {
  enroll: (enrollmentCode: string) => scopedRequest<KioskDevice & { deviceToken: string }>('/kiosk/enroll', {
    method: 'POST', body: JSON.stringify({ enrollmentCode }),
  }),
  status: () => scopedRequest<KioskDevice>('/kiosk/status', { kioskToken: kioskStorage.token() }),
  punch: (input: { employeeCode: string; pin: string; direction: PunchDirection; clientRequestId: string }) =>
    scopedRequest<KioskPunchResult>('/kiosk/punch', {
      method: 'POST', kioskToken: kioskStorage.token(), body: JSON.stringify(input),
    }),
};

