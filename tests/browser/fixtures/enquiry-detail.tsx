import '../../../src/index.css';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../../src/admin/contexts/AuthContext';
import { ConfirmDialogProvider } from '../../../src/admin/components/ConfirmDialog';
import { RequireAuth } from '../../../src/admin/components/Layout';
import { EnquiryDetailPage } from '../../../src/admin/pages/EnquiryDetailPage';
import { api } from '../../../src/admin/api/client';
import { mapEnquiry } from '../../../src/admin/api/mappers';
import type { StaffAccount } from '../../../src/admin/types';

localStorage.setItem('auth_token', 'test-only');
api.getCurrentUser = async () => ({ id: 'owner', name: 'Studio Owner', role: params.has('readonly') ? 'content_manager' : 'owner', isActive: true, permissions: [], permissionOverrides: {}, mustChangePassword: false }) as StaffAccount;
const params = new URLSearchParams(location.search);
api.getAssignableStaffAccounts = async () => [{ id: 'staff', name: 'Studio Staff', jobTitle: 'Sales' }];
api.lookupCustomer = async () => ({ canonicalPhone: '919876543210', active: [], history: [] });
api.getEnquiry = async () => mapEnquiry({
  _id: 'one', name: params.has('longRecord') ? 'LongCustomerName'.repeat(10) : 'Harsa', phone: '9876543210', source: 'instagram',
  stage: 'new', shootType: 'Maternity', location: 'Studio', bookingDate: '2027-01-01',
  message: params.has('longRecord') ? 'Customer message.\n'.repeat(70) : '', notes: '', internalNotes: [], callHistory: [],
});
createRoot(document.getElementById('root')!).render(
  <div className="admin-theme"><MemoryRouter initialEntries={['/admin/enquiries/one']}><AuthProvider><ConfirmDialogProvider>
    <Routes><Route element={<RequireAuth />}><Route path="/admin/enquiries/:id" element={<EnquiryDetailPage />} /></Route></Routes>
  </ConfirmDialogProvider></AuthProvider></MemoryRouter></div>,
);
