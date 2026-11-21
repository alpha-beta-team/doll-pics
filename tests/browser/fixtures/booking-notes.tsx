import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ConfirmDialogProvider } from '../../../src/admin/components/ConfirmDialog';
import { BookingNotesFollowUps } from '../../../src/admin/components/bookings/BookingNotesFollowUps';
import { mapBooking } from '../../../src/admin/api/mappers';
import '../../../src/index.css';
import '../../../src/admin/pages/booking-detail.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-500.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
const booking = mapBooking({ _id: 'one', customerName: 'Kaarmuhilan KP', customerCode: 'DP-C202611-0052', assignedStaffAccountId: 'dinesh', workflow: { steps: [{ key: 'editing', label: 'Editing', status: 'current', dueAt: '2026-11-21T04:58:00Z', milestones: [] }] } });
document.body.style.background = '#fff';
localStorage.setItem('auth_token', 'test-only');
export function Fixture() {
  const [summary, setSummary] = useState('');
  return <ConfirmDialogProvider><div className="admin-theme booking-detail" style={{ margin: '297px 0 0 clamp(0px, calc((100vw - 880px) / 2), 280px)', width: 'min(803.67px, 96vw)', padding: 0, borderRadius: 0 }}><BookingNotesFollowUps booking={booking} canManage={!location.search.includes('readonly')} staff={[{ id: 'dinesh', name: 'Dinesh', jobTitle: 'Senior Photographer' }, { id: 'kavin', name: 'Kavin', jobTitle: '' }]} staffLoading={false} staffError="" retryStaff={() => {}} onSummary={state => setSummary(`${state.pendingFollowUpCount} pending follow-ups`)} /><output aria-label="Workspace summary" className="sr-only">{summary}</output></div></ConfirmDialogProvider>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
