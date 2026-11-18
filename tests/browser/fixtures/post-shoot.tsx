import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../src/admin/contexts/AuthContext';
import { PostShootTrackingPage } from '../../../src/admin/pages/PostShootTrackingPage';
import { orderWorkflowApi } from '../../../src/admin/api/orderWorkflow';
import { api } from '../../../src/admin/api/client';
import { mapBooking } from '../../../src/admin/api/mappers';
import type { StaffAccount } from '../../../src/admin/types';
import type { TrackingFilters } from '../../../src/admin/components/postShootTracking';
import { createTrackingFixtureRows, createStageFixtureRows, trackingFixtureResult } from './post-shoot-data';
import type { OrderInput, OrderWorkflow } from '../../../src/shared/orderWorkflow';
import '../../../src/index.css';
import '../../../src/admin/pages/booking-detail.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
const fixtureParams = new URLSearchParams(location.search);
const readonly = fixtureParams.has('readonly');
localStorage.setItem('auth_token', 'fixture');
api.getCurrentUser = async () => ({ id: 'staff', name: 'Anitha', role: readonly ? 'operations' : 'owner', permissionOverrides: readonly ? { bookings: 'view' } : {}, isActive: true, mustChangePassword: false } as StaffAccount);
api.getAssignableStaffAccounts = async () => [{ id: 'staff', name: 'Anitha', jobTitle: 'Studio manager' }, { id: 'editor', name: 'Priya', jobTitle: 'Editor' }];
let rows = fixtureParams.has('stages') ? createStageFixtureRows() : createTrackingFixtureRows();
const calls: { id: string; input: OrderInput }[] = [];
let failed = false;
const listCalls: TrackingFilters[] = [];
Object.assign(window, { trackingTest: { calls, listCalls } });
if (!fixtureParams.has('http')) orderWorkflowApi.list = async (filters = {}) => { listCalls.push(structuredClone(filters)); return trackingFixtureResult(structuredClone(rows), filters); };
orderWorkflowApi.get = async id => {
  const order = rows.find(row => row.id === id)?.order;
  return { orderWorkflow: order ? { ...structuredClone(order), history: [] } as OrderWorkflow : null };
};
orderWorkflowApi.update = async (id, input) => {
  calls.push({ id, input: structuredClone(input) });
  if (id === 'order-1' && !failed) { failed = true; throw new Error('Printer temporarily unavailable'); }
  const row = rows.find(row => row.id === id)!;
  if (input.revision !== (row.order?.revision ?? 0)) throw new Error('Order changed. Reload before saving.');
  const occurredAt = input.occurredAt || new Date().toISOString();
  if (!row.order) {
    if (input.action !== 'initialize' || !input.stage || !input.mode) throw new Error('Initialize tracking first.');
    row.order = { stage: input.stage, mode: input.mode, state: 'active', revision: 0, enteredAt: occurredAt, dates: {}, assigneeId: '', assigneeName: '', details: {} };
  }
  row.order.revision++;
  if (input.stage) { row.order.stage = input.stage; row.order.enteredAt = occurredAt; row.order.dates[input.stage] = occurredAt; }
  if (input.mode) row.order.mode = input.mode;
  if (input.stage === 'delivered' || (row.order.mode === 'digital' && input.stage === 'photos_delivered')) row.order.state = 'completed';
  if (input.assigneeId !== undefined) {
    row.order.assigneeId = input.assigneeId;
    row.order.assigneeName = (await api.getAssignableStaffAccounts()).find(person => person.id === input.assigneeId)?.name || '';
  }
  if (input.details) row.order.details = { ...row.order.details, ...input.details };
  rows = [...rows];
  return { orderWorkflow: { ...structuredClone(row.order), history: [] } as OrderWorkflow };
};
api.getBooking = async id => {
  const row = rows.find(row => row.id === id)!;
  return mapBooking({ _id: id, customerName: row.customerName, customerPhone: row.customerPhone, customerCode: row.customerCode, bookingDate: row.bookingDate, shootType: row.shootType, status: row.status });
};
function App() { const { isAuthenticated } = useAuth(); return isAuthenticated ? <PostShootTrackingPage /> : <p>Loading session…</p>; }
const Router = fixtureParams.has('browser') ? BrowserRouter : MemoryRouter;
const content = <Router><AuthProvider><div className="admin-theme min-h-screen"><App /></div></AuthProvider></Router>;
createRoot(document.getElementById('root')!).render(fixtureParams.has('strict') ? <StrictMode>{content}</StrictMode> : content);
