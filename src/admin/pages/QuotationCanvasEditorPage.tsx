import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  Laptop,
  MessageCircle,
  Minus,
  Monitor,
  Redo2,
  Save,
  Send,
  Smartphone,
  Undo2,
  ZoomIn,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { WhatsAppComposer } from "../components/WhatsAppComposer";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useAdminShell } from "../contexts/AdminShellContext";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from "../nav/config";
import type { QuotationAssets, WeddingQuotation } from "../types";
import { quotationToken } from "../quotationForm";
import { draftToQuotationPresentation } from "../../components/quotation/quotationPresentationModel";
import { QuotationPresentation } from "../../components/quotation/QuotationPresentation";
import { ReadOnlyNotice } from "../components/ReadOnlyNotice";
import { useFeatureAccess } from "../access/useFeatureAccess";
import { QuotationCanvas } from "../quotationCanvas/QuotationCanvas";
import { QuotationInspector } from "../quotationCanvas/QuotationInspector";
import {
  createQuotationEditorState,
  quotationEditorDirty,
  quotationEditorReducer,
  validateQuotationCanvasDraft,
  type QuotationSelection,
} from "../quotationCanvas/state";
import {
  moveQuotationSection,
  placeQuotationSectionBefore,
} from "../quotationCanvas/helpers";

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
const toolbarButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-admin-control bg-admin-muted px-3 text-sm font-semibold text-admin-secondary transition hover:border-admin-focus hover:text-admin-text disabled:cursor-not-allowed disabled:opacity-35";

export function QuotationCanvasEditorPage() {
  const { isReadOnly } = useFeatureAccess("quotations");
  const { id = "" } = useParams();
  const [quote, setQuote] = useState<WeddingQuotation | null>(null);
  const [assets, setAssets] = useState<QuotationAssets | null>(null);
  const [consent, setConsent] = useState({ recorded: false, optedOut: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [row, assetRows] = await Promise.all([
        api.getQuotation(id),
        api.getQuotationAssets(),
      ]);
      setQuote(row);
      setAssets(assetRows);
      if (!isReadOnly) {
        const enquiry = await api.getEnquiry(row.enquiryId);
        setConsent({
          recorded: Boolean(enquiry?.whatsappOptIn),
          optedOut: Boolean(enquiry?.whatsappOptOutAt),
        });
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load quotation.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, isReadOnly]);
  useEffect(() => {
    void load();
  }, [load]);
  if (loading)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-admin-primary border-t-transparent" />
      </div>
    );
  if (!quote || !assets)
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/40 p-5 text-red-300">
        {error || "Quotation not found."}
      </div>
    );
  if (isReadOnly)
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/admin/quotations" className="text-sm font-semibold text-admin-secondary hover:text-admin-text">
            Back to quotations
          </Link>
          <ReadOnlyNotice />
        </div>
        <QuotationPresentation
          quotation={draftToQuotationPresentation(quote.draft, assets, quote)}
        />
      </div>
    );
  return (
    <LoadedCanvasEditor
      initialQuote={quote}
      assets={assets}
      consent={consent}
    />
  );
}

function LoadedCanvasEditor({
  initialQuote,
  assets,
  consent,
}: {
  initialQuote: WeddingQuotation;
  assets: QuotationAssets;
  consent: { recorded: boolean; optedOut: boolean };
}) {
  const confirm = useConfirmDialog();
  const { collapsed, isMobile } = useAdminShell();
  const shellLeft = isMobile
    ? 0
    : collapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;
  const [quote, setQuote] = useState(initialQuote);
  const [state, dispatch] = useReducer(
    quotationEditorReducer,
    initialQuote.draft,
    createQuotationEditorState,
  );
  const [saving, setSaving] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragSection, setDragSection] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const dirty = quotationEditorDirty(state);
  const draftIssues = useMemo(
    () => validateQuotationCanvasDraft(state.draft),
    [state.draft],
  );
  const presentation = useMemo(
    () => draftToQuotationPresentation(state.draft, assets, quote),
    [assets, quote, state.draft],
  );
  const select = (selection: QuotationSelection) => {
    dispatch({ type: "select", selection });
    setInspectorOpen(true);
    requestAnimationFrame(() =>
      document
        .querySelector(`[data-canvas-section="${selection.sectionId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };
  const edit = (draft: typeof state.draft, selection?: QuotationSelection) =>
    dispatch({ type: "edit", draft, selection });

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")
      )
        return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    dispatch({ type: "device", device: "mobile" });
    dispatch({
      type: "zoom",
      zoom: Math.min(0.92, Math.max(0.55, (window.innerWidth - 28) / 390)),
    });
  }, []);

  const save = async () => {
    if (saving) return null;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const row = await api.updateQuotation(quote.id, state.draft);
      setQuote(row);
      dispatch({ type: "saved", draft: row.draft });
      setSuccess("Draft saved.");
      return row;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save quotation.",
      );
      return null;
    } finally {
      setSaving(false);
    }
  };
  const publish = async () => {
    if (draftIssues.length) {
      setError("Resolve the highlighted quotation issues before publishing.");
      select({ sectionId: draftIssues[0].sectionId });
      return;
    }
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    try {
      const row = await api.publishQuotation(quote.id);
      setQuote(row);
      dispatch({ type: "saved", draft: row.draft });
      setSuccess(
        row.publishedRevision === 1
          ? "Quotation published."
          : "Published quotation updated.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not publish quotation.",
      );
    } finally {
      setSaving(false);
    }
  };
  const archive = async () => {
    const accepted = await confirm({
      title: "Archive this quotation?",
      description:
        "The private customer link will become unavailable until it is published again.",
      confirmLabel: "Archive",
      variant: "danger",
    });
    if (!accepted) return;
    try {
      setQuote(await api.archiveQuotation(quote.id));
      setSuccess("Quotation archived.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not archive quotation.",
      );
    }
  };
  const leave = async (event: React.MouseEvent) => {
    if (!dirty) return;
    const accepted = await confirm({
      title: "Leave with unsaved changes?",
      description: "Your canvas changes have not been saved.",
      confirmLabel: "Leave without saving",
      variant: "danger",
    });
    if (!accepted) event.preventDefault();
  };
  const copyLink = async () => {
    if (!quote.shareUrl) return;
    await navigator.clipboard.writeText(quote.shareUrl);
    setSuccess("Private link copied.");
  };
  const download = async () => {
    if (!quote.shareUrl || saving) return;
    setSaving(true);
    try {
      const token = quotationToken(quote.shareUrl);
      const published = await api.getPublicQuotation(token);
      const { downloadQuotationPdf } = await import(
        "../../components/quotation/downloadQuotationPdf"
      );
      await downloadQuotationPdf(published);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not prepare PDF.",
      );
    } finally {
      setSaving(false);
    }
  };
  const fit = () => {
    const width = stageRef.current?.clientWidth || 900;
    const base =
      state.mode === "pdf" ? 794 : state.device === "mobile" ? 390 : 1080;
    dispatch({
      type: "zoom",
      zoom: Math.min(1, Math.max(0.35, (width - 48) / base)),
    });
  };
  const reorder = (section: string, direction: -1 | 1) => {
    const order = moveQuotationSection(
      state.draft.sectionOrder,
      section,
      direction,
    );
    if (order === state.draft.sectionOrder) return;
    edit({ ...state.draft, sectionOrder: order }, { sectionId: section });
  };
  const drop = (target: string) => {
    if (!dragSection) return;
    const order = placeQuotationSectionBefore(
      state.draft.sectionOrder,
      dragSection,
      target,
    );
    if (order !== state.draft.sectionOrder)
      edit({ ...state.draft, sectionOrder: order }, { sectionId: dragSection });
    setDragSection("");
  };

  return (
    <div
      className="fixed bottom-0 right-0 top-16 z-30 flex flex-col overflow-hidden bg-admin-canvas text-admin-text transition-[left] duration-200"
      style={{ left: shellLeft }}
    >
      <header className="z-20 border-b border-admin-border bg-admin-elevated px-3 py-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/quotations"
            onClick={(event) => void leave(event)}
            className={toolbarButton}
          >
            ← <span className="hidden sm:inline">Quotations</span>
          </Link>
          <div className="min-w-[150px] flex-1">
            <h1 className="truncate font-semibold">
              {state.draft.coupleNames || "Wedding quotation"}
            </h1>
            <p className="truncate text-xs text-admin-subtle">
              {quote.quotationNumber || "Draft"} ·{" "}
              {dirty ? "Unsaved changes" : "Saved"} · {quote.status}
            </p>
          </div>
          <div className="flex rounded-xl border border-admin-control bg-admin-surface p-1">
            <button
              onClick={() => dispatch({ type: "mode", mode: "website" })}
              className={`h-9 rounded-lg px-3 text-sm font-semibold ${state.mode === "website" ? "bg-admin-primary text-white" : "text-admin-secondary"}`}
            >
              <Monitor className="mr-1 inline h-4 w-4" />
              Website
            </button>
            <button
              onClick={() => dispatch({ type: "mode", mode: "pdf" })}
              className={`h-9 rounded-lg px-3 text-sm font-semibold ${state.mode === "pdf" ? "bg-admin-primary text-white" : "text-admin-secondary"}`}
            >
              <Eye className="mr-1 inline h-4 w-4" />
              A4 PDF
            </button>
          </div>
          {state.mode === "website" && (
            <div className="hidden rounded-xl border border-admin-control bg-admin-surface p-1 sm:flex">
              <button
                aria-label="Mobile canvas"
                onClick={() => dispatch({ type: "device", device: "mobile" })}
                className={`h-9 w-10 rounded-lg ${state.device === "mobile" ? "bg-admin-muted text-white" : "text-admin-subtle"}`}
              >
                <Smartphone className="mx-auto h-4 w-4" />
              </button>
              <button
                aria-label="Desktop canvas"
                onClick={() => dispatch({ type: "device", device: "desktop" })}
                className={`h-9 w-10 rounded-lg ${state.device === "desktop" ? "bg-admin-muted text-white" : "text-admin-subtle"}`}
              >
                <Laptop className="mx-auto h-4 w-4" />
              </button>
            </div>
          )}
          <button
            className={toolbarButton}
            disabled={!state.undoStack.length}
            onClick={() => dispatch({ type: "undo" })}
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            className={toolbarButton}
            disabled={!state.redoStack.length}
            onClick={() => dispatch({ type: "redo" })}
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            className={toolbarButton}
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            <Save className="h-4 w-4" />
            <span className="hidden xl:inline">Save</span>
          </button>
          <button
            className={`${toolbarButton} !border-admin-primary !bg-admin-primary !text-white`}
            disabled={saving}
            onClick={() => void publish()}
          >
            <Send className="h-4 w-4" />
            <span className="hidden xl:inline">
              {quote.publishedRevision ? "Publish updates" : "Publish"}
            </span>
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {quote.shareUrl && (
            <>
              <button className={toolbarButton} onClick={() => void copyLink()}>
                <Copy className="h-4 w-4" />
                Copy link
              </button>
              <button
                className={toolbarButton}
                disabled={saving}
                onClick={() => void download()}
              >
                <Download className="h-4 w-4" />
                PDF
              </button>
              <button
                className={`${toolbarButton} !text-emerald-300`}
                disabled={consent.optedOut}
                onClick={() => setMessageOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </>
          )}
          {draftIssues.length > 0 && (
            <button
              className={`${toolbarButton} !border-amber-800 !bg-amber-950/40 !text-amber-200`}
              onClick={() => select({ sectionId: draftIssues[0].sectionId })}
            >
              {draftIssues.length} issue{draftIssues.length === 1 ? "" : "s"}
            </button>
          )}
          <button
            className={toolbarButton}
            onClick={() => dispatch({ type: "zoom", zoom: state.zoom - 0.1 })}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex min-h-11 items-center rounded-xl bg-admin-surface px-3 text-xs font-bold">
            {Math.round(state.zoom * 100)}%
          </span>
          <button
            className={toolbarButton}
            onClick={() => dispatch({ type: "zoom", zoom: state.zoom + 0.1 })}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button className={toolbarButton} onClick={fit}>
            Fit
          </button>
          <button
            className={toolbarButton}
            onClick={() => dispatch({ type: "zoom", zoom: 1 })}
          >
            100%
          </button>
          {quote.status !== "archived" && (
            <button
              className={`${toolbarButton} ml-auto !text-red-300`}
              onClick={() => void archive()}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="border-b border-red-900 bg-red-950 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="border-b border-emerald-900 bg-emerald-950 px-4 py-2 text-sm text-emerald-200">
          {success}
        </div>
      )}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)_330px]">
        <nav
          className="hidden overflow-y-auto border-r border-admin-border bg-admin-elevated p-3 lg:block"
          aria-label="Quotation sections"
        >
          <SectionButton
            label="Cover"
            active={state.selection?.sectionId === "cover"}
            mandatory
            onClick={() => select({ sectionId: "cover" })}
          />
          {state.draft.sectionOrder.map((section, index) => (
            <div
              key={section}
              draggable
              onDragStart={() => setDragSection(section)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => drop(section)}
              onKeyDown={(event) => {
                if (event.altKey && event.key === "ArrowUp")
                  reorder(section, -1);
                if (event.altKey && event.key === "ArrowDown")
                  reorder(section, 1);
              }}
              className="group mt-2 rounded-xl border border-admin-border bg-admin-surface p-2"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => select({ sectionId: section })}
                  className={`min-h-10 min-w-0 flex-1 truncate text-left text-sm font-semibold ${state.selection?.sectionId === section ? "text-blue-300" : "text-admin-secondary"}`}
                >
                  {sectionLabels[section]}
                </button>
                <input
                  type="checkbox"
                  checked={state.draft.visibleSections.includes(section)}
                  onChange={(event) =>
                    edit(
                      {
                        ...state.draft,
                        visibleSections: event.target.checked
                          ? [...state.draft.visibleSections, section]
                          : state.draft.visibleSections.filter(
                              (item) => item !== section,
                            ),
                      },
                      { sectionId: section },
                    )
                  }
                  aria-label={`Show ${sectionLabels[section]}`}
                  className="h-5 w-5"
                />
              </div>
              <div className="flex justify-end gap-1">
                <button
                  disabled={!index}
                  onClick={() => reorder(section, -1)}
                  className="h-8 w-8 disabled:opacity-20"
                  aria-label={`Move ${sectionLabels[section]} up`}
                >
                  <ChevronUp className="mx-auto h-4 w-4" />
                </button>
                <button
                  disabled={index === state.draft.sectionOrder.length - 1}
                  onClick={() => reorder(section, 1)}
                  className="h-8 w-8 disabled:opacity-20"
                  aria-label={`Move ${sectionLabels[section]} down`}
                >
                  <ChevronDown className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <SectionButton
            label="Package pricing"
            active={state.selection?.sectionId === "pricing"}
            mandatory
            onClick={() => select({ sectionId: "pricing" })}
          />
          <SectionButton
            label="Closing message"
            active={state.selection?.sectionId === "closing"}
            mandatory
            onClick={() => select({ sectionId: "closing" })}
          />
          <SectionButton
            label="Brand footer"
            active={state.selection?.sectionId === "footer"}
            mandatory
            onClick={() => select({ sectionId: "footer" })}
          />
        </nav>
        <main
          ref={stageRef}
          className="min-w-0 overflow-auto bg-[radial-gradient(circle_at_center,_rgb(28_28_28)_0,_rgb(5_5_5)_70%)] p-6"
        >
          <div className="mx-auto w-max pb-32" style={{ zoom: state.zoom }}>
            <QuotationCanvas
              quotation={presentation}
              draft={state.draft}
              mode={state.mode}
              device={state.device}
              selection={state.selection}
              onSelect={select}
              onEdit={edit}
            />
          </div>
        </main>
        <aside className="hidden min-h-0 overflow-hidden border-l border-admin-border lg:block">
          <QuotationInspector
            draft={state.draft}
            assets={assets}
            selection={state.selection}
            onEdit={edit}
          />
        </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 overflow-x-auto border-t border-admin-border bg-admin-elevated p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] lg:hidden">
        {["cover", ...state.draft.sectionOrder, "pricing", "closing"].map(
          (section) => (
            <button
              key={section}
              onClick={() => select({ sectionId: section })}
              className={`min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold ${state.selection?.sectionId === section ? "bg-admin-primary text-white" : "bg-admin-muted text-admin-secondary"}`}
            >
              {sectionLabels[section] ||
                (section === "pricing" ? "Packages" : section)}
            </button>
          ),
        )}
      </div>
      {inspectorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/60 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[82dvh] w-full overflow-hidden rounded-t-2xl border border-admin-border">
            <QuotationInspector
              draft={state.draft}
              assets={assets}
              selection={state.selection}
              onEdit={edit}
              onClose={() => setInspectorOpen(false)}
            />
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

function SectionButton({
  label,
  active,
  mandatory,
  onClick,
}: {
  label: string;
  active: boolean;
  mandatory?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mt-2 flex min-h-12 w-full items-center justify-between rounded-xl border px-3 text-left text-sm font-semibold ${active ? "border-admin-primary bg-admin-primary/15 text-blue-300" : "border-admin-border bg-admin-surface text-admin-secondary"}`}
    >
      <span>{label}</span>
      {mandatory && (
        <span className="text-[10px] uppercase text-admin-subtle">Fixed</span>
      )}
    </button>
  );
}
