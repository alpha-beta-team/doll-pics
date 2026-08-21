import type {
  AttendanceDay,
  AttendanceDayResponse,
  CorrectionRequest,
  DayOffRequest,
  EmployeeAccount,
  EmployeeCalendar,
  FieldAssignment,
  LeaveBalance,
  LeavePortion,
  LeaveRequest,
  OvertimeRequest,
  PunchDirection,
} from '../attendance/types';
import { scopedRequest } from '../attendance/scopedHttp';

const EMPLOYEE_TOKEN_KEY = 'doll_employee_token';
export type EmployeeSalaryTransaction = { id: string; amount: number; transactionDate: string; periodMonth: string; type: string; note: string; createdAt?: string };
export type EmployeeSalarySummary = { from: string; to: string; total: number; transactionCount: number };

export const employeeTokenStorage = {
  get: () => localStorage.getItem(EMPLOYEE_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(EMPLOYEE_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(EMPLOYEE_TOKEN_KEY),
};

function withToken<T>(path: string, options: RequestInit = {}) {
  return scopedRequest<T>(path, { ...options, token: employeeTokenStorage.get() });
}

export const employeeApi = {
  login(employeeCode: string, password: string) {
    return scopedRequest<EmployeeAccount & { accessToken: string }>('/employee-auth/login', {
      method: 'POST',
      body: JSON.stringify({ employeeCode, password }),
    });
  },
  me: () => withToken<EmployeeAccount>('/employee-auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    withToken<EmployeeAccount>('/employee-auth/change-password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword }),
    }),
  setPunchPin: (currentPassword: string, pin: string) =>
    withToken<{ punchPinConfigured: boolean }>('/employee-auth/set-punch-pin', {
      method: 'POST', body: JSON.stringify({ currentPassword, pin }),
    }),
  today: () => withToken<AttendanceDay>('/employee/attendance/today'),
  attendanceHistory: (from: string, to: string) =>
    withToken<AttendanceDay[]>(`/employee/attendance/history?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  attendanceDay: (date: string) => withToken<AttendanceDayResponse>(`/employee/attendance/${date}`),
  corrections: () => withToken<CorrectionRequest[]>('/employee/attendance/corrections'),
  createCorrection: (input: { businessDate: string; proposedIn?: string; proposedOut?: string; reason: string }) =>
    withToken<CorrectionRequest>('/employee/attendance/corrections', {
      method: 'POST', body: JSON.stringify(input),
    }),
  cancelCorrection: (id: string) => withToken<CorrectionRequest>(`/employee/attendance/corrections/${id}/cancel`, { method: 'POST' }),
  fieldAssignments: (from: string, to: string) =>
    withToken<FieldAssignment[]>(`/employee/field-assignments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  fieldPunch: (
    id: string,
    input: { direction: PunchDirection; clientRequestId: string; latitude?: number; longitude?: number; accuracyM?: number; gpsPermissionDenied?: boolean },
  ) => withToken<{ day: AttendanceDay; requiresReview: boolean }>(`/employee/field-assignments/${id}/punch`, {
    method: 'POST', body: JSON.stringify(input),
  }),
  overtimeRequests: () => withToken<OvertimeRequest[]>('/employee/overtime-requests'),
  createOvertime: (businessDate: string, requestedMinutes: number, reason: string) =>
    withToken<OvertimeRequest>('/employee/overtime-requests', {
      method: 'POST', body: JSON.stringify({ businessDate, requestedMinutes, reason }),
    }),
  balances: (month: string) => withToken<LeaveBalance[]>(`/employee/leave/balances?month=${encodeURIComponent(month)}`),
  leaveRequests: () => withToken<LeaveRequest[]>('/employee/leave/requests'),
  createLeave: (leaveTypeId: string, dateEntries: Array<{ date: string; portion: LeavePortion }>, reason: string) =>
    withToken<LeaveRequest>('/employee/leave/requests', {
      method: 'POST', body: JSON.stringify({ leaveTypeId, dateEntries, reason }),
    }),
  cancelLeave: (id: string) => withToken<LeaveRequest>(`/employee/leave/requests/${id}/cancel`, { method: 'POST' }),
  dayOffs: () => withToken<DayOffRequest[]>('/employee/day-offs'),
  createDayOffs: (dates: string[], note: string) => withToken<DayOffRequest[]>('/employee/day-offs', {
    method: 'POST', body: JSON.stringify({ dates, note }),
  }),
  cancelDayOff: (id: string) => withToken<DayOffRequest>(`/employee/day-offs/${id}/cancel`, { method: 'POST' }),
  calendar: (from: string, to: string) =>
    withToken<EmployeeCalendar>(`/employee/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  salaryTransactions: (from: string, to: string) => withToken<{ from: string; to: string; transactions: EmployeeSalaryTransaction[] }>(`/employee/salary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  salarySummary: (from: string, to: string) => withToken<EmployeeSalarySummary>(`/employee/salary/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
};
