import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/admin/contexts/AuthContext';
import { ConfirmDialogProvider } from '../../../src/admin/components/ConfirmDialog';
import { SchedulePage } from '../../../src/admin/pages/SchedulePage';
import { api } from '../../../src/admin/api/client';
import type { ScheduleBookingItem, StaffAccount } from '../../../src/admin/types';
import '../../../src/index.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';

const params = new URLSearchParams(location.search);
localStorage.setItem('auth_token', 'test-only');
api.getCurrentUser = async () => ({ id: 'staff', name: 'Staff', email: 'staff@example.invalid', role: params.has('readonly') ? 'sales' : 'owner', isActive: true, permissions: [], permissionOverrides: params.has('readonly') ? { schedule: 'view' } : {}, mustChangePassword: false }) as StaffAccount;
const item = (id: string, date: string, start: string, end: string, patch: Partial<ScheduleBookingItem> = {}): ScheduleBookingItem => ({
  id, customerName: id, customerPhone: '9876543210', service: 'Maternity', bookingDate: date, startTime: start, endTime: end, status: 'confirmed', location: 'Studio', assignedStaffAccountName: 'Photographer', whatsappOptIn: true, ...patch,
});
let bookings = [
  item('Long shoot', '2026-11-11', '07:00', '13:00'),
  item('Wednesday second', '2026-11-11', '10:00', '12:00'),
  item('Wednesday third', '2026-11-11', '11:00', '14:00'),
  item('Thursday portrait', '2026-11-12', '14:00', '16:00'),
  item('Saturday first', '2026-11-14', '11:00', '13:00'),
  item('Saturday second', '2026-11-14', '12:00', '14:00'),
  item('Sunday first', '2026-11-15', '16:00', '17:00'),
  item('Sunday second', '2026-11-15', '16:00', '18:00'),
  item('Cancelled shoot', '2026-11-14', '15:00', '18:00', { status: 'cancelled' }),
  ...(params.has('full') ? [item('All day session', '2026-11-12', '11:00', '20:00')] : []),
  ...(params.has('untimed') ? [item('Needs time', '2026-11-14', '', '')] : []),
];
api.getSchedule = async (dateFrom, dateTo, includeCancelled) => {
  if (params.has('error')) throw new Error('Could not load schedule');
  return { dateFrom, dateTo, timezone: 'Asia/Kolkata', bookings: bookings.filter(row => row.bookingDate >= dateFrom && row.bookingDate <= dateTo && (includeCancelled || row.status !== 'cancelled')) };
};
api.getPackages = async () => [];
api.getPhotographyServices = async () => [];
api.getAssignableStaffAccounts = async () => [];
api.checkScheduleConflicts = async () => ({ timedConflicts: [], untimedConflicts: [], blocked: false, requiresTimedConfirmation: false, requiresUntimedConfirmation: false });
api.rescheduleBooking = async (id, input) => {
  bookings = bookings.map(row => row.id === id ? { ...row, ...input } : row);
  // Reuse the real mapper for the return shape expected by the page's WhatsApp handler.
  const { mapBooking } = await import('../../../src/admin/api/mappers');
  return mapBooking({ ...bookings.find(row => row.id === id), _id: id, shootType: 'Maternity' });
};
export function Harness() {
  const { isAuthenticated } = useAuth();
  return <div className="admin-theme schedule-fixture">{isAuthenticated && <Routes><Route path="/admin/schedule" element={<SchedulePage />} /><Route path="/admin/bookings/:id" element={<h1>Booking detail</h1>} /></Routes>}</div>;
}
createRoot(document.getElementById('root')!).render(<MemoryRouter initialEntries={['/admin/schedule']}><AuthProvider><ConfirmDialogProvider><Harness /></ConfirmDialogProvider></AuthProvider></MemoryRouter>);
