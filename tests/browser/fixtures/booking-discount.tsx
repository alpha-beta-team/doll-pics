import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/admin/contexts/AuthContext';
import { ConfirmDialogContext } from '../../../src/admin/hooks/useConfirmDialog';
import { BookingFormModal } from '../../../src/admin/components/BookingFormModal';
import { api } from '../../../src/admin/api/client';
import { mapBooking } from '../../../src/admin/api/mappers';
import type { BookingWritePayload, Enquiry, StaffAccount } from '../../../src/admin/types';

const params = new URLSearchParams(location.search);
const role = params.get('role') as StaffAccount['role'];
const mode = params.get('mode');
const recordId = mode === 'create' ? 'new' : mode === 'edit' ? 'booking' : 'enquiry';
localStorage.setItem('auth_token', 'test-only');
localStorage.setItem(`doll_admin_booking_draft:${recordId}`, JSON.stringify({
  customerName: 'Test customer', customerPhone: '9876543210', shootType: 'Portrait',
  agreedTotal: '10000', discount: 0, step: 2,
}));
api.getCurrentUser = async () => ({ id: 'staff', name: 'Staff', email: 'staff@example.invalid', role, isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false } as StaffAccount);
api.lookupCustomer = async () => {
  document.documentElement.dataset.lookupComplete = 'true';
  return { canonicalPhone: '919876543210', active: [], history: [] };
};
const booking = mode === 'edit' ? mapBooking({ _id: 'booking', customerName: 'Test customer', customerPhone: '9876543210', agreedTotal: 10000 }) : undefined;
const enquiry = mode === 'convert' ? { id: 'enquiry', name: 'Test customer', phone: '9876543210' } as Enquiry : undefined;
export function Harness() {
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState<BookingWritePayload | null>(null);
  return <><output data-testid="saved">{saved ? JSON.stringify(saved) : ''}</output>{isAuthenticated && <BookingFormModal booking={booking} enquiry={enquiry} packages={[]} services={[]} staffAccounts={[]} onClose={() => {}} onSave={async payload => { setSaved(payload); }} />}</>;
}
createRoot(document.getElementById('root')!).render(<BrowserRouter><AuthProvider><ConfirmDialogContext.Provider value={async () => true}><Harness /></ConfirmDialogContext.Provider></AuthProvider></BrowserRouter>);
