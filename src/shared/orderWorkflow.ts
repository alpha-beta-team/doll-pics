export const ORDER_STAGE_LABELS = {
  shoot_completed: 'Shoot completed',
  awaiting_selection: 'Shared for customer selection', editing: 'Customer photos selected', photos_delivered: 'Edited photos shared',
  edited_selected: 'Customer selected edited photos',
  preparing_print: 'Preparing for printing', printing: 'Shared for printing', in_transit: 'In transit to studio',
  received: 'Printing received', ready_dispatch: 'Ready for customer dispatch', shipped: 'Couriered to customer',
  handed_over: 'Handed over to customer', delivered: 'Delivered', collected: 'Collected',
} as const;
export type OrderStage = keyof typeof ORDER_STAGE_LABELS;
// Normal workflow choices; legacy stages remain readable in saved orders/history.
export const ORDER_STAGES: OrderStage[] = ['shoot_completed', 'awaiting_selection', 'editing', 'photos_delivered', 'edited_selected', 'printing', 'received', 'handed_over', 'shipped', 'delivered'];
export type OrderMilestone = OrderStage | 'shoot_completed' | 'selection_completed' | 'printing_completed';
export const milestoneLabel = (stage: string) => ({ ...ORDER_STAGE_LABELS, shoot_completed: 'Shoot completed', selection_completed: 'Customer selection completed', printing_completed: 'Printing completed' }[stage] || stage);
export const orderDate = (value?: string) => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Not recorded';
export const orderLocalInput = (value: string) => new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 16);
export interface OrderDetails { printerTrackingUrl?: string; customerTrackingUrl?: string; expectedPrintAt?: string; expectedStudioAt?: string; expectedDispatchAt?: string; expectedDeliveryAt?: string; printingCompletedAt?: string; printingHouse?: string; printingReference?: string; printerCourier?: string; printerTracking?: string; customerCourier?: string; customerTracking?: string; nextAction?: string; blocker?: string }
export interface OrderSnapshot {
  stage: OrderStage; mode: 'digital' | 'physical'; state: 'active' | 'completed' | 'cancelled'; enteredAt: string;
  editingDueAt?: string; dates: Partial<Record<OrderMilestone, string>>;
  assigneeId: string; assigneeName: string; details: OrderDetails;
}
export interface OrderWorkflow extends OrderSnapshot {
  revision: number;
  history: Array<{ id: string; action: string; recordedAt: string; occurredAt: string; actor: { id: string; name: string }; reason: string; note: string; previous?: OrderSnapshot; next: OrderSnapshot }>;
}
export interface OrderInput {
  requestId: string; revision: number; action: 'initialize' | 'advance' | 'correct' | 'reopen' | 'details';
  stage?: OrderStage; mode?: 'digital' | 'physical'; occurredAt?: string; milestone?: OrderMilestone;
  reason?: string; note?: string; assigneeId?: string; details?: OrderDetails;
}
export interface CustomerOrderProgress { stage: OrderStage; state: OrderSnapshot['state']; milestones: Array<{ stage: string; at: string }> }
export function nextOrderStages(order: OrderSnapshot): OrderStage[] {
  if (order.state !== 'active') return [];
  if (order.mode === 'digital' && order.stage === 'photos_delivered') return [];
  const next: Partial<Record<OrderStage, OrderStage[]>> = {
    shoot_completed: ['awaiting_selection'], awaiting_selection: ['editing'], editing: ['photos_delivered'],
    photos_delivered: ['edited_selected'], edited_selected: ['printing'], preparing_print: ['edited_selected'],
    printing: ['received'], in_transit: ['received'], received: ['handed_over', 'shipped'],
    ready_dispatch: ['handed_over', 'shipped'], handed_over: ['delivered'], shipped: ['delivered'],
  };
  return next[order.stage] || [];
}
export const orderActionLabel = (stage: OrderStage) => ({
  awaiting_selection: 'Share for customer selection', editing: 'Customer photos selected',
  photos_delivered: 'Edited photos shared', edited_selected: 'Customer selected edited photos',
  printing: 'Share for printing', received: 'Printing received',
  handed_over: 'Hand over to customer', shipped: 'Courier to customer', delivered: 'Mark delivered',
  collected: 'Mark collected',
} as Partial<Record<OrderStage, string>>)[stage] || `Move to ${ORDER_STAGE_LABELS[stage]}`;

export function orderHeaderAction(order: OrderSnapshot | null): string {
  if (!order) return 'Start order tracking';
  if (order.state === 'cancelled') return 'Order cancelled';
  if (order.state === 'completed') return 'Reopen order';
  const next = nextOrderStages(order)[0];
  return next ? orderActionLabel(next) : ORDER_STAGE_LABELS[order.stage];
}
export function orderEventDateLabel(stage?: OrderMilestone): string {
  const labels: Record<OrderMilestone, string> = {
    shoot_completed: 'Shoot completed at', awaiting_selection: 'Selection photos shared at',
    selection_completed: 'Customer selection completed at', editing: 'Customer photos selected at',
    photos_delivered: 'Edited photos shared at', edited_selected: 'Customer selected edited photos at', preparing_print: 'Print preparation started at',
    printing: 'Submitted for printing at', printing_completed: 'Printing completed at',
    in_transit: 'Dispatched to studio at', received: 'Printing received at',
    ready_dispatch: 'Ready for customer dispatch at', shipped: 'Couriered to customer at', handed_over: 'Handed over to customer at',
    delivered: 'Delivered to customer at', collected: 'Collected by customer at',
  };
  return `${stage ? labels[stage] : 'Stage started at'} · India time`;
}
