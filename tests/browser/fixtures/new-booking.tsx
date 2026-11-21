import '../../../src/index.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/admin/contexts/AuthContext';
import { ConfirmDialogProvider } from '../../../src/admin/components/ConfirmDialog';
import { BookingFormModal } from '../../../src/admin/components/BookingFormModal';
import { api } from '../../../src/admin/api/client';
import { ApiError } from '../../../src/admin/api/http';
import type { BookingWritePayload, StaffAccount, CustomerLookupResponse } from '../../../src/admin/types';

const params = new URLSearchParams(location.search);
localStorage.setItem('auth_token', 'test-only');
api.getCurrentUser = async () => ({ id: 'owner', name: 'Owner', email: 'owner@example.invalid', role: params.has('employee') ? 'employee' : 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false } as StaffAccount);
api.getDeliverables = async () => [];
api.getDeliverableConfiguration = async () => ({ revision: 0, base: [], seasonal: [] });
api.lookupCustomer = async (): Promise<CustomerLookupResponse> => ({ canonicalPhone: '919876543210', active: params.has('duplicate') ? [{ id: 'active-booking', type: 'booking', customerName: 'Existing customer', phone: '9876543210', email: '', service: 'Maternity', status: 'confirmed', relevantDate: '2026-11-22', active: true }] : [], history: [] });
api.checkScheduleConflicts = async () => {
  if (params.has('availabilityError')) throw new Error('Schedule unavailable');
  return { timedConflicts: params.has('overlap') ? [{ id: 'existing', customerName: 'Existing customer', bookingDate: '2026-11-22', startTime: '10:00', endTime: '12:00', status: 'confirmed', location: 'Studio', assignedStaffAccountId: 'staff', assignedStaffAccountName: 'Vignesh', customerPhone: '', service: 'Maternity', whatsappOptIn: false }] : [], untimedConflicts: [], blocked: params.has('overlap'), requiresTimedConfirmation: params.has('overlap'), requiresUntimedConfirmation: false };
};
export function Harness() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(true);
  const [calls, setCalls] = useState<BookingWritePayload[]>([]);
  const [attempts, setAttempts] = useState(0);
  return <><button onClick={() => setOpen(true)}>Add booking</button><output data-testid="calls">{JSON.stringify(calls)}</output>{isAuthenticated && open && <BookingFormModal packages={[]} services={[{ label: 'Maternity', path: '/maternity', order: 0, description: '', icon: '', imageUrl: '', sections: [], isPublished: true }]} staffAccounts={[{ id: 'staff', name: 'Vignesh', jobTitle: 'Photographer', canTakeShoots: true }]} onClose={() => setOpen(false)} onSave={async payload => {
    setCalls(current => [...current, payload]);
    setAttempts(value => value + 1);
    if (params.has('identity') && !payload.customerId && !payload.newCustomerReason) throw new ApiError('Choose the matching customer before saving.', 409, { code: 'CUSTOMER_IDENTITY_RESOLUTION_REQUIRED', customers: [{ customerId: 'customer-one', customerCode: 'DP-C202611-0001', customerName: 'Existing customer' }] });
    if (params.has('failOnce') && attempts === 0) throw new Error('Temporary save failure');
    setOpen(false);
  }} />}</>;
}
createRoot(document.getElementById('root')!).render(<div className="admin-theme"><BrowserRouter><AuthProvider><ConfirmDialogProvider><Harness /></ConfirmDialogProvider></AuthProvider></BrowserRouter></div>);
