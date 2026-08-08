import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import {
  ConfirmDialogContext,
  type ConfirmDialogOptions,
  type ConfirmDialogRequest,
} from '../hooks/useConfirmDialog';

type PendingDialog = {
  options: ConfirmDialogOptions;
  resolve: (confirmed: boolean) => void;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<PendingDialog | null>(null);
  const dialogRef = useRef<PendingDialog | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback((confirmed: boolean) => {
    const pending = dialogRef.current;
    if (!pending) return;
    dialogRef.current = null;
    setDialog(null);
    pending.resolve(confirmed);
  }, []);

  const confirm = useCallback<ConfirmDialogRequest>((options) => new Promise((resolve) => {
    // A second request should never strand the promise for the dialog already on screen.
    if (dialogRef.current) dialogRef.current.resolve(false);
    const pending = { options, resolve };
    dialogRef.current = pending;
    setDialog(pending);
  }), []);

  useEffect(() => {
    if (!dialog) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(false);
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [close, dialog]);

  useEffect(() => () => {
    dialogRef.current?.resolve(false);
  }, []);

  const options = dialog?.options;
  const isDanger = options?.variant === 'danger';

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close(false);
          }}
        >
          <div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={options.description ? 'confirm-dialog-description' : undefined}
            className="w-full max-w-md rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-[0_24px_70px_rgba(35,31,27,0.24)]"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                {isDanger
                  ? <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  : <HelpCircle className="h-5 w-5" aria-hidden="true" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
                  {options.title}
                </h2>
                {options.description && (
                  <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
                    {options.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => close(false)}
                className="-mr-2 -mt-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={() => close(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDanger ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}`}
              >
                {options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
