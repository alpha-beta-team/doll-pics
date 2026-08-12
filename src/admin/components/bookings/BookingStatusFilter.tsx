import { useEffect, useId, useRef } from 'react';
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import type { BookingStatus } from '../../types';
import {
  BOOKING_STATUSES,
  BOOKING_SORT_OPTIONS,
  bookingStatusDotClass,
  type BookingSort,
} from './bookingList';

type BookingStatusFilterProps = {
  status: BookingStatus | '';
  counts: Record<BookingStatus, number>;
  total: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (status: BookingStatus | '') => void;
  disabled?: boolean;
};

export function BookingStatusFilter({
  status,
  counts,
  total,
  open,
  onOpenChange,
  onChange,
  disabled = false,
}: BookingStatusFilterProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileOptionsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const desktopOptionsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = status
    ? BOOKING_STATUSES.findIndex(item => item.value === status) + 1
    : 0;
  const selectedLabel = status
    ? BOOKING_STATUSES.find(item => item.value === status)?.label ?? 'All'
    : 'All';
  const selectedCount = status ? counts[status] : total;

  useEffect(() => {
    if (!open) return;
    const isDesktop = window.matchMedia('(min-width: 640px)').matches;
    const previousOverflow = document.body.style.overflow;
    if (!isDesktop) document.body.style.overflow = 'hidden';
    const options = isDesktop ? desktopOptionsRef.current : mobileOptionsRef.current;
    window.setTimeout(() => options[selectedIndex]?.focus(), 0);

    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (isDesktop && !rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        triggerRef.current?.focus();
        return;
      }

      const activeOptions = isDesktop ? desktopOptionsRef.current : mobileOptionsRef.current;
      const currentIndex = activeOptions.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const start = currentIndex < 0 ? selectedIndex : currentIndex;
        const next = (start + direction + activeOptions.length) % activeOptions.length;
        activeOptions[next]?.focus();
      }

      if (!isDesktop && event.key === 'Tab' && mobilePanelRef.current) {
        const focusable = Array.from(
          mobilePanelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'),
        );
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
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      if (!isDesktop) document.body.style.overflow = previousOverflow;
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onOpenChange, open, selectedIndex]);

  const selectStatus = (value: BookingStatus | '') => {
    onChange(value);
    onOpenChange(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const closeAndRestoreFocus = () => {
    onOpenChange(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const renderOptions = (refs: typeof mobileOptionsRef, panel: 'mobile' | 'desktop') => (
    <div role="listbox" aria-label="Booking status" aria-activedescendant={`${id}-${panel}-option-${status || 'all'}`} className="space-y-1">
      <button
        ref={node => { refs.current[0] = node; }}
        id={`${id}-${panel}-option-all`}
        type="button"
        role="option"
        aria-selected={!status}
        onClick={() => selectStatus('')}
        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus ${!status ? 'bg-admin-muted font-semibold text-admin-text' : 'text-admin-secondary'}`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-admin-gold" aria-hidden="true" />
        <span className="flex-1">All bookings</span>
        <span className="tabular-nums text-admin-subtle">{total}</span>
        <Check className={`h-4 w-4 text-admin-primary ${!status ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
      </button>
      {BOOKING_STATUSES.map((item, index) => {
        const selected = status === item.value;
        return (
          <button
            key={item.value}
            ref={node => { refs.current[index + 1] = node; }}
            id={`${id}-${panel}-option-${item.value}`}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => selectStatus(item.value)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus ${selected ? 'bg-admin-muted font-semibold text-admin-text' : 'text-admin-secondary'}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${bookingStatusDotClass[item.value]}`} aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            <span className="tabular-nums text-admin-subtle">{counts[item.value]}</span>
            <Check className={`h-4 w-4 text-admin-primary ${selected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:flex-none">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-mobile ${id}-desktop`}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            onOpenChange(true);
          }
        }}
        className="flex h-11 w-full min-w-0 items-center gap-2 rounded-lg px-2.5 text-[13px] font-semibold text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus disabled:opacity-50 sm:w-auto sm:min-w-52 sm:text-sm"
      >
        <span className="min-w-0 flex-1 truncate text-left">{status ? selectedLabel : 'All statuses'}</span>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-admin-muted px-1.5 text-[11px] font-semibold tabular-nums text-admin-subtle">{selectedCount}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div id={`${id}-desktop`} className="absolute left-0 top-full z-50 mt-2 hidden w-80 rounded-2xl border border-admin-border bg-admin-surface p-2 shadow-xl sm:block">
            {renderOptions(desktopOptionsRef, 'desktop')}
            <div className="mt-2 border-t border-admin-border pt-2">
              <button type="button" disabled={!status} onClick={() => selectStatus('')} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:text-admin-subtle disabled:opacity-60">
                <X className="h-4 w-4" aria-hidden="true" />Clear status
              </button>
            </div>
          </div>

          <div
            className="fixed inset-0 z-[90] flex items-end bg-stone-950/45 sm:hidden"
            onMouseDown={event => { if (event.target === event.currentTarget) closeAndRestoreFocus(); }}
          >
            <div ref={mobilePanelRef} id={`${id}-mobile`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-admin-border bg-admin-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-admin-border-strong" aria-hidden="true" />
              <header className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 id={`${id}-title`} className="font-semibold text-admin-text">Booking status</h2>
                  <p className="mt-0.5 text-xs text-admin-subtle">Choose a status to narrow the list.</p>
                </div>
                <button type="button" onClick={closeAndRestoreFocus} aria-label="Close status filter" className="flex h-11 w-11 items-center justify-center rounded-xl text-admin-subtle outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </header>
              {renderOptions(mobileOptionsRef, 'mobile')}
              <button type="button" disabled={!status} onClick={() => selectStatus('')} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-admin-border px-3 text-sm font-semibold text-admin-primary outline-none hover:bg-admin-muted focus-visible:ring-2 focus-visible:ring-admin-focus disabled:cursor-not-allowed disabled:text-admin-subtle disabled:opacity-60">
                <X className="h-4 w-4" aria-hidden="true" />Clear status
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function BookingSortControl({ value, onChange }: { value: BookingSort; onChange: (value: BookingSort) => void }) {
  const selectedLabel = BOOKING_SORT_OPTIONS.find(option => option.value === value)?.label ?? 'Recently created';
  return (
    <>
      <label className="relative block h-11 w-11 shrink-0 rounded-lg text-admin-gold transition hover:bg-admin-muted focus-within:ring-2 focus-within:ring-admin-focus sm:hidden" title={`Sort: ${selectedLabel}`}>
        <span className="sr-only">Sort bookings, currently {selectedLabel}</span>
        <SlidersHorizontal className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
        <select
          value={value}
          onChange={event => onChange(event.target.value as BookingSort)}
          aria-label={`Sort bookings, currently ${selectedLabel}`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {BOOKING_SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="relative hidden shrink-0 sm:block">
        <span className="sr-only">Sort bookings</span>
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-gold" aria-hidden="true" />
        <select
          value={value}
          onChange={event => onChange(event.target.value as BookingSort)}
          className="h-11 min-w-52 appearance-none rounded-lg border-0 bg-transparent py-0 pl-9 pr-8 text-sm font-semibold text-admin-secondary outline-none transition hover:bg-admin-muted hover:text-admin-text focus-visible:ring-2 focus-visible:ring-admin-focus"
        >
          {BOOKING_SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-subtle" aria-hidden="true" />
      </label>
    </>
  );
}
