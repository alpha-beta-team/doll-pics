import { useCallback, useEffect, useState } from "react";
import { CustomerBookingPresentation } from "../../components/CustomerBookingPresentation";
import type { CustomerPageSettings } from "../../shared/customerBooking";
import { staffAccountsApi } from "../api/staffAccounts";
import type { Booking, StaffAccountOption } from "../types";
import { request } from "../api/http";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

const button =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-admin-control bg-admin-surface px-4 py-2 text-sm font-semibold text-admin-text disabled:opacity-50";

export function CustomerBookingPanel({
  booking,
  onUpdated,
}: {
  booking: Booking;
  onUpdated?: () => void;
}) {
  const [editorId, setEditorId] = useState("");
  const [editors, setEditors] = useState<StaffAccountOption[]>([]);
  const [editorsError, setEditorsError] = useState(false);
  useEffect(() => {
    let active = true;
    void staffAccountsApi
      .getAssignableStaffAccounts()
      .then((items) => {
        if (active) setEditors(items);
      })
      .catch(() => {
        if (active) setEditorsError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const [settings, setSettings] = useState<CustomerPageSettings | null>(null);
  const [date, setDate] = useState("");
  const [update, setUpdate] = useState("");
  const [gallery, setGallery] = useState(false);
  const [edited, setEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const confirm = useConfirmDialog();
  const base = `/admin/bookings/${booking.id}/customer-page`;
  const accept = (next: CustomerPageSettings) => {
    setSettings(next);
    setDate(next.expectedDeliveryDate);
    setEditorId(next.editorStaffAccountId || "");
    setUpdate(next.update);
    setGallery(Boolean(next.preview.delivery.galleryUrl));
    setEdited(Boolean(next.preview.delivery.editedUrl));
  };
  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      setSettings(null);
      try {
        const next = await request<CustomerPageSettings>(base, {
          auth: true,
          signal,
          cache: "no-store",
        });
        if (!signal?.aborted) accept(next);
      } catch (cause) {
        if (!signal?.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load customer page settings",
          );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [base],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, booking.status, booking.driveGalleryUrl, booking.driveEditedUrl]);

  const change = async (path: string, method: string, body?: object) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await request<CustomerPageSettings>(`${base}${path}`, {
        auth: true,
        method,
        cache: "no-store",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (path === "") accept(next);
      else {
        // Link and publication actions must not discard an unsaved customer note.
        setSettings(next);
        if (path === "/delivery") {
          setGallery(Boolean(next.preview.delivery.galleryUrl));
          setEdited(Boolean(next.preview.delivery.editedUrl));
        }
      }
      setNotice("Customer page updated.");
      onUpdated?.();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the customer page",
      );
    } finally {
      setBusy(false);
    }
  };
  const replaceLink = async () => {
    if (
      settings?.token &&
      !(await confirm({
        title: "Replace customer link?",
        description:
          "The previous link will stop working immediately. Share the new link with your customer.",
        confirmLabel: "Replace link",
      }))
    )
      return;
    await change("/link", "POST");
  };
  const revoke = async () => {
    if (
      await confirm({
        title: "Disable customer link?",
        description:
          "Anyone using this link will see an unavailable page. Create a new link to restore access.",
        confirmLabel: "Disable link",
      })
    )
      await change("/link", "DELETE");
  };
  const publish = async () => {
    if (
      await confirm({
        title: "Publish selected delivery links?",
        description:
          "The selected links shown below will be available to anyone holding the private booking link.",
        confirmLabel: "Publish links",
      })
    )
      await change("/delivery", "POST", { gallery, edited });
  };
  const shareUrl = settings?.token
    ? new URL(`/customer-booking/${settings.token}`, window.location.origin)
        .href
    : "";
  const expired = Boolean(
    settings?.expiresAt && Date.parse(settings.expiresAt) <= Date.now(),
  );
  const dirty = Boolean(
    settings &&
    (date !== settings.expectedDeliveryDate ||
      update !== settings.update ||
      editorId !== (settings.editorStaffAccountId || "")),
  );

  return (
    <section
      className="space-y-4 rounded-2xl border border-admin-border bg-admin-surface p-4 sm:p-6"
      aria-labelledby="customer-page-title"
    >
      <div>
        <h2
          id="customer-page-title"
          className="text-lg font-semibold text-admin-text"
        >
          Customer page
        </h2>
        <p className="mt-1 text-sm text-admin-subtle">
          Owner controls · Anyone holding the link can view the permitted
          booking details.
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-3 min-h-11 underline"
            disabled={busy}
          >
            Reload settings
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-4 text-sm">
          Loading customer page settings…
        </p>
      ) : (
        settings && (
          <>
            <div className="space-y-3 rounded-xl border border-admin-border p-4">
              <h3 className="font-semibold">Private link</h3>
              {shareUrl ? (
                <>
                  <label className="block text-sm">
                    Customer booking link
                    <input
                      readOnly
                      value={shareUrl}
                      className="mt-2 h-12 w-full rounded-lg border border-admin-control bg-admin-canvas px-3 text-sm"
                      onFocus={(event) => event.target.select()}
                    />
                  </label>
                  <p
                    className={`text-sm ${expired ? "text-red-700" : "text-admin-subtle"}`}
                  >
                    {expired ? "Expired" : "Expires"}{" "}
                    {new Date(settings.expiresAt).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}{" "}
                    (India time). Replacing invalidates the previous link.
                  </p>
                </>
              ) : (
                <p className="text-sm text-admin-subtle">
                  No active link. Create one after confirming the booking. Links
                  expire after 180 days.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={button}
                  disabled={busy || booking.status === "draft"}
                  onClick={() => void replaceLink()}
                >
                  {shareUrl ? "Replace link" : "Create link"}
                </button>
                {shareUrl && (
                  <>
                    <button
                      type="button"
                      className={button}
                      disabled={busy || expired}
                      onClick={() => {
                        void navigator.clipboard
                          .writeText(shareUrl)
                          .then(() =>
                            setNotice(
                              "Private link copied. Share it only with the customer.",
                            ),
                          )
                          .catch(() =>
                            setError(
                              "Could not copy. Select and copy the link above.",
                            ),
                          );
                      }}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      className={button}
                      disabled={busy}
                      onClick={() => void revoke()}
                    >
                      Disable link
                    </button>
                  </>
                )}
              </div>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void change("", "PATCH", {
                  expectedDeliveryDate: date,
                  editorStaffAccountId: editorId,
                  update,
                });
              }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold">
                Assigned editor
                <select
                  value={editorId}
                  onChange={(event) => setEditorId(event.target.value)}
                  disabled={busy || editorsError}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-admin-control bg-admin-surface px-3"
                >
                  <option value="">No editor assigned</option>
                  {editorId &&
                    !editors.some((editor) => editor.id === editorId) && (
                      <option value={editorId}>
                        {settings.editorName || "Current editor"} (unavailable)
                      </option>
                    )}
                  {editors.map((editor) => (
                    <option key={editor.id} value={editor.id}>
                      {editor.name}
                      {editor.jobTitle ? ` · ${editor.jobTitle}` : ""}
                    </option>
                  ))}
                </select>
                <span className="mt-1 block text-xs font-normal text-admin-subtle">
                  Internal delivery assignment, separate from the shoot
                  assignee.
                </span>
                {editorsError && (
                  <span
                    role="alert"
                    className="mt-1 block text-xs text-red-700"
                  >
                    Could not load editors. Reopen this panel to retry.
                  </span>
                )}
              </label>
              <label className="block text-sm font-semibold">
                Expected delivery date{" "}
                <span className="font-normal text-admin-subtle">
                  (optional)
                </span>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-2 block min-h-12 w-full rounded-xl border border-admin-control bg-admin-surface px-3 sm:max-w-xs"
                  disabled={busy}
                />
              </label>
              <label className="block text-sm font-semibold">
                Customer-facing update{" "}
                <span className="font-normal text-admin-subtle">
                  (optional)
                </span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={update}
                  onChange={(event) => setUpdate(event.target.value)}
                  disabled={busy}
                  className="mt-2 block w-full rounded-xl border border-admin-control bg-admin-surface p-3 text-base font-normal"
                  placeholder="A short update for your customer. Internal notes remain private."
                />
              </label>
              <button
                type="submit"
                className={button}
                disabled={busy || !dirty}
              >
                Save delivery details
              </button>
            </form>
            <div className="space-y-3 rounded-xl border border-admin-border p-4">
              <h3 className="font-semibold">Publish delivery</h3>
              <p className="text-sm text-admin-subtle">
                Only the links selected here are released. Editing saved
                delivery URLs requires republication. RAW files and internal
                notes remain private.
              </p>
              {(
                [
                  ["gallery", "Gallery", settings.sources.galleryUrl],
                  ["edited", "Edited photographs", settings.sources.editedUrl],
                ] as const
              ).map(([key, label, url]) => (
                <label
                  key={key}
                  className="flex min-h-12 items-start gap-3 rounded-lg bg-admin-canvas p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 shrink-0"
                    checked={key === "gallery" ? gallery : edited}
                    disabled={busy || !url || booking.status !== "delivered"}
                    onChange={(event) =>
                      key === "gallery"
                        ? setGallery(event.target.checked)
                        : setEdited(event.target.checked)
                    }
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-semibold">{label}</span>
                    <span className="mt-1 block break-all text-xs text-admin-subtle">
                      {url || "No saved link"}
                    </span>
                  </span>
                </label>
              ))}
              {booking.status !== "delivered" && (
                <p className="text-sm text-amber-800">
                  Mark the booking delivered before publishing links.
                </p>
              )}
              {settings.publishedAt && (
                <p className="text-sm text-admin-subtle">
                  Published{" "}
                  {new Date(settings.publishedAt).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                  . The preview below shows the published snapshot.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={button}
                  disabled={
                    busy ||
                    booking.status !== "delivered" ||
                    (!gallery && !edited)
                  }
                  onClick={() => void publish()}
                >
                  {settings.publishedAt
                    ? "Republish selected links"
                    : "Publish selected links"}
                </button>
                {settings.publishedAt && (
                  <button
                    type="button"
                    className={button}
                    disabled={busy}
                    onClick={() => void change("/delivery", "DELETE")}
                  >
                    Unpublish links
                  </button>
                )}
              </div>
            </div>
            <details className="rounded-xl border border-admin-border">
              <summary className="min-h-12 cursor-pointer p-4 text-sm font-semibold">
                Preview customer page
              </summary>
              <p className="px-4 pb-3 text-sm text-admin-subtle">
                Saved information and published links. Unsaved updates are
                excluded.
                {booking.status === "draft"
                  ? " Draft bookings cannot be opened by customers."
                  : ""}
              </p>
              <div className="rounded-b-xl bg-[#f7f3ec] p-4">
                <CustomerBookingPresentation booking={settings.preview} />
              </div>
            </details>
          </>
        )
      )}
    </section>
  );
}
