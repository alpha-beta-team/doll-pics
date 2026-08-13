import type {
  AdminDayResponse,
  AdminMonthResponse,
  AttendanceDevice,
  AttendancePolicy,
  CorrectionRequest,
  DayOffRequest,
  FieldAssignment,
  Holiday,
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  PunchEvent,
  RequestStatus,
  TeamCalendar,
} from '../../attendance/types';
import type { StaffAccount } from '../types';
import { request, requestBlob } from './http';

type Decision = Extract<RequestStatus, 'APPROVED' | 'REJECTED'>;

export const attendanceApi = {
  attendanceStaff: () => request<StaffAccount[]>('/admin/attendance/staff', { auth: true }),
  attendancePolicies: () => request<AttendancePolicy[]>('/admin/attendance/policies', { auth: true }),
  createAttendancePolicy: (input: Omit<AttendancePolicy, '_id' | 'id' | 'version' | 'timezone' | 'createdAt' | 'updatedAt'>) =>
    request<AttendancePolicy>('/admin/attendance/policies', { method: 'POST', auth: true, body: JSON.stringify(input) }),
  attendanceDevices: () => request<AttendanceDevice[]>('/admin/attendance/devices', { auth: true }),
  createDeviceEnrollment: (name: string, officeLabel: string) => request<{ deviceId: string; enrollmentCode: string; enrollmentExpiresAt: string }>('/admin/attendance/devices/enrollment', { method: 'POST', auth: true, body: JSON.stringify({ name, officeLabel }) }),
  revokeAttendanceDevice: (id: string) => request<{ revoked: boolean }>(`/admin/attendance/devices/${id}/revoke`, { method: 'POST', auth: true }),
  attendanceToday: () => request<AdminDayResponse>('/admin/attendance/today', { auth: true }),
  attendanceDaily: (date: string) => request<AdminDayResponse>(`/admin/attendance/daily?date=${encodeURIComponent(date)}`, { auth: true }),
  attendanceMonthly: (month: string) => request<AdminMonthResponse>(`/admin/attendance/monthly?month=${encodeURIComponent(month)}`, { auth: true }),
  correctionsPending: () => request<CorrectionRequest[]>('/admin/attendance/corrections', { auth: true }),
  decideCorrection: (id: string, decision: Decision, comment: string) => request<CorrectionRequest>(`/admin/attendance/corrections/${id}/decision`, { method: 'POST', auth: true, body: JSON.stringify({ decision, comment }) }),
  adjustAttendance: (input: { staffAccountId: string; businessDate: string; effectiveIn?: string; effectiveOut?: string; reason: string }) => request('/admin/attendance/adjustments', { method: 'POST', auth: true, body: JSON.stringify(input) }),
  fieldAssignmentsAdmin: (from?: string, to?: string) => {
    const params = new URLSearchParams(); if (from) params.set('from', from); if (to) params.set('to', to);
    return request<FieldAssignment[]>(`/admin/attendance/field-assignments${params.size ? `?${params}` : ''}`, { auth: true });
  },
  createFieldAssignment: (input: { bookingId: string; staffAccountIds: string[]; businessDate: string; startTime?: string; endTime?: string; locationLabel: string; latitude: number; longitude: number; radiusM?: number; creditMode: FieldAssignment['creditMode'] }) => request<FieldAssignment>('/admin/attendance/field-assignments', { method: 'POST', auth: true, body: JSON.stringify(input) }),
  updateFieldAssignment: (id: string, input: Partial<{ staffAccountIds: string[]; businessDate: string; startTime: string; endTime: string; locationLabel: string; latitude: number; longitude: number; radiusM: number; creditMode: FieldAssignment['creditMode']; status: FieldAssignment['status'] }>) => request<FieldAssignment>(`/admin/attendance/field-assignments/${id}`, { method: 'PATCH', auth: true, body: JSON.stringify(input) }),
  fieldExceptionsPending: () => request<PunchEvent[]>('/admin/attendance/field-exceptions', { auth: true }),
  decideFieldException: (id: string, decision: Decision, comment: string) => request<PunchEvent>(`/admin/attendance/field-exceptions/${id}/decision`, { method: 'POST', auth: true, body: JSON.stringify({ decision, comment }) }),
  overtimePending: () => request<OvertimeRequest[]>('/admin/attendance/overtime-requests', { auth: true }),
  decideOvertime: (id: string, decision: Decision, comment: string, approvedMinutes?: number) => request<OvertimeRequest>(`/admin/attendance/overtime-requests/${id}/decision`, { method: 'POST', auth: true, body: JSON.stringify({ decision, comment, ...(approvedMinutes === undefined ? {} : { approvedMinutes }) }) }),
  attendanceCsv: (month: string) => requestBlob(`/admin/attendance/reports/monthly.csv?month=${encodeURIComponent(month)}`, { auth: true }),
  leaveTypesAdmin: () => request<LeaveType[]>('/admin/leave/types', { auth: true }),
  updateLeaveType: (id: string, input: Partial<Pick<LeaveType, 'name' | 'monthlyAllowanceUnits' | 'paid' | 'halfDayAllowed' | 'isActive'>>) => request<LeaveType>(`/admin/leave/types/${id}`, { method: 'PATCH', auth: true, body: JSON.stringify(input) }),
  adjustLeaveBalance: (input: { staffAccountId: string; leaveTypeId: string; month: string; units: number; reason: string }) => request('/admin/leave/balances/adjust', { method: 'POST', auth: true, body: JSON.stringify(input) }),
  leavePending: () => request<LeaveRequest[]>('/admin/leave/requests', { auth: true }),
  decideLeave: (id: string, decision: Decision, comment: string) => request<LeaveRequest>(`/admin/leave/requests/${id}/decision`, { method: 'POST', auth: true, body: JSON.stringify({ decision, comment }) }),
  dayOffsPending: () => request<DayOffRequest[]>('/admin/leave/day-offs', { auth: true }),
  decideDayOff: (id: string, decision: Decision, comment: string) => request<DayOffRequest>(`/admin/leave/day-offs/${id}/decision`, { method: 'POST', auth: true, body: JSON.stringify({ decision, comment }) }),
  holidaysAdmin: (from?: string, to?: string) => {
    const params = new URLSearchParams(); if (from) params.set('from', from); if (to) params.set('to', to);
    return request<Holiday[]>(`/admin/leave/holidays${params.size ? `?${params}` : ''}`, { auth: true });
  },
  createHoliday: (date: string, name: string, note: string) => request<Holiday>('/admin/leave/holidays', { method: 'POST', auth: true, body: JSON.stringify({ date, name, note }) }),
  teamLeaveCalendar: (from: string, to: string) => request<TeamCalendar>(`/admin/leave/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { auth: true }),
};

