import { useRef, useState } from "react";
import type { StaffAccountOption } from "../../types";
import { orderWorkflowApi } from "../../api/orderWorkflow";
import {
  bulkActions,
  bulkInput,
  exclusion,
  type BulkAction,
  type TrackingRow,
} from "../postShootTracking";
import type { OrderInput } from "../../../shared/orderWorkflow";
import { BookingDialog } from "./BookingDetailSections";
const field =
  "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600";
const button =
  "rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-violet-600 disabled:opacity-50";
type Result = {
  row: TrackingRow;
  input: OrderInput;
  status: "pending" | "success" | "failed";
  reason?: string;
};
export function BulkOrderUpdate({
  rows,
  staff,
  onClose,
  onUpdated,
}: {
  rows: TrackingRow[];
  staff: StaffAccountOption[];
  onClose: () => void;
  onUpdated: (ids: string[]) => Promise<void>;
}) {
  const [action, setAction] = useState<BulkAction>("assign");
  const [assigneeId, setAssignee] = useState(""),
    [date, setDate] = useState(""),
    [note, setNote] = useState("");
  const [review, setReview] = useState(false),
    [chosen, setChosen] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Result[]>([]),
    [busy, setBusy] = useState(false),
    [refreshError, setRefreshError] = useState("");
  const lock = useRef(false);
  const eligible = rows.filter((row) => !exclusion(row, action));
  const mixed = eligible.length !== rows.length;
  const run = async (items: Result[]) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setRefreshError("");
    const output = items.map((item) => ({ ...item }));
    try {
      for (const item of output) {
        if (item.status === "success") continue;
        item.status = "pending";
        setResults(output.map((result) => ({ ...result })));
        try {
          // The individual endpoint revalidates permissions, revision and transition atomically.
          // Retain the request identity and exact body on retry, including after an uncertain response.
          await orderWorkflowApi.update(item.row.id, item.input);
          item.status = "success";
          item.reason = undefined;
        } catch (error) {
          item.status = "failed";
          item.reason =
            error instanceof Error ? error.message : "Update failed";
        }
        setResults(output.map((result) => ({ ...result })));
      }
      try {
        await onUpdated(
          output
            .filter((item) => item.status === "success")
            .map((item) => item.row.id),
        );
      } catch {
        setRefreshError(
          "Updates recorded below. Refresh the list to load current rows and counts.",
        );
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const apply = () => {
    if (!review || lock.current || !chosen.size) return;
    const items = eligible
      .filter((row) => chosen.has(row.id))
      .map((row) => ({
        row,
        input: bulkInput(row, action, crypto.randomUUID(), {
          assigneeId,
          date,
          note,
        }),
        status: "pending" as const,
      }));
    if (items.length) {
      setResults(items);
      void run(items);
    }
  };
  return (
    <BookingDialog
      className="admin-theme post-shoot-tracking"
      title="Bulk update"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="space-y-4 text-slate-900">
        <p className="text-sm text-slate-600">
          {rows.length} selected orders · Updates are recorded individually in
          each order’s activity history.
        </p>
        {!results.length ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (review) apply();
              else {
                setReview(true);
                setChosen(
                  mixed ? new Set() : new Set(eligible.map((row) => row.id)),
                );
              }
            }}
          >
            <fieldset disabled={review} className="space-y-3">
              <label className="block text-sm font-medium">
                Action
                <select
                  aria-label="Action"
                  className={field}
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value as BulkAction)
                  }
                >
                  {Object.entries(bulkActions).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {action === "assign" ? (
                <label className="block text-sm font-medium">
                  Responsible staff
                  <select
                    required
                    className={field}
                    value={assigneeId}
                    onChange={(event) => setAssignee(event.target.value)}
                  >
                    <option value="">Choose staff</option>
                    {staff.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  {!staff.length && (
                    <span className="text-xs text-rose-700">
                      Staff unavailable. Close and refresh to retry.
                    </span>
                  )}
                </label>
              ) : (
                <label className="block text-sm font-medium">
                  Action date & time · IST
                  <input
                    type="datetime-local"
                    className={field}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                  <span className="text-xs font-normal text-slate-600">
                    When this happened. Leave blank to use save time.
                    {action === "editing" &&
                      " Starts the five-calendar-day editing deadline."}
                    {action === "handed_over" &&
                      " Handover keeps the order active until delivery is confirmed."}
                  </span>
                </label>
              )}
              <label className="block text-sm font-medium">
                Internal note (optional)
                <textarea
                  maxLength={1000}
                  className={field}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </fieldset>
            {review && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">
                  {eligible.length} eligible · {rows.length - eligible.length}{" "}
                  excluded
                </p>
                {mixed && (
                  <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                    Mixed stages: explicitly select the eligible orders you want
                    to update. Excluded orders will remain unchanged.
                  </p>
                )}
                <button
                  type="button"
                  className={button}
                  disabled={!eligible.length}
                  onClick={() =>
                    setChosen(new Set(eligible.map((row) => row.id)))
                  }
                >
                  Select all eligible orders
                </button>
                <ul className="max-h-56 divide-y divide-slate-200 overflow-y-auto rounded-md border border-slate-200">
                  {rows.map((row) => {
                    const reason = exclusion(row, action);
                    return (
                      <li key={row.id} className="p-2 text-sm">
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1 accent-violet-600"
                            disabled={Boolean(reason)}
                            checked={chosen.has(row.id)}
                            onChange={(event) =>
                              setChosen((current) => {
                                const next = new Set(current);
                                if (event.target.checked) next.add(row.id);
                                else next.delete(row.id);
                                return next;
                              })
                            }
                          />
                          <span>
                            {row.customerName}
                            <span className="block text-xs text-slate-600">
                              {row.reference}
                            </span>
                            <span
                              className={`block text-xs ${reason ? "text-rose-700" : "text-emerald-700"}`}
                            >
                              {reason || "Eligible"}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {review && (
                <button
                  type="button"
                  className={button}
                  onClick={() => setReview(false)}
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={review && !chosen.size}
                className="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50"
              >
                {review
                  ? `Apply to ${chosen.size} orders`
                  : "Review eligibility"}
              </button>
              <button type="button" className={button} onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm font-semibold">{bulkActions[action]}</p>
            <p role="status" className="text-sm">
              {busy
                ? `Processing ${results.filter((item) => item.status !== "pending").length} of ${results.length}…`
                : `${results.filter((item) => item.status === "success").length} successful · ${results.filter((item) => item.status === "failed").length} failed`}
            </p>
            <progress
              className="w-full accent-violet-600"
              max={results.length}
              value={results.filter((item) => item.status !== "pending").length}
            />
            <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto text-sm">
              {results.map((item) => (
                <li key={item.row.id} className="py-2">
                  <strong>{item.row.customerName}</strong>
                  <span className="block text-xs text-slate-600">
                    {item.row.reference}
                  </span>
                  <p
                    className={
                      item.status === "failed"
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }
                  >
                    {item.status === "success"
                      ? "Updated successfully"
                      : item.status === "pending"
                        ? "Waiting / processing"
                        : item.reason}
                  </p>
                </li>
              ))}
            </ul>
            {refreshError && (
              <p role="alert" className="text-sm text-rose-700">
                {refreshError}
              </p>
            )}
            <div className="flex gap-2">
              {results.some((item) => item.status === "failed") && (
                <button
                  className={button}
                  disabled={busy}
                  onClick={() => void run(results)}
                >
                  Retry failed updates
                </button>
              )}
              <button className={button} disabled={busy} onClick={onClose}>
                Done
              </button>
            </div>
            {!busy && results.some((item) => item.status === "failed") && (
              <p className="text-xs text-slate-600">
                Conflicts require a fresh review: close this form, refresh, and
                review the remaining selected orders. Successful updates are
                never repeated.
              </p>
            )}
          </>
        )}
      </div>
    </BookingDialog>
  );
}
