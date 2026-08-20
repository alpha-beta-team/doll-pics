import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useFeatureAccess } from "../access/useFeatureAccess";
import { api } from "../api/client";
import type {
  SalarySummary,
  SalaryPaymentMethod,
  SalaryTransaction,
  SalaryTransactionInput,
  SalaryType,
} from "../api/salary";
import {
  AdminAlert,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminFilterBar,
  AdminLoadingState,
  AdminModal,
  AdminPageHeader,
  AdminTableSurface,
  adminFieldClass,
} from "../components/ui";
import type { StaffAccountOption } from "../types";

type SalaryTab = "pay-enroll" | "dashboard";
type SalaryForm = Omit<SalaryTransactionInput, "amount"> & { amount: string };
const TYPES: Array<[SalaryType, string]> = [
  ["weekly", "Weekly"],
  ["monthly", "Monthly"],
  ["shoot", "Shoot-based"],
  ["advance", "Advance"],
  ["bonus", "Bonus"],
  ["other", "Other"],
];
const PAYMENT_METHODS: Array<[SalaryPaymentMethod, string]> = [
  ["cash", "Cash"],
  ["bank_transfer", "Bank Transfer"],
  ["upi", "UPI"],
  ["cheque", "Cheque"],
  ["other", "Other"],
];
const currentYear = new Date().getFullYear();
const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
const today = () => new Date().toLocaleDateString("en-CA");

export function SalaryManagementPage() {
  const { canManage, isReadOnly } = useFeatureAccess("salary_management");
  const [params, setParams] = useSearchParams();
  const tab: SalaryTab =
    params.get("tab") === "dashboard" ? "dashboard" : "pay-enroll";
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to, setTo] = useState(`${currentYear}-12-31`);
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState<StaffAccountOption[]>([]);
  const [rows, setRows] = useState<SalaryTransaction[]>([]);
  const [summary, setSummary] = useState<SalarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<SalaryForm>({
    staffAccountId: "",
    amount: "",
    transactionDate: today(),
    periodMonth: today().slice(0, 7),
    type: "monthly" as SalaryType,
    paymentMethod: "cash" as SalaryPaymentMethod,
    note: "",
  });
  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const [accounts, report, totals] = await Promise.all([
          api.getAssignableStaffAccounts(),
          api.salaryTransactions(from, to, staffId || undefined),
          api.salarySummary(from, to, staffId || undefined),
        ]);
        setStaff(accounts);
        setRows(report.transactions);
        setSummary(totals);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load salary records.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [from, to, staffId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  const selectedName = useMemo(
    () => staff.find((item) => item.id === staffId)?.name,
    [staff, staffId],
  );
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.createSalaryTransaction({
        ...form,
        amount: Number(form.amount),
        periodMonth: form.periodMonth || undefined,
      });
      setForm((current) => ({
        ...current,
        staffAccountId: "",
        amount: "",
        note: "",
      }));
      setNotice("Salary payment recorded successfully.");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record salary.");
    }
  };
  const setTab = (next: SalaryTab) =>
    setParams(
      (current) => {
        current.set("tab", next);
        return current;
      },
      { replace: true },
    );
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6 overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Staff Management"
        title="Salary Management"
        description="Record every payment with a clear audit trail, then understand payroll spend across your studio."
        actions={
          <AdminButton
            variant="secondary"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </AdminButton>
        }
      />
      {error && <AdminAlert>{error}</AdminAlert>}
      {notice && <AdminAlert tone="success">{notice}</AdminAlert>}
      <div
        className="border-b border-admin-border"
        role="tablist"
        aria-label="Salary management views"
      >
        <div className="flex gap-1">
          <TabButton
            active={tab === "pay-enroll"}
            onClick={() => setTab("pay-enroll")}
            icon={Plus}
            title="Pay Enroll"
            description="Enter and review payments"
          />
          <TabButton
            active={tab === "dashboard"}
            onClick={() => setTab("dashboard")}
            icon={BarChart3}
            title="Dashboard"
            description="Analyze payroll spend"
          />
        </div>
      </div>
      {tab === "dashboard" ? (
        <AdminFilterBar>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.4fr] md:items-end">
            <AdminField label="From">
              <input
                type="date"
                className={adminFieldClass}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </AdminField>
            <AdminField label="To">
              <input
                type="date"
                className={adminFieldClass}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </AdminField>
            <AdminField label="Employee filter">
              <select
                className={adminFieldClass}
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">All employees</option>
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </AdminField>
          </div>
        </AdminFilterBar>
      ) : null}
      {loading ? (
        <AdminCard>
          <AdminLoadingState label="Loading salary workspace…" />
        </AdminCard>
      ) : tab === "pay-enroll" ? (
        <PayEnroll
          canManage={canManage}
          isReadOnly={isReadOnly}
          staff={staff}
          rows={rows}
          form={form}
          setForm={setForm}
          saving={false}
          onSave={save}
          onUpdated={() => load(true)}
        />
      ) : (
        <SalaryDashboard summary={summary} selectedName={selectedName} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Plus;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative inline-flex min-h-14 items-center gap-2.5 px-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus sm:px-5 ${active ? "text-admin-primary" : "text-admin-subtle hover:text-admin-text"}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="text-sm font-semibold">{title}</span>
        <span className="mt-1 text-xs font-normal text-admin-subtle">
          {description}
        </span>
      </span>
      {active && (
        <span className="absolute inset-x-2 bottom-[-1px] h-0.5 rounded-full bg-admin-primary" />
      )}
    </button>
  );
}

function PayEnroll({
  canManage,
  isReadOnly,
  staff,
  rows,
  form,
  setForm,
  saving,
  onSave,
  onUpdated,
}: {
  canManage: boolean;
  isReadOnly: boolean;
  staff: StaffAccountOption[];
  rows: SalaryTransaction[];
  form: SalaryForm;
  setForm: React.Dispatch<React.SetStateAction<SalaryForm>>;
  saving: boolean;
  onSave: (event: React.FormEvent) => void;
  onUpdated: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState<SalaryTransaction | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const openEdit = (transaction: SalaryTransaction) => {
    setEditError("");
    setEditing(transaction);
  };

  const saveEdit = async (data: SalaryTransactionInput) => {
    if (!editing) return;
    setSavingEdit(true);
    setEditError("");
    try {
      await api.updateSalaryTransaction(editing.id, data);
      setEditing(null);
      await onUpdated();
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : "Could not update salary transaction.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-5">
      {canManage ? (
        <AdminCard className="overflow-hidden">
          <div className="border-b border-admin-border bg-gradient-to-r from-admin-primary/[0.06] to-transparent p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-primary text-white">
                <Plus className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-admin-text">
                  Record a salary payment
                </h2>
                <p className="mt-1 text-sm text-admin-subtle">
                  Each weekly, monthly, advance, or shoot payment is stored as a
                  separate transaction.
                </p>
              </div>
            </div>
          </div>
          <form
            className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6"
            onSubmit={onSave}
          >
            <AdminField label="Employee">
              <select
                required
                className={adminFieldClass}
                value={form.staffAccountId}
                onChange={(e) =>
                  setForm({ ...form, staffAccountId: e.target.value })
                }
              >
                <option value="">Choose employee</option>
                {staff.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Amount (₹)">
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                className={adminFieldClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </AdminField>
            <AdminField label="Transaction date">
              <input
                required
                type="date"
                className={adminFieldClass}
                value={form.transactionDate}
                onChange={(e) =>
                  setForm({ ...form, transactionDate: e.target.value })
                }
              />
            </AdminField>
            <AdminField label="Payment type">
              <select
                className={adminFieldClass}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as SalaryType })
                }
              >
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Payment method">
              <select
                required
                className={adminFieldClass}
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({
                    ...form,
                    paymentMethod: e.target.value as SalaryPaymentMethod,
                  })
                }
              >
                {PAYMENT_METHODS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label="Payroll month"
              hint="For payroll grouping; defaults to transaction month."
            >
              <input
                type="month"
                className={adminFieldClass}
                value={form.periodMonth}
                onChange={(e) =>
                  setForm({ ...form, periodMonth: e.target.value })
                }
              />
            </AdminField>
            <AdminField
              label="Note"
              hint="Add shoot name, advance context, or payment reference."
            >
              <input
                maxLength={500}
                className={adminFieldClass}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </AdminField>
            <div className="flex items-end sm:col-span-2">
              <AdminButton type="submit" disabled={saving}>
                <CheckCircle2 className="h-4 w-4" />
                {saving ? "Saving…" : "Record payment"}
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      ) : (
        <AdminAlert tone="info">
          You have read-only salary access. You can review transactions and
          dashboard metrics, but only authorized managers can record payments.
        </AdminAlert>
      )}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-admin-text">
              Recent transactions
            </h2>
            <p className="mt-1 text-sm text-admin-subtle">
              {rows.length} transaction{rows.length === 1 ? "" : "s"} in the
              selected period{isReadOnly ? "" : " · append-only audit history"}.
            </p>
          </div>
          <AdminBadge>
            <ClipboardList className="mr-1 h-3.5 w-3.5" />
            Transaction ledger
          </AdminBadge>
        </div>
        {rows.length === 0 ? (
          <AdminEmptyState
            icon={WalletCards}
            title="No salary transactions"
            description="No payments match the selected period and employee filter."
          />
        ) : (
          <AdminTableSurface>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-admin-border bg-admin-muted/60 text-xs uppercase tracking-wide text-admin-subtle">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Payment method</th>
                    <th className="px-5 py-3">Payroll month</th>
                    <th className="px-5 py-3">Note</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    {canManage && (
                      <th className="px-5 py-3 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-admin-muted/40">
                      <td className="px-5 py-4 tabular-nums">
                        {row.transactionDate}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {row.staff?.name || "Unknown"}
                        <span className="ml-2 text-xs font-normal text-admin-subtle">
                          {row.staff?.employeeCode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <AdminBadge>
                          {TYPES.find(([value]) => value === row.type)?.[1] ||
                            row.type}
                        </AdminBadge>
                      </td>
                      <td className="px-5 py-4 capitalize text-admin-secondary">
                        {PAYMENT_METHODS.find(
                          ([value]) => value === (row.paymentMethod || "other"),
                        )?.[1] || "Other"}
                      </td>
                      <td className="px-5 py-4 text-admin-secondary">
                        {row.periodMonth}
                      </td>
                      <td className="max-w-[260px] truncate px-5 py-4 text-admin-secondary">
                        {row.note || "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums">
                        {money(row.amount)}
                      </td>
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-admin-primary transition hover:bg-admin-primary/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus"
                            aria-label={`Edit salary transaction for ${row.staff?.name || "employee"}`}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTableSurface>
        )}
      </section>
      {editing && (
        <SalaryTransactionEditDialog
          transaction={editing}
          staff={staff}
          saving={savingEdit}
          error={editError}
          onClose={() => {
            if (!savingEdit) setEditing(null);
          }}
          onSave={saveEdit}
        />
      )}
    </div>
  );
}

function SalaryTransactionEditDialog({
  transaction,
  staff,
  saving,
  error,
  onClose,
  onSave,
}: {
  transaction: SalaryTransaction;
  staff: StaffAccountOption[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (data: SalaryTransactionInput) => void | Promise<void>;
}) {
  const [form, setForm] = useState<SalaryForm>({
    staffAccountId: transaction.staffAccountId,
    amount: String(transaction.amount),
    transactionDate: transaction.transactionDate,
    periodMonth: transaction.periodMonth,
    type: transaction.type,
    paymentMethod: transaction.paymentMethod || "other",
    note: transaction.note,
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSave({
      ...form,
      amount: Number(form.amount),
      periodMonth: form.periodMonth || undefined,
    });
  };

  return (
    <AdminModal
      open
      title="Edit salary transaction"
      description="Update the payment details while preserving the original transaction record."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <AdminButton variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </AdminButton>
          <AdminButton
            type="submit"
            form="salary-transaction-edit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </AdminButton>
        </div>
      }
    >
      <form
        id="salary-transaction-edit"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => void submit(event)}
      >
        {error && <AdminAlert>{error}</AdminAlert>}
        <AdminField label="Employee">
          <select
            required
            className={adminFieldClass}
            value={form.staffAccountId}
            onChange={(event) =>
              setForm({ ...form, staffAccountId: event.target.value })
            }
          >
            <option value="">Choose employee</option>
            {staff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Amount (₹)">
          <input
            required
            min="0.01"
            step="0.01"
            type="number"
            className={adminFieldClass}
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
          />
        </AdminField>
        <AdminField label="Transaction date">
          <input
            required
            type="date"
            className={adminFieldClass}
            value={form.transactionDate}
            onChange={(event) =>
              setForm({ ...form, transactionDate: event.target.value })
            }
          />
        </AdminField>
        <AdminField label="Payment type">
          <select
            className={adminFieldClass}
            value={form.type}
            onChange={(event) =>
              setForm({ ...form, type: event.target.value as SalaryType })
            }
          >
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField label="Payment method">
          <select
            required
            className={adminFieldClass}
            value={form.paymentMethod}
            onChange={(event) =>
              setForm({
                ...form,
                paymentMethod: event.target.value as SalaryPaymentMethod,
              })
            }
          >
            {PAYMENT_METHODS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </AdminField>
        <AdminField
          label="Payroll month"
          hint="For payroll grouping; defaults to transaction month."
        >
          <input
            type="month"
            className={adminFieldClass}
            value={form.periodMonth}
            onChange={(event) =>
              setForm({ ...form, periodMonth: event.target.value })
            }
          />
        </AdminField>
        <AdminField
          label="Note"
          hint="Add shoot name, advance context, or payment reference."
        >
          <input
            maxLength={500}
            className={adminFieldClass}
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
          />
        </AdminField>
      </form>
    </AdminModal>
  );
}

function SalaryDashboard({
  summary,
  selectedName,
}: {
  summary: SalarySummary | null;
  selectedName?: string;
}) {
  if (!summary)
    return (
      <AdminEmptyState
        icon={BarChart3}
        title="Salary dashboard unavailable"
        description="Choose a valid reporting period to calculate payroll metrics."
      />
    );
  const maxMonth = Math.max(
    ...summary.monthlyTrend.map((item) => item.total),
    1,
  );
  const maxType = Math.max(...summary.byType.map((item) => item.total), 1);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={selectedName ? `${selectedName} spend` : "Total salary spend"}
          value={money(summary.total)}
          detail={`${summary.from} – ${summary.to}`}
          icon={Banknote}
          tone="violet"
        />
        <MetricCard
          label="Employees paid"
          value={String(summary.employeeCount)}
          detail="Unique employees with entries"
          icon={UsersRound}
          tone="blue"
        />
        <MetricCard
          label="Transactions"
          value={String(summary.transactionCount)}
          detail={`Avg ${money(summary.averageTransaction)} per payment`}
          icon={ClipboardList}
          tone="amber"
        />
        <MetricCard
          label="Payroll months"
          value={String(summary.monthlyTrend.length)}
          detail="Months with recorded spend"
          icon={CalendarDays}
          tone="emerald"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <AdminCard className="overflow-hidden">
          <PanelHeading
            title="Monthly salary trend"
            description="Recorded salary spend by transaction month."
          />
          {summary.monthlyTrend.length ? (
            <div className="space-y-4 p-5 sm:p-6">
              {summary.monthlyTrend.map((item) => (
                <div key={item.month}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span className="font-medium text-admin-secondary">
                      {item.month}
                    </span>
                    <span className="font-semibold text-admin-text">
                      {money(item.total)}{" "}
                      <span className="font-normal text-admin-subtle">
                        · {item.transactionCount}
                      </span>
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-admin-muted">
                    <div
                      className="h-full rounded-full bg-admin-primary transition-all"
                      style={{ width: `${(item.total / maxMonth) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No monthly salary trend"
              description="Salary entries will appear here once recorded."
            />
          )}
        </AdminCard>
        <AdminCard className="overflow-hidden">
          <PanelHeading
            title="Payment mix"
            description="Spend grouped by payment type."
          />
          {summary.byType.length ? (
            <div className="space-y-4 p-5 sm:p-6">
              {summary.byType.map((item) => (
                <div key={item.type}>
                  <div className="mb-1.5 flex justify-between gap-3 text-sm">
                    <span className="font-medium capitalize text-admin-secondary">
                      {item.type}
                    </span>
                    <span className="font-semibold text-admin-text">
                      {money(item.total)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-admin-muted">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(item.total / maxType) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-admin-subtle">
                    {item.transactionCount} transaction
                    {item.transactionCount === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState
              title="No payment mix"
              description="Payment types will be grouped here."
            />
          )}
        </AdminCard>
      </div>
      <AdminCard className="overflow-hidden">
        <PanelHeading
          title="Spend by employee"
          description={
            selectedName
              ? `Filtered to ${selectedName}.`
              : "Highest recorded spend in the selected period."
          }
        />
        {summary.byEmployee.length ? (
          <div className="space-y-4 p-5 sm:p-6">
            {summary.byEmployee.slice(0, 10).map((item) => (
              <div key={item.staff.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-admin-text">
                      {item.staff.name}
                    </p>
                    <p className="text-xs text-admin-subtle">
                      {item.staff.employeeCode || "Employee"} ·{" "}
                      {item.transactionCount} payment
                      {item.transactionCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums text-admin-text">
                    {money(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="No employee spend"
            description="Select a wider period or record a salary transaction."
          />
        )}
      </AdminCard>
      <div className="flex items-center gap-2 text-xs text-admin-subtle">
        <WalletCards className="h-4 w-4" />
        Dashboard totals use transaction date. Payroll month remains available
        in Pay Enroll for payroll context.
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Banknote;
  tone: "violet" | "blue" | "amber" | "emerald";
}) {
  const colors = {
    violet: "bg-violet-50 text-violet-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-admin-subtle">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-admin-text">
            {value}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-admin-subtle">{detail}</p>
    </AdminCard>
  );
}
function PanelHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-admin-border p-5 sm:p-6">
      <h2 className="font-semibold text-admin-text">{title}</h2>
      <p className="mt-1 text-sm text-admin-subtle">{description}</p>
    </div>
  );
}
