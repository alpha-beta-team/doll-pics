export type OwnerQueue = 'collections' | 'enquiries' | 'confirmations' | 'converted' | 'outstanding' | 'overdue' | 'dueSoon' | 'overpaid' | 'unpriced' | 'missingDueDates' | 'photos' | 'editing' | 'handover' | 'shipped' | 'setup' | 'deadlines' | 'followUpsToday' | 'followUpsOverdue';
export type OwnerQueueRow = { id: string; entity: 'booking' | 'enquiry'; customerName: string; customerPhone?: string; shootType?: string; bookingDate?: string; paymentDueDate?: string; balanceDue?: number; daysOverdue?: number; dueAt?: string; title?: string; taskId?: string };
export type OwnerQueuePage = { total: number; page: number; pageSize: number; rows: OwnerQueueRow[] };
export type OwnerDashboard = {
  totals: Record<string, { count: number; amount: number }>;
  today: number; overdue: number; draftOutstanding: number;
  ageing: Array<{ label: string; count: number; amount: number }>;
  paymentMethods: Array<{ method: string; amount: number }>;
  previous: { paymentsReceived: number; bookedRevenue: number; shootValue: number; salarySpend: number; netCashAfterSalary: number; confirmations: number; enquiries: number; conversionRate: number; paymentTrend: Array<{ period: string; amount: number; payments: number }> };
  overduePayments: OwnerQueuePage; dueSoon: OwnerQueuePage; unpriced: OwnerQueuePage;
};
