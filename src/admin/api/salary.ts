import { request } from "./http";

export type SalaryType =
  "weekly" | "monthly" | "shoot" | "advance" | "bonus" | "other";
export type SalaryPaymentMethod =
  "cash" | "bank_transfer" | "upi" | "cheque" | "other";
export type SalaryTransaction = {
  id: string;
  staffAccountId: string;
  staff?: { id: string; name: string; employeeCode: string };
  amount: number;
  transactionDate: string;
  periodMonth: string;
  type: SalaryType;
  paymentMethod: SalaryPaymentMethod;
  bookingId?: string;
  note: string;
  createdAt?: string;
};
export type SalarySummary = {
  from: string;
  to: string;
  total: number;
  transactionCount: number;
  employeeCount: number;
  averageTransaction: number;
  byEmployee: Array<{
    staff: { id: string; name: string; employeeCode: string };
    total: number;
    transactionCount: number;
  }>;
  byType: Array<{ type: SalaryType; total: number; transactionCount: number }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    transactionCount: number;
  }>;
};
export type SalaryTransactionInput = {
  staffAccountId: string;
  amount: number;
  transactionDate: string;
  periodMonth?: string;
  type: SalaryType;
  paymentMethod: SalaryPaymentMethod;
  note?: string;
};
const query = (from: string, to: string, staffAccountId?: string) =>
  `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${staffAccountId ? `&staffAccountId=${encodeURIComponent(staffAccountId)}` : ""}`;
export const salaryApi = {
  salaryTransactions: (from: string, to: string, staffAccountId?: string) =>
    request<{ from: string; to: string; transactions: SalaryTransaction[] }>(
      `/admin/salary/transactions${query(from, to, staffAccountId)}`,
      { auth: true },
    ),
  salarySummary: (from: string, to: string, staffAccountId?: string) =>
    request<SalarySummary>(
      `/admin/salary/summary${query(from, to, staffAccountId)}`,
      { auth: true },
    ),
  createSalaryTransaction: (data: SalaryTransactionInput) =>
    request<SalaryTransaction>("/admin/salary/transactions", {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    }),
  updateSalaryTransaction: (id: string, data: SalaryTransactionInput) =>
    request<SalaryTransaction>(`/admin/salary/transactions/${id}`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    }),
};
