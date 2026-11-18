import {
  nextOrderStages,
  type OrderInput,
  type OrderSnapshot,
  type OrderStage,
  orderActionLabel,
} from "../../shared/orderWorkflow";
export interface TrackingRow {
  id: string;
  customerName: string;
  customerPhone: string;
  customerCode: string;
  reference: string;
  bookingDate: string;
  shootType?: string;
  status: string;
  order: (OrderSnapshot & { revision: number }) | null;
}
export const queues = {
  photos: {
    label: "Photos to share",
    tone: "bg-sky-50 text-sky-700",
    action: "Share photos",
  },
  selection: {
    label: "Awaiting customer selection",
    tone: "bg-amber-50 text-amber-800",
    action: "Confirm selection",
  },
  editing: {
    label: "Editing pending",
    tone: "bg-violet-50 text-violet-700",
    action: "Share edited photos",
  },
  edited: {
    label: "Edited photos to share",
    tone: "bg-sky-50 text-sky-700",
    action: "Share edited photos",
  },
  print_selection: {
    label: "Awaiting print selection",
    tone: "bg-amber-50 text-amber-800",
    action: "Confirm print selection",
  },
  print: {
    label: "Ready for printing",
    tone: "bg-indigo-50 text-indigo-700",
    action: "Send for printing",
  },
  prints: {
    label: "Awaiting prints",
    tone: "bg-amber-50 text-amber-800",
    action: "Mark received",
  },
  handover: {
    label: "Ready for handover",
    tone: "bg-teal-50 text-teal-700",
    action: "Record handover",
  },
  receipt: {
    label: "Awaiting delivery confirmation",
    tone: "bg-teal-50 text-teal-700",
    action: "Confirm delivery",
  },
  delivered: {
    label: "Delivered",
    tone: "bg-emerald-50 text-emerald-700",
    action: "View tracking",
  },
  setup: {
    label: "Tracking setup required",
    tone: "bg-slate-100 text-slate-700",
    action: "Start tracking",
  },
  cancelled: {
    label: "Cancelled",
    tone: "bg-slate-100 text-slate-700",
    action: "View tracking",
  },
} as const;
export type Queue = keyof typeof queues;
export function queueFor(row: TrackingRow): Queue {
  const order = row.order;
  if (!order) return "setup";
  if (order.state === "cancelled") return "cancelled";
  if (order.state === "completed") return "delivered";
  return (
    {
      shoot_completed: "photos",
      awaiting_selection: "selection",
      editing: "editing",
      photos_delivered: "print_selection",
      preparing_print: "print_selection",
      edited_selected: "print",
      printing: "prints",
      in_transit: "prints",
      received: "handover",
      ready_dispatch: "handover",
      handed_over: "receipt",
      shipped: "receipt",
      delivered: "receipt",
      collected: "receipt",
    } as const
  )[order.stage];
}
export interface TrackingAction { label: string; stage?: OrderStage }
const trackingActionLabels: Partial<Record<OrderStage, string>> = {
  awaiting_selection: 'Share photos',
  editing: 'Confirm selection',
  photos_delivered: 'Share edited photos',
  edited_selected: 'Confirm print selection',
  printing: 'Send for printing',
  received: 'Mark received',
  handed_over: 'Record handover',
  shipped: 'Send by courier',
  delivered: 'Confirm delivery',
};
export function trackingActions(row: TrackingRow): TrackingAction[] {
  if (row.status === 'cancelled') return [];
  if (!row.order) return [{ label: 'Start tracking' }];
  return nextOrderStages(row.order).map(stage => ({ stage, label: trackingActionLabels[stage] || orderActionLabel(stage) }));
}
export function isOverdue(row: TrackingRow, now = Date.now()) {
  return (
    row.order?.state === "active" &&
    row.order.stage === "editing" &&
    Boolean(row.order.editingDueAt && Date.parse(row.order.editingDueAt) < now)
  );
}
export interface TrackingFilters { search?: string; from?: string; to?: string; stage?: string; scope?: string }
export interface TrackingResult {
  rows: TrackingRow[];
  counts: { all: number; stages: Partial<Record<Queue, number>>; stage: number; overdue: number };
}
export const bulkActions = {
  assign: "Assign responsible staff",
  editing: "Confirm customer selection / Start editing",
  edited_selected: "Confirm edited photo selection",
  printing: "Send for printing",
  received: "Mark prints received",
  handed_over: "Record customer handover",
  delivered: "Confirm delivery",
} as const;
export type BulkAction = keyof typeof bulkActions;
export function exclusion(row: TrackingRow, action: BulkAction): string {
  if (!row.order)
    return "Initialize tracking individually with the actual stage and order type.";
  if (row.status === "cancelled" || row.order.state === "cancelled")
    return "Order is cancelled.";
  if (action === "assign") return "";
  if (row.order.state !== "active")
    return "Order is already complete. Reopen individually with a reason.";
  if (!nextOrderStages(row.order).includes(action))
    return `This action is not the next step for this order (${queues[queueFor(row)].label}).`;
  return "";
}
export function bulkInput(
  row: TrackingRow,
  action: BulkAction,
  requestId: string,
  fields: { assigneeId: string; date: string; note: string },
): OrderInput {
  return {
    requestId,
    revision: row.order!.revision,
    action: action === "assign" ? "details" : "advance",
    ...(action === "assign"
      ? { assigneeId: fields.assigneeId }
      : { stage: action }),
    ...(action !== "assign" && fields.date
      ? { occurredAt: new Date(`${fields.date}:00+05:30`).toISOString() }
      : {}),
    ...(fields.note ? { note: fields.note } : {}),
  };
}
