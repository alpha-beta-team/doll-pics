import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Archive,
  Copy,
  Download,
  Eye,
  MessageCircle,
  Plus,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { WhatsAppComposer } from "../components/WhatsAppComposer";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import type {
  PublicWeddingQuotation,
  QuotationAddOn,
  QuotationAssets,
  QuotationDraft,
  QuotationEvent,
  QuotationOption,
  WeddingQuotation,
} from "../types";
import { QuotationPresentation } from "../../components/quotation/QuotationPresentation";
import { calculateQuotationOption, quotationToken } from "../quotationForm";

const sectionLabels: Record<string, string> = {
  events: "Wedding events",
  gallery: "Portfolio gallery",
  why: "Why Doll Pictures",
  addons: "Optional add-ons",
  payments: "Payment journey",
  delivery: "Delivery",
  testimonial: "Testimonial",
  terms: "Terms",
};
const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
const input =
  "mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none focus:border-amber-500";
const editorAction =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-admin-control bg-admin-muted px-3 text-sm font-semibold text-admin-secondary transition hover:border-admin-focus hover:bg-admin-elevated hover:text-admin-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:opacity-40";
const smallAction =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-admin-control bg-admin-muted px-3 text-sm font-semibold text-admin-secondary transition hover:border-admin-focus hover:bg-admin-elevated hover:text-admin-text";

export function QuotationEditorPage() {
  const { id = "" } = useParams();
  const confirm = useConfirmDialog();
  const [quote, setQuote] = useState<WeddingQuotation | null>(null);
  const [assets, setAssets] = useState<QuotationAssets | null>(null);
  const [draft, setDraft] = useState<QuotationDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
    "desktop",
  );
  const [messageOpen, setMessageOpen] = useState(false);
  const [consent, setConsent] = useState({ recorded: false, optedOut: false });
  const load = useCallback(async () => {
    try {
      const [row, assetRows] = await Promise.all([
        api.getQuotation(id),
        api.getQuotationAssets(),
      ]);
      setQuote(row);
      setDraft(row.draft);
      setAssets(assetRows);
      const enquiry = await api.getEnquiry(row.enquiryId);
      setConsent({
        recorded: Boolean(enquiry?.whatsappOptIn),
        optedOut: Boolean(enquiry?.whatsappOptOutAt),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load quotation.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);
  const change = (next: QuotationDraft) => {
    setDraft(next);
    setDirty(true);
    setSuccess("");
  };
  const save = async () => {
    if (!draft || saving) return null;
    setSaving(true);
    setError("");
    try {
      const row = await api.updateQuotation(id, draft);
      setQuote(row);
      setDraft(row.draft);
      setDirty(false);
      setSuccess("Draft saved.");
      return row;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save quotation.",
      );
      return null;
    } finally {
      setSaving(false);
    }
  };
  const publish = async () => {
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    try {
      const row = await api.publishQuotation(id);
      setQuote(row);
      setDraft(row.draft);
      setSuccess(
        row.publishedRevision === 1
          ? "Quotation published."
          : "Published quotation updated.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not publish quotation.",
      );
    } finally {
      setSaving(false);
    }
  };
  const archive = async () => {
    if (!quote) return;
    const accepted = await confirm({
      title: "Archive this quotation?",
      description:
        "The private customer link will become unavailable until the quotation is published again.",
      confirmLabel: "Archive quotation",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      setQuote(await api.archiveQuotation(quote.id));
      setSuccess("Quotation archived.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not archive quotation.",
      );
    }
  };
  const copyLink = async () => {
    if (!quote?.shareUrl) return;
    await navigator.clipboard.writeText(quote.shareUrl);
    setSuccess("Private quotation link copied.");
  };
  const downloadPdf = async () => {
    if (!quote?.shareUrl || saving) return;
    setSaving(true);
    setError("");
    try {
      const token = quotationToken(quote.shareUrl);
      const publicQuote = await api.getPublicQuotation(token);
      const { downloadQuotationPdf } = await import(
        "../../components/quotation/downloadQuotationPdf"
      );
      await downloadQuotationPdf(publicQuote);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not prepare the PDF.",
      );
    } finally {
      setSaving(false);
    }
  };
  const previewValue = useMemo(
    () => (draft && assets ? makePreview(draft, assets, quote) : null),
    [assets, draft, quote],
  );
  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  if (!quote || !draft || !assets)
    return (
      <div className="rounded-xl bg-red-50 p-5 text-red-700">
        {error || "Quotation not found."}
      </div>
    );
  const set = <K extends keyof QuotationDraft>(
    key: K,
    value: QuotationDraft[K],
  ) => change({ ...draft, [key]: value });
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="sticky top-16 z-20 rounded-2xl border border-admin-border bg-admin-elevated/95 p-4 text-admin-text shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/quotations"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-admin-control bg-admin-muted text-admin-secondary transition hover:border-admin-focus hover:text-admin-text"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-admin-text">
              {draft.coupleNames || "Wedding quotation"}
            </h1>
            <p className="text-sm text-admin-subtle">
              {quote.quotationNumber || "Unpublished draft"} ·{" "}
              {quote.expired ? "expired" : quote.status}
              {dirty ? " · unsaved changes" : ""}
            </p>
          </div>
          <button onClick={() => setPreview(true)} className={editorAction}>
            <Eye className="h-4 w-4" />
            Preview
          </button>
          {quote.shareUrl && (
            <>
              <button onClick={() => void copyLink()} className={editorAction}>
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <button
                disabled={saving}
                onClick={() => void downloadPdf()}
                className={editorAction}
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
              <button
                disabled={consent.optedOut}
                onClick={() => setMessageOpen(true)}
                className={`${editorAction} !border-emerald-700 !bg-emerald-950/40 !text-emerald-300`}
                title={
                  consent.optedOut
                    ? "Customer opted out of WhatsApp templates"
                    : undefined
                }
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </>
          )}
          <button
            disabled={saving || !dirty}
            onClick={() => void save()}
            className={editorAction}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            disabled={saving}
            onClick={() => void publish()}
            className={`${editorAction} !border-admin-primary !bg-admin-primary !text-white hover:!bg-admin-primary-hover`}
          >
            <Send className="h-4 w-4" />
            {quote.publishedRevision ? "Publish updates" : "Publish"}
          </button>
        </div>
      </header>
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <EditorCard title="Customer and celebration">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer name">
                <input
                  className={input}
                  value={draft.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={input}
                  type="tel"
                  value={draft.customerPhone}
                  onChange={(e) => set("customerPhone", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className={input}
                  type="email"
                  value={draft.customerEmail}
                  onChange={(e) => set("customerEmail", e.target.value)}
                />
              </Field>
              <Field label="Couple names">
                <input
                  className={input}
                  value={draft.coupleNames}
                  onChange={(e) => set("coupleNames", e.target.value)}
                  placeholder="Anu & Kavin"
                />
              </Field>
              <Field label="Quotation title">
                <input
                  className={input}
                  value={draft.weddingTitle}
                  onChange={(e) => set("weddingTitle", e.target.value)}
                />
              </Field>
              <Field label="Valid until">
                <input
                  className={input}
                  type="date"
                  value={draft.validUntil}
                  onChange={(e) => set("validUntil", e.target.value)}
                />
              </Field>
            </div>
          </EditorCard>
          <EditorCard
            title="Wedding events"
            action={
              <button
                onClick={() => set("events", [...draft.events, emptyEvent()])}
                className={smallAction}
              >
                <Plus className="h-4 w-4" />
                Add event
              </button>
            }
          >
            {draft.events.map((event, index) => (
              <EventEditor
                key={event.id}
                event={event}
                onChange={(value) =>
                  set(
                    "events",
                    draft.events.map((row, i) => (i === index ? value : row)),
                  )
                }
                onRemove={() =>
                  set(
                    "events",
                    draft.events.filter((_, i) => i !== index),
                  )
                }
              />
            ))}
          </EditorCard>
          <EditorCard
            title="Package options"
            action={
              draft.options.length < 3 ? (
                <button
                  onClick={() =>
                    set("options", [...draft.options, emptyOption()])
                  }
                  className={smallAction}
                >
                  <Plus className="h-4 w-4" />
                  Add option
                </button>
              ) : undefined
            }
          >
            <p className="mb-4 text-sm text-slate-500">
              Add up to three choices. Select an existing package to prefill,
              then customize freely.
            </p>
            {draft.options.map((option, index) => (
              <OptionEditor
                key={option.id}
                option={option}
                events={draft.events}
                assets={assets}
                onChange={(value) =>
                  set(
                    "options",
                    draft.options.map((row, i) =>
                      i === index
                        ? value
                        : value.recommended
                          ? { ...row, recommended: false }
                          : row,
                    ),
                  )
                }
                onRemove={() =>
                  set(
                    "options",
                    draft.options.filter((_, i) => i !== index),
                  )
                }
              />
            ))}
          </EditorCard>
          <EditorCard
            title="Optional add-ons"
            action={
              <button
                onClick={() => set("addOns", [...draft.addOns, emptyAddOn()])}
                className={smallAction}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            }
          >
            {draft.addOns.map((item, index) => (
              <AddOnEditor
                key={item.id}
                item={item}
                onChange={(value) =>
                  set(
                    "addOns",
                    draft.addOns.map((row, i) => (i === index ? value : row)),
                  )
                }
                onRemove={() =>
                  set(
                    "addOns",
                    draft.addOns.filter((_, i) => i !== index),
                  )
                }
              />
            ))}
            {!draft.addOns.length && <Empty>No add-ons included.</Empty>}
          </EditorCard>
          <EditorCard title="Payment milestones">
            {draft.paymentMilestones.map((item, index) => (
              <div
                key={item.id}
                className="mb-2 grid grid-cols-[1fr_90px_44px] gap-2"
              >
                <input
                  value={item.label}
                  onChange={(e) =>
                    set(
                      "paymentMilestones",
                      draft.paymentMilestones.map((row, i) =>
                        i === index ? { ...row, label: e.target.value } : row,
                      ),
                    )
                  }
                  className="h-11 rounded-xl border px-3"
                />
                <input
                  type="number"
                  value={item.percentage}
                  onChange={(e) =>
                    set(
                      "paymentMilestones",
                      draft.paymentMilestones.map((row, i) =>
                        i === index
                          ? { ...row, percentage: Number(e.target.value) }
                          : row,
                      ),
                    )
                  }
                  className="h-11 rounded-xl border px-3"
                />
                <button
                  onClick={() =>
                    set(
                      "paymentMilestones",
                      draft.paymentMilestones.filter((_, i) => i !== index),
                    )
                  }
                  className="flex h-11 items-center justify-center text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                set("paymentMilestones", [
                  ...draft.paymentMilestones,
                  { id: uid("payment"), label: "", percentage: 0 },
                ])
              }
              className={`${smallAction} mt-2`}
            >
              <Plus className="h-4 w-4" />
              Add milestone
            </button>
            <p
              className={`mt-3 text-sm font-semibold ${draft.paymentMilestones.reduce((sum, item) => sum + Number(item.percentage), 0) === 100 ? "text-emerald-700" : "text-red-600"}`}
            >
              Total{" "}
              {draft.paymentMilestones.reduce(
                (sum, item) => sum + Number(item.percentage),
                0,
              )}
              %
            </p>
          </EditorCard>
          <EditorCard title="Story and terms">
            {(
              [
                ["introduction", "Personal introduction"],
                ["whyDollPictures", "Why Doll Pictures"],
                ["deliveryInformation", "Delivery information"],
                ["terms", "Terms"],
                ["closingMessage", "Closing message"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea
                  rows={key === "terms" ? 6 : 4}
                  value={draft[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </Field>
            ))}
          </EditorCard>
        </div>
        <aside className="space-y-5">
          <EditorCard title="Visual style">
            <Field label="Palette">
              <select
                className={input}
                value={draft.palette}
                onChange={(e) =>
                  set("palette", e.target.value as QuotationDraft["palette"])
                }
              >
                <option value="champagne">Champagne and ivory</option>
                <option value="blush">Blush and wine</option>
                <option value="midnight">Midnight and gold</option>
              </select>
            </Field>
            <p className="mt-4 text-sm font-semibold">Cover photograph</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {assets.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => set("coverPhotoId", photo.id)}
                  className={`overflow-hidden rounded-xl border-2 ${draft.coverPhotoId === photo.id ? "border-amber-500" : "border-transparent"}`}
                  title={photo.title}
                >
                  <img
                    src={photo.url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <p className="mt-5 text-sm font-semibold">
              Gallery photographs ({draft.galleryPhotoIds.length}/6)
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {assets.photos.map((photo) => {
                const selected = draft.galleryPhotoIds.includes(photo.id);
                return (
                  <button
                    key={photo.id}
                    onClick={() =>
                      set(
                        "galleryPhotoIds",
                        selected
                          ? draft.galleryPhotoIds.filter(
                              (id) => id !== photo.id,
                            )
                          : draft.galleryPhotoIds.length < 6
                            ? [...draft.galleryPhotoIds, photo.id]
                            : draft.galleryPhotoIds,
                      )
                    }
                    className={`overflow-hidden rounded-xl border-2 ${selected ? "border-amber-500" : "border-transparent"}`}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
            <Field label="Testimonial">
              <select
                className={input}
                value={draft.testimonialId}
                onChange={(e) => set("testimonialId", e.target.value)}
              >
                <option value="">No testimonial</option>
                {assets.testimonials.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </EditorCard>
          <EditorCard title="Page sections">
            {draft.sectionOrder.map((section, index) => (
              <div
                key={section}
                className="mb-2 flex items-center gap-2 rounded-xl bg-slate-50 p-2"
              >
                <input
                  type="checkbox"
                  checked={draft.visibleSections.includes(section)}
                  onChange={(e) =>
                    set(
                      "visibleSections",
                      e.target.checked
                        ? [...draft.visibleSections, section]
                        : draft.visibleSections.filter((id) => id !== section),
                    )
                  }
                  className="h-5 w-5"
                />
                <span className="min-w-0 flex-1 text-sm font-semibold">
                  {sectionLabels[section]}
                </span>
                <button
                  disabled={!index}
                  onClick={() =>
                    set(
                      "sectionOrder",
                      move(draft.sectionOrder, index, index - 1),
                    )
                  }
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  disabled={index === draft.sectionOrder.length - 1}
                  onClick={() =>
                    set(
                      "sectionOrder",
                      move(draft.sectionOrder, index, index + 1),
                    )
                  }
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            ))}
          </EditorCard>
          {quote.status !== "archived" && (
            <button
              onClick={() => void archive()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-300 text-sm font-semibold text-red-600"
            >
              <Archive className="h-4 w-4" />
              Archive quotation
            </button>
          )}
        </aside>
      </div>
      {preview && previewValue && (
        <div className="fixed inset-0 z-[95] overflow-y-auto bg-slate-950/80 p-3 pt-20 md:p-8 md:pt-20">
          <div className="fixed left-4 top-4 z-10 flex gap-2 rounded-full bg-white p-1 shadow-xl">
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={`h-10 rounded-full px-4 text-sm font-semibold ${previewDevice === "mobile" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Mobile
            </button>
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={`h-10 rounded-full px-4 text-sm font-semibold ${previewDevice === "desktop" ? "bg-slate-900 text-white" : "text-slate-600"}`}
            >
              Desktop
            </button>
            {quote.shareUrl && (
              <button
                onClick={() => void downloadPdf()}
                className="h-10 rounded-full px-4 text-sm font-semibold text-slate-600"
              >
                PDF
              </button>
            )}
          </div>
          <button
            onClick={() => setPreview(false)}
            className="fixed right-5 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className={`mx-auto overflow-hidden rounded-2xl transition-[max-width] ${previewDevice === "mobile" ? "max-w-[390px]" : "max-w-6xl"}`}
          >
            <QuotationPresentation quotation={previewValue} />
          </div>
        </div>
      )}
      {messageOpen && (
        <WhatsAppComposer
          initialTemplate="wedding_quotation"
          context={{
            customerName: quote.customerName,
            phone: quote.customerPhone,
            quotationUrl: quote.shareUrl,
            consentRecorded: consent.recorded,
            optedOut: consent.optedOut,
          }}
          onClose={() => setMessageOpen(false)}
        />
      )}
    </div>
  );
}

function EditorCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
function EventEditor({
  event,
  onChange,
  onRemove,
}: {
  event: QuotationEvent;
  onChange: (value: QuotationEvent) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
      <Field label="Event name">
        <input
          className={input}
          value={event.name}
          onChange={(e) => onChange({ ...event, name: e.target.value })}
        />
      </Field>
      <Field label="Date">
        <input
          className={input}
          type="date"
          value={event.date}
          onChange={(e) => onChange({ ...event, date: e.target.value })}
        />
      </Field>
      <Field label="Location">
        <input
          className={input}
          value={event.location}
          onChange={(e) => onChange({ ...event, location: e.target.value })}
        />
      </Field>
      <Field label="Notes">
        <input
          className={input}
          value={event.notes}
          onChange={(e) => onChange({ ...event, notes: e.target.value })}
        />
      </Field>
      <button
        onClick={onRemove}
        className="text-left text-sm font-semibold text-red-600"
      >
        <Trash2 className="mr-1 inline h-4 w-4" />
        Remove event
      </button>
    </div>
  );
}
function OptionEditor({
  option,
  events,
  assets,
  onChange,
  onRemove,
}: {
  option: QuotationOption;
  events: QuotationEvent[];
  assets: QuotationAssets;
  onChange: (value: QuotationOption) => void;
  onRemove: () => void;
}) {
  const calculated = calculateQuotationOption(option);
  const patch = (value: Partial<QuotationOption>) =>
    onChange(calculateQuotationOption({ ...option, ...value }));
  const prefill = (packageId: string) => {
    const pkg = assets.packages.find((item) => item.id === packageId);
    if (!pkg) return;
    const price = Number(pkg.price || 0);
    onChange(
      calculateQuotationOption({
        ...option,
        name: pkg.name,
        tagline: pkg.description,
        inclusions: pkg.inclusions,
        advanceAmount: Number(pkg.advanceAmount || 0),
        lineItems: [
          {
            id: uid("line"),
            eventId: events[0]?.id || "",
            title: pkg.name,
            description: pkg.description,
            quantity: 1,
            unitPrice: price,
            amount: price,
          },
        ],
      }),
    );
  };
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Prefill package">
          <select
            className={input}
            defaultValue=""
            onChange={(e) => prefill(e.target.value)}
          >
            <option value="">Choose package…</option>
            {assets.packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Option name">
          <input
            className={input}
            value={option.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <label className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-amber-50 px-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={option.recommended}
            onChange={(e) => patch({ recommended: e.target.checked })}
          />
          Recommended
        </label>
      </div>
      <Field label="Tagline">
        <input
          className={input}
          value={option.tagline}
          onChange={(e) => patch({ tagline: e.target.value })}
        />
      </Field>
      <p className="text-sm font-semibold">Pricing lines</p>
      {option.lineItems.map((item, index) => (
        <div
          key={item.id}
          className="mt-2 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_130px_100px_44px]"
        >
          <div>
            <input
              value={item.title}
              onChange={(e) =>
                patch({
                  lineItems: option.lineItems.map((row, i) =>
                    i === index ? { ...row, title: e.target.value } : row,
                  ),
                })
              }
              placeholder="Service"
              className="h-10 w-full rounded-lg border px-2"
            />
            <select
              value={item.eventId}
              onChange={(e) =>
                patch({
                  lineItems: option.lineItems.map((row, i) =>
                    i === index ? { ...row, eventId: e.target.value } : row,
                  ),
                })
              }
              className="mt-1 h-9 w-full rounded-lg border px-2 text-xs"
            >
              <option value="">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={item.quantity}
            onChange={(e) =>
              patch({
                lineItems: option.lineItems.map((row, i) =>
                  i === index
                    ? { ...row, quantity: Number(e.target.value) }
                    : row,
                ),
              })
            }
            className="h-10 rounded-lg border px-2"
            placeholder="Qty"
          />
          <input
            type="number"
            min="0"
            value={item.unitPrice}
            onChange={(e) =>
              patch({
                lineItems: option.lineItems.map((row, i) =>
                  i === index
                    ? { ...row, unitPrice: Number(e.target.value) }
                    : row,
                ),
              })
            }
            className="h-10 rounded-lg border px-2"
            placeholder="₹"
          />
          <button
            onClick={() =>
              patch({
                lineItems: option.lineItems.filter((_, i) => i !== index),
              })
            }
            className="flex h-10 items-center justify-center text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() =>
          patch({
            lineItems: [
              ...option.lineItems,
              {
                id: uid("line"),
                eventId: events[0]?.id || "",
                title: "",
                description: "",
                quantity: 1,
                unitPrice: 0,
                amount: 0,
              },
            ],
          })
        }
        className={`${smallAction} mt-2`}
      >
        <Plus className="h-4 w-4" />
        Add price line
      </button>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Field label="Discount">
          <input
            className={input}
            type="number"
            min="0"
            value={option.discountAmount}
            onChange={(e) => patch({ discountAmount: Number(e.target.value) })}
          />
        </Field>
        <Field label="Advance">
          <input
            className={input}
            type="number"
            min="0"
            value={option.advanceAmount}
            onChange={(e) => patch({ advanceAmount: Number(e.target.value) })}
          />
        </Field>
        <div className="pt-7">
          <p className="text-xs text-slate-500">Estimated total</p>
          <p className="text-xl font-bold text-amber-700">
            ₹{calculated.total.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <ListField
        label="Inclusions"
        items={option.inclusions}
        onChange={(items) => patch({ inclusions: items })}
      />
      <ListField
        label="Deliverables"
        items={option.deliverables}
        onChange={(items) => patch({ deliverables: items })}
      />
      <button
        onClick={onRemove}
        className="mt-3 text-sm font-semibold text-red-600"
      >
        <Trash2 className="mr-1 inline h-4 w-4" />
        Remove option
      </button>
    </div>
  );
}
function AddOnEditor({
  item,
  onChange,
  onRemove,
}: {
  item: QuotationAddOn;
  onChange: (value: QuotationAddOn) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 rounded-xl border p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_150px_120px_44px]">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="Add-on name"
          className="h-11 rounded-xl border px-3"
        />
        <select
          value={item.pricingMode}
          onChange={(e) =>
            onChange({
              ...item,
              pricingMode: e.target.value as QuotationAddOn["pricingMode"],
              ...(e.target.value === "enquire" ? { price: undefined } : {}),
            })
          }
          className="h-11 rounded-xl border px-3"
        >
          <option value="fixed">Fixed price</option>
          <option value="starting_from">Starting from</option>
          <option value="enquire">On request</option>
        </select>
        {item.pricingMode === "enquire" ? (
          <span className="flex h-11 items-center text-sm text-slate-500">
            No price
          </span>
        ) : (
          <input
            type="number"
            min="0"
            value={item.price || 0}
            onChange={(e) =>
              onChange({ ...item, price: Number(e.target.value) })
            }
            className="h-11 rounded-xl border px-3"
          />
        )}
        <button
          onClick={onRemove}
          className="flex h-11 items-center justify-center text-red-600"
          aria-label="Remove add-on"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        value={item.description}
        onChange={(e) => onChange({ ...item, description: e.target.value })}
        placeholder="Optional add-on description"
        className="mt-2 h-11 w-full rounded-xl border px-3"
      />
    </div>
  );
}
function ListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-sm font-semibold">{label}</p>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="mt-2 flex gap-2">
          <input
            value={item}
            onChange={(e) =>
              onChange(
                items.map((row, i) => (i === index ? e.target.value : row)),
              )
            }
            className="h-10 min-w-0 flex-1 rounded-lg border px-3"
          />
          <button
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="mt-2 text-xs font-semibold text-blue-600"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}
function emptyEvent(): QuotationEvent {
  return { id: uid("event"), name: "", date: "", location: "", notes: "" };
}
function emptyOption(): QuotationOption {
  return {
    id: uid("option"),
    name: "",
    tagline: "",
    recommended: false,
    lineItems: [],
    inclusions: [],
    deliverables: [],
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    advanceAmount: 0,
  };
}
function emptyAddOn(): QuotationAddOn {
  return {
    id: uid("addon"),
    name: "",
    description: "",
    pricingMode: "fixed",
    price: 0,
  };
}
function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
function makePreview(
  draft: QuotationDraft,
  assets: QuotationAssets,
  quote: WeddingQuotation | null,
): PublicWeddingQuotation {
  const cover = assets.photos.find((item) => item.id === draft.coverPhotoId) ||
    assets.photos[0] || {
      id: "",
      url: "/og-share.jpg",
      title: "",
      altText: "",
    };
  const gallery = draft.galleryPhotoIds
    .map((id) => assets.photos.find((item) => item.id === id))
    .filter(Boolean) as QuotationAssets["photos"];
  const testimonial = assets.testimonials.find(
    (item) => item.id === draft.testimonialId,
  );
  return {
    coupleNames: draft.coupleNames,
    weddingTitle: draft.weddingTitle,
    validUntil: draft.validUntil,
    events: draft.events,
    options: draft.options.map((option) => {
      const lineItems = option.lineItems.map((item) => ({
        ...item,
        amount: Number(item.quantity) * Number(item.unitPrice),
      }));
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      return {
        ...option,
        lineItems,
        subtotal,
        total: Math.max(0, subtotal - Number(option.discountAmount)),
      };
    }),
    addOns: draft.addOns,
    paymentMilestones: draft.paymentMilestones,
    introduction: draft.introduction,
    whyDollPictures: draft.whyDollPictures,
    deliveryInformation: draft.deliveryInformation,
    terms: draft.terms,
    closingMessage: draft.closingMessage,
    palette: draft.palette,
    visibleSections: draft.visibleSections,
    sectionOrder: draft.sectionOrder,
    quotationNumber: quote?.quotationNumber || "DRAFT PREVIEW",
    publishedRevision: quote?.publishedRevision || 0,
    publishedAt: quote?.publishedAt || new Date().toISOString(),
    expired: false,
    coverPhoto: cover,
    galleryPhotos: gallery,
    ...(testimonial ? { testimonial } : {}),
    brand: {
      name: "Doll Pictures",
      tagline: "Stories, beautifully remembered",
      logoUrl: "/logo-doll.png",
      phone: "",
      email: "",
      whatsapp: "",
      instagram: "",
      website: "dollpictures.in",
    },
  };
}
