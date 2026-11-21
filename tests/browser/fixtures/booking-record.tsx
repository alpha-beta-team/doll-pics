import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider, useLoaderData } from 'react-router-dom';
import { useState } from 'react';
import { BookingHeader } from '../../../src/admin/components/bookings/BookingHeader';
import { WorkflowTracker, WorkflowTrackerSkeleton } from '../../../src/admin/components/bookings/WorkflowTracker';
import { bookingRecordLoader, type BookingRecordData } from '../../../src/admin/pages/bookingRecordLoader';
import { api } from '../../../src/admin/api/client';
import '../../../src/index.css';
import '../../../src/admin/pages/booking-detail.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
export function Record() {
  const data = useLoaderData() as BookingRecordData;
  const [booking, setBooking] = useState(data.booking!);
  const [message, setMessage] = useState('');
  if (!booking) return <p>{data.error}</p>;
  return <div className="admin-theme booking-detail bd-reference-record" style={{ padding: 28, maxWidth: 1232, margin: 'auto' }}>
    <BookingHeader booking={booking} canManage canEdit canViewPhone saving={false} onEdit={() => setMessage('Editing booking')} notify={setMessage} onCancel={async reason => { setBooking(await api.transitionBooking(booking.id, 'cancelled', undefined, undefined, { reason })); return true; }} />
    <div style={{ marginTop: 22 }}><WorkflowTracker booking={booking} canManage onSaved={setBooking} /></div>
    <p role="status">{message}</p>
  </div>;
}
localStorage.setItem('auth_token', 'test-only');
const router = createMemoryRouter([{ path: '/admin/bookings/:id', loader: bookingRecordLoader, element: <Record />, hydrateFallbackElement: <WorkflowTrackerSkeleton /> }], { initialEntries: ['/admin/bookings/one'] });
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
