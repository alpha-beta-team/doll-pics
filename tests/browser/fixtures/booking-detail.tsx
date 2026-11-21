import { CrewServiceType } from '../../../src/shared/crew';
import { RequireAuth } from '../../../src/admin/components/Layout';
import { nextOrderStages, type OrderWorkflow, type OrderStage } from '../../../src/shared/orderWorkflow';
import { orderWorkflowApi } from '../../../src/admin/api/orderWorkflow';
import { bookingWorkspaceApi } from '../../../src/admin/api/bookingWorkspace';
import type { BookingWorkspace } from '../../../src/shared/bookingWorkspace';
import '../../../src/admin/components/deliverables-editor.css';
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../../../src/admin/contexts/AuthContext";
import { ConfirmDialogProvider } from "../../../src/admin/components/ConfirmDialog";
import { BookingDetailPage } from "../../../src/admin/pages/BookingDetailPage";
import { api } from "../../../src/admin/api/client";
import { staffAccountsApi } from "../../../src/admin/api/staffAccounts";
import { mapBooking } from "../../../src/admin/api/mappers";
import { ApiError } from "../../../src/admin/api/http";
import type {
  Booking,
  VoiceNoteSummary,
  StaffAccount,
  WhatsAppMessageSummary,
} from "../../../src/admin/types";
import "../../../src/index.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";

declare global {
  interface Window {
    bookingTest: {
      calls: { method: string; args: unknown[] }[];
      fail: string;
      hold: boolean;
      release?: () => void;
    };
  }
}
api.getDeliverables = async () => [];
api.getDeliverableConfiguration = async () => ({ revision: 0, base: [], seasonal: [] });
const params = new URLSearchParams(location.search);
let order: OrderWorkflow | null = params.has('workflow') ? { stage: (params.get('stage') || 'editing') as OrderStage, state: params.has('completed') ? 'completed' : 'active', mode: 'physical', enteredAt: '2026-11-17T04:30:00Z', dates: {}, assigneeId: 'staff', assigneeName: 'Staff', details: {}, revision: 1, history: [] } : null;
orderWorkflowApi.get = async () => ({ orderWorkflow: structuredClone(order) });
orderWorkflowApi.update = async (_id, input) => {
  if (!order || input.revision !== order.revision || input.action !== 'advance' || !nextOrderStages(order).includes(input.stage!)) throw new Error('Invalid order update');
  window.bookingTest.calls.push({ method: 'order', args: [input] });
  order = { ...order, stage: input.stage!, revision: order.revision + 1, enteredAt: new Date().toISOString() };
  order.dates[order.stage] = order.enteredAt;
  if (order.stage === 'editing') order.editingDueAt = new Date(Date.now() + 5 * 86400000).toISOString();
  return { orderWorkflow: structuredClone(order) };
};
window.bookingTest = { calls: [], fail: "", hold: false };
const role = (params.get("role") || "owner") as StaffAccount["role"];
localStorage.setItem("auth_token", "test-only");
api.getCurrentUser = async () =>
  ({
    id: "staff",
    name: desktop ? "Super Admin" : "Staff",
    email: "staff@example.invalid",
    role,
    isActive: true,
    permissions: params.has("masked") ? [] : ["mask_phone_number"],
    permissionOverrides: params.has("readonly") ? { bookings: "view" } : {},
    mustChangePassword: false,
  }) as StaffAccount;
let booking = mapBooking({
  _id: "one",
  customerName: "Vimala Yuvaraj",
  customerPhone: params.has("noPhone") ? "" : params.has("masked") ? "******3210" : "9876543210",
  shootType: "Baby Shower",
  preferredEvent: "baby shower",
  bookingDate: "2026-09-17",
  startTime: "09:00",
  endTime: "10:00",
  location: "Gopi",
  assignedStaffAccountId: "staff",
  assignedStaffAccountName: "Vignesh",
  notes: "Baby shower — bring a portrait lens.",
  status: params.get("status") || "confirmed",
  statusBeforeCancellation: "confirmed",
  packageId: params.has("package") ? "package" : null,
  agreedTotal: params.has("unpriced") ? null : 25000,
  paymentSummary: {
    amountPaid: 0,
    balanceDue: params.has("unpriced") ? null : 25000,
    status: "unpaid",
  },
  whatsappOptIn: true,
  whatsappNotificationsEnabled: true,
  whatsappOptOutAt: params.has("optout") ? "2026-09-01T00:00:00Z" : undefined,
  deliverables: params.has("photoCount") ? [{ id: 'photos', catalogId: 'photos', name: 'Edited images', kind: 'digital', unit: 'images', specifications: '', quantity: 25, category: 'included', amount: 0 }] : [],
  driveRawsUrl: params.has("raws") ? "https://drive.google.com/raws" : "",
  calendarSyncStatus: params.has("calendarFailed") ? "failed" : "synced",
  calendarSyncedAt: "2026-09-04T06:00:00Z",
});
if (params.has('record') || params.has('desktop')) {
  booking = { ...booking, customerCode: 'DP-C202611-0052', source: 'website', packageName: 'Newborn Home Shoot – Half Day', preferredLanguage: 'en',
    crewList: [{ staffAccountId: 'staff', memberName: 'Dinesh', serviceType: CrewServiceType.CandidPhoto }, { staffAccountId: 'team', memberName: 'Doll Marketing Team', serviceType: CrewServiceType.OutdoorVideo }],
    deliverables: [
      { id: 'photos', catalogId: 'photos', name: 'Edited photos', kind: 'digital', unit: 'images', quantity: 25, category: 'included', amount: 0, specifications: '' },
      { id: 'frame', catalogId: 'frame', name: 'Frame', kind: 'physical', unit: 'items', quantity: 2, category: 'extra', amount: 500, specifications: '' },
      { id: 'album', catalogId: 'album', name: 'Album', kind: 'physical', unit: 'items', quantity: 1, category: 'included', amount: 0, specifications: '6×18' },
      { id: 'gift', catalogId: 'gift', name: 'Gift print', kind: 'physical', unit: 'items', quantity: 1, category: 'complimentary', amount: 0, specifications: '' },
    ],
  };
}
const desktop = params.has('desktop');
if (desktop) {
  Object.assign(booking, {
    customerName: 'Kaarmuhilan KP', notes: '', customerPhone: '+91 90000 00052', location: 'Erode',
    bookingDate: '2026-11-14', startTime: '17:42', endTime: '19:42', shootType: 'Newborn',
    assignedStaffAccountName: 'Dinesh', agreedTotal: 15500,
    paymentSummary: { amountPaid: 0, balanceDue: 15500, status: 'unpaid' },
    driveGalleryUrl: 'http://localhost:5173/admin/gallery', driveEditedUrl: 'http://localhost:5173/admin/photos',
    workflowActivity: [
      { what: 'Shoot marked complete', when: '2026-11-14T14:20:00Z', who: { id: 'owner', name: 'Super Admin' } },
      { what: 'Photos shared for selection', when: '2026-11-15T12:40:00Z', who: { id: 'owner', name: 'Super Admin' } },
      { what: 'Customer finished selecting photos', when: '2026-11-16T04:58:00Z', who: { id: 'owner', name: 'Super Admin' } },
    ],
  });
  const rows = booking.deliverables!; // The desktop fixture always starts with the four record rows above.
  rows[3] = { ...rows[2], id: 'album-large', catalogId: 'album-large', specifications: '20 pages · 12 × 12 in' };
  const catalog = rows.map(row => ({ ...row, id: row.catalogId, defaultQuantity: row.quantity, active: true, selectedByDefault: false, order: 0 }));
  api.getDeliverables = async () => [...catalog, { ...catalog[1], id: 'calendar', name: 'Calendar', defaultQuantity: 1 }];
  const base = rows.filter(row => row.category === 'included').map(row => ({ ...row, category: 'included' as const }));
  api.getDeliverableConfiguration = async () => ({ revision: 1, base, seasonal: [{ id: 'christmas', name: 'Christmas', active: true, items: [{ ...base[0], id: 'calendar', name: 'Calendar', quantity: 1, category: 'complimentary' }] }] });
}
if (desktop && params.has('longRecord')) {
  const name = 'LongCustomerName'.repeat(10);
  booking.customerName = name;
  booking.assignedStaffAccountName = name;
  booking.location = name;
  booking.deliverables = Array.from({ length: 35 }, (_, i) => ({
    ...booking.deliverables![0], id: String(i), name: name + i,
  }));
}
const paymentState = params.get('paymentState');
if (paymentState) {
  const received = paymentState === 'paid' ? 25000 : paymentState === 'overpaid' ? 27000 : 5000;
  booking = { ...booking, paymentSummary: { amountPaid: received, balanceDue: 25000 - received, status: paymentState as Booking['paymentSummary']['status'] }, payments: [{ id: 'existing', amount: received, paidAt: '2026-11-18T06:00:00Z', method: 'upi', reference: '', note: '' }] };
}
// Detail responses include the compact workflow, independently of the legacy editor request.
function fixtureWorkflow(): NonNullable<Booking['workflow']> {
  const phase = !order ? booking.status === 'confirmed' || booking.status === 'draft' ? 0 : 1
    : ['shoot_completed', 'awaiting_selection'].includes(order.stage) ? 1 : ['editing', 'photos_delivered'].includes(order.stage) ? 2 : ['edited_selected', 'printing', 'in_transit'].includes(order.stage) ? 3 : 4;
  return { cancelledAt: booking.status === 'cancelled' ? '2026-11-18T04:30:00Z' : undefined, steps: ['Shoot', 'Selection', 'Editing', 'Printing', 'Delivery'].map((label, index) => ({ key: label.toLowerCase(), label,
    status: order?.mode === 'digital' && index === 3 ? 'skipped' as const : order?.state === 'completed' || index < phase ? 'done' as const : index === phase ? 'current' as const : 'upcoming' as const,
    dueAt: desktop && index === 2 ? '2026-11-21T04:58:00Z' : undefined,
    completedAt: desktop && index === 0 ? '2026-11-14T14:20:00Z' : index < phase ? '2026-11-16T04:30:00Z' : undefined,
    milestones: desktop && index === 2 ? [{ key: 'photos_delivered', label: 'Edited photos shared', done: false }, { key: 'edited_selected', label: 'Customer selected edited photos', done: false }] : [{ key: `${label.toLowerCase()}_fixture`, label: `${label} completed`, done: index < phase }],
  })) };
}
booking.workflow = params.has('legacyDelivery') ? undefined : fixtureWorkflow();
async function save(method: string, args: unknown[], patch: Partial<Booking>) {
  window.bookingTest.calls.push({ method, args });
  if (window.bookingTest.hold)
    await new Promise<void>((resolve) => {
      window.bookingTest.release = resolve;
    });
  if (window.bookingTest.fail === method)
    throw new Error("Temporary save failure");
  if (
    window.bookingTest.fail === "conflict" &&
    method === "transition" &&
    !args[3]
  ) {
    throw new ApiError("Overlap", 409, {
      code: "TIMED_BOOKING_CONFLICT",
      timedConflicts: [
        {
          customerName: "Other customer",
          startTime: "09:00",
          endTime: "10:00",
        },
      ],
      untimedConflicts: [],
    });
  }
  booking = { ...booking, ...patch };
  return booking;
}
api.getBooking = async (id) => ({
  ...booking,
  workflow: params.has('legacyDelivery') ? undefined : fixtureWorkflow(),
  id,
  customerName: id === "two" ? "Second customer" : booking.customerName,
});
api.getPackages = async () => [];
api.getPhotographyServices = async () => [];
api.getAssignableStaffAccounts = async () => desktop ? [
  { id: 'staff', name: 'Dinesh', jobTitle: 'Senior Photographer' },
  { id: 'new', name: 'Surya', jobTitle: 'Creative Head' },
  { id: 'owner', name: 'Super Admin', jobTitle: 'Owner' },
] : [
  { id: "staff", name: "Vignesh", jobTitle: "Photographer" },
  { id: "new", name: "Priya", jobTitle: "Photographer" },
];
staffAccountsApi.getAssignableStaffAccounts = api.getAssignableStaffAccounts;
api.getReviewConfig = async () => ({
  googleReviewUrl: "https://example.invalid/review",
});
api.getPricingPreview = async () =>
  ({
    pricingMode: "price",
    pricing: { effectivePrice: 24000, token: "price-token" },
  }) as Awaited<ReturnType<typeof api.getPricingPreview>>;
api.transitionBooking = async (...args) =>
  save("transition", args, { status: args[1] });
api.updateBooking = async (...args) =>
  save("update", args, args[1] as Partial<Booking>);
api.scheduleBookingFollowUp = async (...args) =>
  save("followup", args, {
    nextFollowUpAt: args[1],
    followUpNote: args[2] || "",
  });
api.completeBookingFollowUp = async (...args) =>
  save("completeFollowup", args, { nextFollowUpAt: undefined });
api.completeBookingDelivery = async (...args) =>
  save("delivery", args, {
    status: "delivered",
    deliverySentAt: "2026-11-09T06:00:00Z",
  });
api.addBookingPayment = async (...args) =>
  save("addPayment", args, {
    payments: [
      {
        id: "payment",
        ...args[1],
        reference: args[1].reference || "",
        note: args[1].note || "",
        createdAt: "",

      },
    ],
    paymentSummary: {
      amountPaid: args[1].amount,
      balanceDue: 25000 - args[1].amount,
      status: "partial",
    },
  });
api.updateBookingPayment = async (...args) =>
  save("editPayment", args, {
    payments: booking.payments.map((p) =>
      p.id === args[1] ? { ...p, ...args[2] } : p,
    ),
  });
api.removeBookingPayment = async (...args) =>
  save("deletePayment", args, { payments: [] });
api.retryBookingCalendarSync = async (...args) =>
  save("calendar", args, { calendarSyncStatus: "pending" });
api.updateBookingReview = async (...args) =>
  save("review", args, {
    reviewStatus: args[1] === "received" ? "received" : "requested",
  });
api.getBookingWhatsAppMessages = async () =>
  Array.from(
    { length: params.has("messages") ? 17 : 0 },
    (_, i) =>
      ({
        id: `message-${i}`,
        eventType: `booking_update_${i + 1}`,
        status: i ? "delivered" : "failed",
        scheduledAt: "2026-09-04T06:00:00Z",
      }) as WhatsAppMessageSummary,
  );
api.retryBookingWhatsAppMessage = async (...args) => {
  await save("retryMessage", args, {});
};
let voiceNotes: VoiceNoteSummary[] = params.has('voiceNote') ? [{ id: 'voice-existing', recordType: 'booking', recordId: 'one', durationSeconds: 12, mimeType: 'audio/webm', sizeBytes: 2048, createdAt: '2026-11-19T06:00:00Z', createdBy: { id: 'staff', name: 'Staff' } }] : [];
api.listVoiceNotes = async () => structuredClone(voiceNotes);
api.getVoiceNoteContent = async id => {
  await save('voiceContent', [id], {});
  return new Blob(['test audio'], { type: 'audio/webm' });
};
api.createVoiceNote = async (target, blob, durationSeconds) => {
  await save('createVoiceNote', [target, blob.type, durationSeconds], {});
  const note: VoiceNoteSummary = { id: `voice-${voiceNotes.length + 1}`, ...target, durationSeconds, mimeType: blob.type, sizeBytes: blob.size, createdAt: new Date().toISOString(), createdBy: { id: 'staff', name: 'Staff' } };
  voiceNotes = [note, ...voiceNotes];
  return note;
};
api.deleteVoiceNote = async id => {
  await save('deleteVoiceNote', [id], {});
  voiceNotes = voiceNotes.filter(note => note.id !== id);
};
api.getOccasions = async () => [];
api.lookupCustomer = async () => ({
  canonicalPhone: "919876543210",
  active: [],
  history: [],
});
let workspace: BookingWorkspace = { notes: [], followUps: [], pendingFollowUpCount: 0, nextFollowUpId: '', nextFollowUpAt: null, followUpNote: '' };
const workspaceActor = { id: 'staff', name: 'Staff' };
if (params.has('record')) workspace.notes = [
  { id: 'new', body: 'Latest unpinned note', pinned: false, revision: 1, createdAt: '2026-11-19T12:00:00Z', updatedAt: '2026-11-19T12:00:00Z', createdBy: workspaceActor, updatedBy: workspaceActor, history: [] },
  { id: 'pinned', body: 'Pinned customer preference', pinned: true, revision: 1, createdAt: '2026-11-17T12:00:00Z', updatedAt: '2026-11-17T12:00:00Z', createdBy: workspaceActor, updatedBy: workspaceActor, history: [] },
  { id: 'old', body: 'Older internal note', pinned: false, revision: 1, createdAt: '2026-11-16T12:00:00Z', updatedAt: '2026-11-16T12:00:00Z', createdBy: workspaceActor, updatedBy: workspaceActor, history: [] },
];
if (desktop) {
  const admin = { id: 'admin', name: 'admin' }, owner = { id: 'owner', name: 'Super Admin' };
  workspace.notes = ['spoke to customer, they need to reshedule shoot', 'neeed to dicssss', 'need to discuss with team'].map((body, index) => {
    const at = index === 1 ? '2026-11-16T15:21:00Z' : '2026-11-16T15:20:00Z';
    return { id: String(index), body, pinned: index < 2, revision: index < 2 ? 2 : 1, createdAt: at, updatedAt: at, createdBy: index === 1 ? owner : admin, updatedBy: owner,
      history: index < 2 ? [{ at, action: 'pinned', actor: owner }] : [] };
  });
  workspace.followUps = [{ id: 'call', title: 'Call follow-up', details: 'Need to call and enquiry', assigneeId: 'kavin', assigneeName: 'Kavin', dueAt: '2026-11-17T15:22:00Z', status: 'completed', outcome: '', revision: 2,
    createdAt: '2026-11-16T15:23:00Z', updatedAt: '2026-11-16T16:02:00Z', createdBy: owner, updatedBy: owner, history: [{ action: 'completed', at: '2026-11-16T16:02:00Z', actor: owner }] }];
}
function workspaceResult(method: string, args: unknown[], update: () => void) {
  window.bookingTest.calls.push({ method, args });
  if (window.bookingTest.fail === 'workspace') throw new Error('Temporary workspace save failure');
  update();
  const pending = workspace.followUps.filter(row => row.status === 'pending').sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  workspace = { ...workspace, pendingFollowUpCount: pending.length, nextFollowUpId: pending[0]?.id || '', nextFollowUpAt: pending[0]?.dueAt || null, followUpNote: pending[0]?.title || '' };
  booking = { ...booking, pendingFollowUpCount: pending.length, nextFollowUpAt: workspace.nextFollowUpAt || undefined, followUpNote: workspace.followUpNote };
  return structuredClone(workspace);
}
bookingWorkspaceApi.get = async () => { if (params.has('workspaceError') && window.bookingTest.fail !== 'recovered') throw new Error('Could not load notes'); return structuredClone(workspace); };
bookingWorkspaceApi.createNote = async (_id, body, requestId, pinned = false) => workspaceResult('createNote', [body, requestId, pinned], () => {
  const now = new Date().toISOString();
  if (!workspace.notes.some(row => row.id === requestId)) workspace.notes.push({ id: requestId, body, pinned, revision: 1, createdAt: now, updatedAt: now, createdBy: workspaceActor, updatedBy: workspaceActor, history: [] });
});
bookingWorkspaceApi.updateNote = async (_id, id, data) => workspaceResult('updateNote', [id, data], () => {
  const note = workspace.notes.find(row => row.id === id)!;
  note.history.push({ at: new Date().toISOString(), action: data.body ? 'edited' : data.pinned ? 'pinned' : 'unpinned', actor: workspaceActor });
  Object.assign(note, data, { revision: note.revision + 1 });
});
bookingWorkspaceApi.createFollowUp = async (_id, data) => workspaceResult('createFollowUp', [data], () => {
  const now = new Date().toISOString();
  if (!workspace.followUps.some(row => row.id === data.requestId)) workspace.followUps.push({ ...data, id: data.requestId, assigneeName: data.assigneeId ? 'Vignesh' : '', status: 'pending', outcome: '', revision: 1, createdAt: now, updatedAt: now, createdBy: workspaceActor, updatedBy: workspaceActor, history: [] });
});
bookingWorkspaceApi.updateFollowUp = async (_id, id, data) => workspaceResult('updateFollowUp', [id, data], () => { Object.assign(workspace.followUps.find(row => row.id === id)!, data, { revision: data.revision + 1 }); });
bookingWorkspaceApi.finishFollowUp = async (_id, id, data) => workspaceResult('finishFollowUp', [id, data], () => { workspace.followUps.find(row => row.id === id)!.history.push({ at: new Date().toISOString(), actor: workspaceActor, action: data.status }); Object.assign(workspace.followUps.find(row => row.id === id)!, data, { revision: data.revision + 1, updatedAt: new Date().toISOString(), updatedBy: workspaceActor }); });
bookingWorkspaceApi.reopenFollowUp = async (_id, id, data) => workspaceResult('reopenFollowUp', [id, data], () => {
  const task = workspace.followUps.find(row => row.id === id)!;
  task.history.push({ at: new Date().toISOString(), actor: workspaceActor, action: 'reopened', previous: { status: task.status, outcome: task.outcome } });
  Object.assign(task, data, { status: 'pending', outcome: '', revision: task.revision + 1 });
});
export function Harness() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  if (params.has('shell')) return <div className="admin-theme"><Routes><Route element={<RequireAuth />}><Route path="/admin/bookings/:id" element={<BookingDetailPage />} /></Route></Routes></div>;
  return (
    <div
      className="admin-theme"
      style={{ minHeight: "100vh", padding: "24px 12px" }}
    >
      <nav aria-label="Test navigation">
        <button onClick={() => navigate("/admin/bookings/two?tab=activity")}>
          Next booking
        </button>
        <button onClick={() => navigate(-1)}>History back</button>
      </nav>
      {isAuthenticated && (
        <Routes>
          <Route path="/admin/bookings/:id" element={<BookingDetailPage />} />
        </Routes>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <MemoryRouter
    initialEntries={[
      `/admin/bookings/one?tab=${params.get("tab") || "overview"}`,
    ]}
  >
    <AuthProvider>
      <ConfirmDialogProvider>
        <Harness />
      </ConfirmDialogProvider>
    </AuthProvider>
  </MemoryRouter>,
);

bookingWorkspaceApi.deleteNote = async (_id, id, revision) => workspaceResult('deleteNote', [id, revision], () => {
  workspace.notes = workspace.notes.filter(note => note.id !== id);
  workspace.followUps.forEach(task => { if (task.sourceNoteId === id) { delete task.sourceNoteId; task.revision += 1; } });
});
bookingWorkspaceApi.deleteFollowUp = async (_id, id, revision) => workspaceResult('deleteFollowUp', [id, revision], () => {
  workspace.followUps = workspace.followUps.filter(task => task.id !== id);
});
