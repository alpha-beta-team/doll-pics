import { formatCustomerName } from "../../shared/formatCustomerName";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { deliveryDeadlineLabel } from "../components/deliveryQueue.utils";
import { RefreshCw, Truck } from "lucide-react";
import type {
  DeliveryQueue,
  DeliveryQueueFilter,
  DeliveryQueueItem,
} from "../../shared/customerBooking";
import type { Booking } from "../types";
import { request } from "../api/http";
import { api } from "../api/client";
import { CustomerBookingPanel } from "../components/CustomerBookingPanel";
import { BookingDialog } from "../components/bookings/BookingDetailSections";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  AdminAlert,
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
} from "../components/ui";

const filters: Array<{ id: DeliveryQueueFilter; label: string }> = [
  { id: "awaiting", label: "Awaiting delivery" },
  { id: "week", label: "Due this week" },
  { id: "overdue", label: "Overdue" },
  { id: "delivered", label: "Delivered" },
];

function dayLabel(date: string) {
  return date
    ? new Date(`${date}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "Not set";
}

export function DeliveryQueuePage() {
  const [params, setParams] = useSearchParams();
  const filter = filters.some((item) => item.id === params.get("filter"))
    ? (params.get("filter") as DeliveryQueueFilter)
    : "awaiting";
  const rawPage = Number(params.get("page") || 1);
  const page =
    Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 100000
      ? rawPage
      : 1;
  const [queue, setQueue] = useState<DeliveryQueue | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [notice, setNotice] = useState("");
  const sequence = useRef(0);
  const confirm = useConfirmDialog();
  const load = useCallback(
    async (signal?: AbortSignal) => {
      const current = ++sequence.current;
      setBusy(true);
      setError("");
      try {
        const result = await request<DeliveryQueue>(
          `/admin/delivery-queue?${new URLSearchParams({ filter, page: String(page) })}`,
          { auth: true, signal, cache: "no-store", timeoutMs: 15000 },
        );
        if (!signal?.aborted && current === sequence.current) setQueue(result);
      } catch (cause) {
        if (!signal?.aborted && current === sequence.current) {
          setQueue(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load the delivery queue",
          );
        }
      } finally {
        if (!signal?.aborted && current === sequence.current) setBusy(false);
      }
    },
    [filter, page],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const navigate = (nextFilter: DeliveryQueueFilter, nextPage = 1) =>
    setParams({ filter: nextFilter, page: String(nextPage) });
  const open = async (item: DeliveryQueueItem) => {
    setActionId(item.id);
    setError("");
    try {
      setSelected(await api.getBooking(item.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not open booking",
      );
    } finally {
      setActionId("");
    }
  };
  const deliver = async (item: DeliveryQueueItem) => {
    if (
      !(await confirm({
        title: "Mark booking delivered?",
        description:
          "Confirm that the photographs were delivered to the customer. You can publish selected links afterward; marking delivered does not publish them.",
        confirmLabel: "Mark delivered",
      }))
    )
      return;
    setActionId(item.id);
    setError("");
    try {
      const booking = await api.completeBookingDelivery(item.id);
      setNotice(
        `${formatCustomerName(item.customerName)}: marked delivered. Publish selected links below when ready.`,
      );
      setSelected(booking);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not mark delivered",
      );
    } finally {
      setActionId("");
    }
  };
  const current =
    queue?.filter === filter && queue.page === page ? queue : null;
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AdminPageHeader
        eyebrow="Owner workspace"
        title="Delivery queue"
        description="Assign editors, track promised dates, and keep customers updated."
        actions={
          <AdminButton disabled={busy} onClick={() => void load()}>
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </AdminButton>
        }
      />
      <div
        role="group"
        aria-label="Delivery filters"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => navigate(item.id)}
            aria-label={`${item.label} (${queue?.counts[item.id] ?? "loading"})`}
            aria-pressed={filter === item.id}
            className={`min-h-12 rounded-xl border px-3 py-3 text-left text-sm font-semibold ${filter === item.id ? "border-admin-primary bg-admin-primary text-white" : "border-admin-border bg-admin-surface text-admin-text"}`}
          >
            {item.label}
            <span className="ml-2 tabular-nums">
              {queue?.counts[item.id] ?? "—"}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs leading-5 text-admin-subtle">
        Awaiting delivery includes completed shoots only. Overdue means before
        today in India. This week runs Monday–Sunday
        {queue
          ? ` (${dayLabel(queue.weekStart)}–${dayLabel(queue.weekEnd)})`
          : ""}
        . Bookings without a delivery date remain in Awaiting delivery.
      </p>
      {error && (
        <AdminAlert>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="ml-3 min-h-11 font-semibold underline"
          >
            Try again
          </button>
        </AdminAlert>
      )}
      {notice && (
        <AdminAlert tone="success" as="span">
          {notice}
        </AdminAlert>
      )}
      {busy && (
        <p role="status" className="py-4 text-sm text-admin-subtle">
          Loading current deliveries…
        </p>
      )}
      {!busy && current && (
        <>
          <p className="text-sm text-admin-subtle">
            {current.total} booking{current.total === 1 ? "" : "s"}
          </p>
          {current.items.length ? (
            <div className="space-y-3">
              {current.items.map((item) => {
                const overdue =
                  item.status !== "delivered" &&
                  item.expectedDeliveryDate &&
                  item.expectedDeliveryDate < current.today;
                return (
                  <AdminCard
                    key={item.id}
                    aria-label={`Delivery for ${formatCustomerName(item.customerName)}`}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/bookings/${item.id}?tab=customer`}
                          className="break-words font-semibold text-admin-text underline-offset-4 hover:underline"
                        >
                          {formatCustomerName(item.customerName)}
                        </Link>
                        <p className="mt-1 break-words text-sm text-admin-secondary">
                          {item.shootType ||
                            item.packageName ||
                            "Photography session"}
                        </p>
                        <p className="mt-1 text-xs text-admin-subtle">
                          Shoot: {dayLabel(item.bookingDate)}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p
                          className={`text-sm font-semibold ${overdue ? "text-red-700" : "text-admin-text"}`}
                        >
                          {deliveryDeadlineLabel(
                            item.expectedDeliveryDate,
                            current.today,
                            item.status === "delivered",
                          )}
                        </p>
                        <p className="mt-1 text-xs text-admin-subtle">
                          Expected: {dayLabel(item.expectedDeliveryDate)}
                        </p>
                        <p className="mt-1 text-xs text-admin-secondary">
                          Editor: {item.editorName || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <AdminButton
                        disabled={Boolean(actionId)}
                        onClick={() => void open(item)}
                      >
                        {actionId === item.id ? "Opening…" : "Update / publish"}
                      </AdminButton>
                      <Link
                        to={`/admin/bookings/${item.id}?tab=delivery`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-admin-control px-3 text-sm font-semibold text-admin-text"
                      >
                        Delivery links
                      </Link>
                      {item.status === "shoot_completed" && (
                        <button
                          type="button"
                          disabled={!item.hasDeliveryLink || Boolean(actionId)}
                          onClick={() => void deliver(item)}
                          className="min-h-11 rounded-lg border border-admin-control px-3 text-sm font-semibold text-admin-text disabled:opacity-50"
                        >
                          Mark delivered
                        </button>
                      )}
                      <span className="text-xs text-admin-subtle">
                        {item.status === "delivered"
                          ? item.publishedAt
                            ? "Delivery links published"
                            : "Delivery links not published"
                          : item.hasDeliveryLink
                            ? "Links saved · awaiting delivery"
                            : "Add delivery links before marking delivered"}
                      </span>
                    </div>
                  </AdminCard>
                );
              })}
            </div>
          ) : (
            <AdminCard>
              <AdminEmptyState
                icon={Truck}
                title="No bookings in this view"
                description="Choose another filter, or set delivery dates on completed bookings."
              />
            </AdminCard>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => navigate(filter, page - 1)}
              className="min-h-11 rounded-lg border border-admin-control px-4 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-admin-subtle">
              Page {page} of{" "}
              {Math.max(1, Math.ceil(current.total / current.pageSize))}
            </span>
            <button
              type="button"
              disabled={page * current.pageSize >= current.total}
              onClick={() => navigate(filter, page + 1)}
              className="min-h-11 rounded-lg border border-admin-control px-4 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
      {selected && (
        <BookingDialog
          title={`Delivery · ${formatCustomerName(selected.customerName)}`}
          onClose={() => setSelected(null)}
        >
          <CustomerBookingPanel
            booking={selected}
            onUpdated={() => {
              setNotice("Delivery details updated.");
              void load();
            }}
          />
        </BookingDialog>
      )}
    </div>
  );
}
