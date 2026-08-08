import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertCircle, Inbox, Loader2, X, type LucideIcon } from 'lucide-react';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-admin-gold">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-admin-text sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-admin-subtle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'border-admin-primary bg-admin-primary text-white hover:border-admin-primary-hover hover:bg-admin-primary-hover',
  secondary: 'border-admin-border-strong bg-admin-surface text-admin-secondary hover:border-admin-primary/40 hover:bg-admin-muted hover:text-admin-text',
  quiet: 'border-transparent bg-transparent text-admin-secondary hover:bg-admin-muted hover:text-admin-text',
  danger: 'border-red-700 bg-red-700 text-white hover:bg-red-800',
};

export function AdminButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus focus-visible:ring-offset-2 focus-visible:ring-offset-admin-canvas disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminIconButton({
  label,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-admin-border bg-admin-surface text-admin-secondary outline-none transition hover:border-admin-primary/40 hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function AdminCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`rounded-2xl border border-admin-border bg-admin-surface shadow-[0_10px_30px_rgba(62,56,46,0.04)] ${className}`} />;
}

export function AdminFilterBar({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`rounded-2xl border border-admin-border bg-admin-surface p-3 shadow-sm sm:p-4 ${className}`} />;
}

export function AdminTableSurface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface shadow-sm ${className}`} />;
}

export const adminFieldClass = 'mt-1 min-h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-text outline-none transition placeholder:text-admin-subtle focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/20 disabled:bg-admin-muted disabled:text-admin-subtle';

export function AdminField({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold text-admin-secondary">
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-700">{error}</span> : hint ? <span className="mt-1 block text-xs font-normal text-admin-subtle">{hint}</span> : null}
    </label>
  );
}

export function AdminBadge({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={`inline-flex items-center rounded-full bg-admin-muted px-2.5 py-1 text-xs font-semibold text-admin-secondary ${className}`} />;
}

export function AdminAlert({
  tone = 'danger',
  children,
}: {
  tone?: 'danger' | 'success' | 'warning' | 'info';
  children: ReactNode;
}) {
  const styles = {
    danger: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
  }[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border p-4 text-sm ${styles}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function AdminLoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-admin-subtle" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-admin-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-admin-border-strong bg-admin-surface px-5 py-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-admin-muted text-admin-primary"><Icon className="h-5 w-5" /></span>
      <h2 className="mt-3 font-semibold text-admin-text">{title}</h2>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-admin-subtle">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
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
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-end bg-stone-950/50 sm:items-center sm:justify-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-admin-border bg-admin-surface shadow-2xl sm:rounded-2xl ${maxWidth}`}
      >
        <header className="flex items-start gap-4 border-b border-admin-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-admin-text">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-admin-subtle">{description}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close dialog" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-admin-subtle outline-none hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-admin-border bg-admin-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer>}
      </div>
    </div>
  );
}
