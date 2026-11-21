import '../../../src/index.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/public-sans/latin-700.css';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { EnquiryFormModal } from '../../../src/admin/components/EnquiryFormModal';
import { api } from '../../../src/admin/api/client';
import { mapEnquiry } from '../../../src/admin/api/mappers';
import type { AdminEnquiryWritePayload, CustomerLookupResponse, Enquiry } from '../../../src/admin/types';

declare global { interface Window { enquiryModalTest: { release?: () => void } } }
window.enquiryModalTest = {};
const params = new URLSearchParams(location.search);
const editing = params.has('edit') || params.has('masked');
const savedEnquiry = mapEnquiry({ _id: 'enquiry', name: 'Existing customer', phone: '9876543210', source: 'instagram', shootType: 'Maternity', notes: 'Keep existing notes', bookingDate: '2026-11-23', startTime: '10:00', endTime: '12:00', whatsappOptIn: true, whatsappNotificationsEnabled: true });
api.getSiteContent = async () => ({ serviceNavLinks: [{ label: 'Maternity', path: '/maternity', order: 0, description: '', icon: '', imageUrl: '', sections: [], isPublished: true }] }) as never;
api.lookupCustomer = async (): Promise<CustomerLookupResponse> => ({ canonicalPhone: '919876543210', active: params.has('duplicate') ? [{ id: 'existing', type: 'enquiry', customerName: 'Existing enquiry', phone: '9876543210', email: '', service: 'Maternity', status: 'new', relevantDate: '', active: true }] : [], history: [] });
export function Harness() {
  const [open, setOpen] = useState(true);
  const [calls, setCalls] = useState<Array<{ method: string; payload: AdminEnquiryWritePayload }>>([]);
  const save = async (method: string, payload: AdminEnquiryWritePayload): Promise<Enquiry> => {
    setCalls(current => [...current, { method, payload }]);
    if (params.has('hold')) await new Promise<void>(resolve => { window.enquiryModalTest.release = resolve; });
    if (params.has('fail') && calls.length === 0) throw new Error('Temporary enquiry save failure');
    return { ...savedEnquiry, ...payload } as Enquiry;
  };
  api.createAdminEnquiry = payload => save('create', payload);
  api.updateEnquiry = (_id, payload) => save('update', payload as AdminEnquiryWritePayload);
  return <><button onClick={() => setOpen(true)}>Open enquiry form</button><output data-testid="calls">{JSON.stringify(calls)}</output>{open && <EnquiryFormModal enquiry={editing ? savedEnquiry : undefined} phoneReadOnly={params.has('masked')} onClose={() => setOpen(false)} onSaved={() => setOpen(false)} />}</>;
}
createRoot(document.getElementById('root')!).render(<div className="admin-theme"><MemoryRouter><Harness /></MemoryRouter></div>);
