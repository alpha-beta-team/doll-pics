import type { QuotationDraft } from "../types";

export type QuotationCanvasMode = "website" | "pdf";
export type QuotationCanvasDevice = "mobile" | "desktop";
export type QuotationSelection = {
  sectionId: string;
  itemId?: string;
  field?: string;
};

export type QuotationEditorState = {
  draft: QuotationDraft;
  savedDraft: QuotationDraft;
  selection?: QuotationSelection;
  mode: QuotationCanvasMode;
  device: QuotationCanvasDevice;
  zoom: number;
  undoStack: QuotationDraft[];
  redoStack: QuotationDraft[];
};

export type QuotationEditorAction =
  | { type: "edit"; draft: QuotationDraft; selection?: QuotationSelection }
  | { type: "select"; selection?: QuotationSelection }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saved"; draft: QuotationDraft }
  | { type: "mode"; mode: QuotationCanvasMode }
  | { type: "device"; device: QuotationCanvasDevice }
  | { type: "zoom"; zoom: number };

const clone = (draft: QuotationDraft) => structuredClone(draft);
export const draftsEqual = (a: QuotationDraft, b: QuotationDraft) =>
  JSON.stringify(a) === JSON.stringify(b);

export function createQuotationEditorState(
  draft: QuotationDraft,
): QuotationEditorState {
  return {
    draft: clone(draft),
    savedDraft: clone(draft),
    selection: { sectionId: "cover" },
    mode: "website",
    device: "desktop",
    zoom: 0.85,
    undoStack: [],
    redoStack: [],
  };
}

export function quotationEditorReducer(
  state: QuotationEditorState,
  action: QuotationEditorAction,
): QuotationEditorState {
  if (action.type === "edit") {
    if (draftsEqual(state.draft, action.draft))
      return { ...state, selection: action.selection ?? state.selection };
    return {
      ...state,
      draft: clone(action.draft),
      selection: action.selection ?? state.selection,
      undoStack: [...state.undoStack, clone(state.draft)].slice(-50),
      redoStack: [],
    };
  }
  if (action.type === "undo") {
    const previous = state.undoStack[state.undoStack.length - 1];
    if (!previous) return state;
    return {
      ...state,
      draft: clone(previous),
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, clone(state.draft)].slice(-50),
    };
  }
  if (action.type === "redo") {
    const next = state.redoStack[state.redoStack.length - 1];
    if (!next) return state;
    return {
      ...state,
      draft: clone(next),
      undoStack: [...state.undoStack, clone(state.draft)].slice(-50),
      redoStack: state.redoStack.slice(0, -1),
    };
  }
  if (action.type === "saved")
    return {
      ...state,
      draft: clone(action.draft),
      savedDraft: clone(action.draft),
    };
  if (action.type === "select")
    return { ...state, selection: action.selection };
  if (action.type === "mode") return { ...state, mode: action.mode };
  if (action.type === "device") return { ...state, device: action.device };
  if (action.type === "zoom")
    return { ...state, zoom: Math.min(1.25, Math.max(0.35, action.zoom)) };
  return state;
}

export const quotationEditorDirty = (state: QuotationEditorState) =>
  !draftsEqual(state.draft, state.savedDraft);

export type QuotationDraftIssue = { sectionId: string; message: string };

export function validateQuotationCanvasDraft(
  draft: QuotationDraft,
): QuotationDraftIssue[] {
  const issues: QuotationDraftIssue[] = [];
  const phoneDigits = draft.customerPhone
    .replace(/\D/g, "")
    .replace(/^91(?=\d{10}$)/, "");
  if (!draft.coupleNames.trim())
    issues.push({ sectionId: "cover", message: "Couple names are required." });
  if (phoneDigits.length !== 10)
    issues.push({
      sectionId: "cover",
      message: "Enter a valid 10-digit customer phone number.",
    });
  if (
    draft.customerEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customerEmail)
  )
    issues.push({
      sectionId: "cover",
      message: "Enter a valid customer email address.",
    });
  if (!validDateOnly(draft.validUntil))
    issues.push({
      sectionId: "cover",
      message: "Choose a valid quotation date.",
    });
  if (!draft.coverPhotoId)
    issues.push({
      sectionId: "cover",
      message: "Select a published cover photograph.",
    });
  if (!draft.events.length)
    issues.push({
      sectionId: "events",
      message: "Add at least one wedding event.",
    });
  if (draft.events.some((item) => !item.name.trim()))
    issues.push({
      sectionId: "events",
      message: "Every wedding event needs a name.",
    });
  if (!draft.options.length || draft.options.length > 3)
    issues.push({
      sectionId: "pricing",
      message: "Add one to three package options.",
    });
  if (draft.options.some((item) => !item.name.trim() || !item.lineItems.length))
    issues.push({
      sectionId: "pricing",
      message: "Every package needs a name and at least one pricing line.",
    });
  if (draft.options.filter((item) => item.recommended).length > 1)
    issues.push({
      sectionId: "pricing",
      message: "Only one package may be recommended.",
    });
  const paymentTotal =
    Math.round(
      draft.paymentMilestones.reduce(
        (sum, item) => sum + Number(item.percentage),
        0,
      ) * 100,
    ) / 100;
  if (!draft.paymentMilestones.length || paymentTotal !== 100)
    issues.push({
      sectionId: "payments",
      message: "Payment milestones must total 100%.",
    });
  if (!draft.terms.trim())
    issues.push({
      sectionId: "terms",
      message: "Quotation terms are required.",
    });
  return issues;
}

function validDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
