export type ApiDocument = {
  _id?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PunchDirection = 'IN' | 'OUT';
export type LeavePortion = 'FULL_DAY' | 'MORNING' | 'AFTERNOON';

export type AttendanceStatus =
  | 'EXPECTED'
  | 'NOT_PUNCHED_IN'
  | 'PRESENT'
  | 'FIELD_WORK'
  | 'ON_LEAVE'
  | 'HALF_DAY_LEAVE'
  | 'SCHEDULED_OFF'
  | 'HOLIDAY'
  | 'ABSENT'
  | 'LOSS_OF_PAY'
  | 'INCOMPLETE';

export type StaffSummary = ApiDocument & {
  name: string;
  employeeCode?: string;
  jobTitle?: string;
};

export type AttendanceDay = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  businessDate: string;
  status: AttendanceStatus | string;
  flags: string[];
  punchIn?: string;
  punchOut?: string;
  netMinutes: number;
  lateMinutes: number;
  observedOvertimeMinutes: number;
  eligibleOvertimeMinutes: number;
  approvedOvertimeMinutes: number;
  unresolved: boolean;
  calculatedAt?: string;
};

export type PunchEvent = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  businessDate: string;
  direction: PunchDirection;
  source: 'KIOSK' | 'FIELD';
  serverAt: string;
  verificationStatus: 'VERIFIED' | 'EXCEPTION' | 'APPROVED' | 'REJECTED';
  exceptionReason?: string;
  accuracyM?: number;
  distanceM?: number;
  reviewComment?: string;
};

export type CorrectionRequest = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  businessDate: string;
  proposedIn?: string;
  proposedOut?: string;
  reason: string;
  status: RequestStatus;
  adminComment?: string;
  decidedAt?: string;
};

export type OvertimeRequest = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  businessDate: string;
  observedMinutes: number;
  eligibleMinutes: number;
  requestedMinutes: number;
  approvedMinutes: number;
  reason: string;
  status: RequestStatus;
  adminComment?: string;
};

export type BookingSummary = ApiDocument & {
  customerName?: string;
  shootType?: string;
  location?: string;
};

export type FieldAssignment = ApiDocument & {
  bookingId: string | BookingSummary;
  staffAccountIds: Array<string | StaffSummary>;
  businessDate: string;
  startTime?: string;
  endTime?: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  creditMode: 'FULL_DAY' | 'HALF_DAY' | 'ACTUAL_HOURS';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
};

export type LeaveType = ApiDocument & {
  code: string;
  name: string;
  monthlyAllowanceUnits: number;
  paid: boolean;
  halfDayAllowed: boolean;
  carryForward: false;
  isActive: boolean;
};

export type LeaveBalance = {
  leaveType: { id: string; code: string; name: string };
  month: string;
  allowanceUnits: number;
  reservedUnits: number;
  consumedUnits: number;
  adjustmentUnits: number;
  availableUnits: number;
  allowanceDays: number;
  availableDays: number;
};

export type LeaveDateEntry = {
  date: string;
  portion: LeavePortion;
  units: number;
  excludedReason?: string;
};

export type LeaveRequest = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  leaveTypeId: string | (ApiDocument & { code: string; name: string });
  dateEntries: LeaveDateEntry[];
  reason: string;
  status: RequestStatus;
  adminComment?: string;
  decidedAt?: string;
};

export type DayOffRequest = ApiDocument & {
  staffAccountId?: string | StaffSummary;
  date: string;
  month: string;
  status: RequestStatus;
  employeeNote?: string;
  adminComment?: string;
  fieldAssignmentConflict?: boolean;
};

export type Holiday = ApiDocument & {
  date: string;
  name: string;
  note?: string;
  isActive: boolean;
};

export type EmployeeCalendar = {
  from: string;
  to: string;
  holidays: Holiday[];
  leave: LeaveRequest[];
  offDays: DayOffRequest[];
  assignments: FieldAssignment[];
};

export type TeamCalendar = Omit<EmployeeCalendar, 'assignments'>;

export type AttendanceDayResponse = {
  day: AttendanceDay;
  punches: PunchEvent[];
  corrections: CorrectionRequest[];
};

export type AdminAttendanceRow = {
  staff: StaffSummary;
  day: AttendanceDay;
};

export type AdminDayResponse = {
  date: string;
  timezone: string;
  rows: AdminAttendanceRow[];
};

export type AdminMonthResponse = {
  month: string;
  rows: AttendanceDay[];
};

export type AttendancePolicy = ApiDocument & {
  version: number;
  effectiveFrom: string;
  timezone: string;
  shiftStart: string;
  shiftEnd: string;
  lunchStart: string;
  lunchEnd: string;
  graceMinutes: number;
  fullDayMinutes: number;
  halfDayMinutes: number;
  minimumOvertimeMinutes: number;
  monthlyOffLimit: number;
  defaultFieldRadiusM: number;
  maximumGpsAccuracyM: number;
};

export type AttendanceDevice = ApiDocument & {
  name: string;
  officeLabel: string;
  isActive: boolean;
  enrolledAt?: string;
  enrollmentExpiresAt?: string;
  lastUsedAt?: string;
};

export type EmployeeAccount = {
  id: string;
  employeeCode: string;
  name: string;
  jobTitle: string;
  role: string;
  attendanceEnabled: boolean;
  mustChangePassword: boolean;
  punchPinConfigured: boolean;
};

export type KioskDevice = {
  deviceId: string;
  name: string;
  officeLabel: string;
  online?: boolean;
};

export function documentId(value: ApiDocument | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
}

export function staffName(value: string | StaffSummary | null | undefined): string {
  return typeof value === 'object' && value ? value.name || value.employeeCode || 'Staff' : 'Staff';
}

