import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CornerDownLeft,
  Mail,
  Search,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import type { AdminSearchItem, AdminSearchResponse } from '../types';
import {
  flattenSearchResults,
  isAbortError,
  searchResultDestination,
  searchResultGroups,
} from './globalSearch.utils';

type SearchState = 'idle' | 'loading' | 'success' | 'error';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AdminSearchResponse | null>(null);
  const [state, setState] = useState<SearchState>('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryVersion, setRetryVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const results = useMemo(() => flattenSearchResults(response), [response]);
  const groups = useMemo(() => searchResultGroups(response), [response]);

  const show = useCallback(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResponse(null);
    setState('idle');
    setActiveIndex(-1);
    window.setTimeout(() => restoreFocusRef.current?.focus(), 0);
  }, []);

  const openResult = useCallback((item: AdminSearchItem) => {
    navigate(searchResultDestination(item));
    close();
  }, [close, navigate]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [show]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResponse(null);
      setState('idle');
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setResponse(null);
    setState('loading');
    setActiveIndex(-1);
    const timeout = window.setTimeout(async () => {
      try {
        const nextResponse = await api.searchAdmin(trimmed, controller.signal);
        setResponse(nextResponse);
        setState('success');
        setActiveIndex(nextResponse.total > 0 ? 0 : -1);
      } catch (error) {
        if (isAbortError(error)) return;
        setResponse(null);
        setState('error');
        setActiveIndex(-1);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query, retryVersion]);

  useEffect(() => {
    const active = results[activeIndex];
    if (!open || !active) return;
    document.getElementById(`global-search-option-${active.type}-${active.id}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, results]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActiveIndex(index => index < results.length - 1 ? index + 1 : 0);
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActiveIndex(index => index > 0 ? index - 1 : results.length - 1);
    } else if (event.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      openResult(results[activeIndex]);
    }
  };

  const handlePanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ));
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

  let runningIndex = -1;

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="hidden h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white md:flex"
        aria-haspopup="dialog"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search customer or phone</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={show}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] text-slate-500 hover:bg-slate-100 md:hidden"
        aria-label="Search customers, enquiries and bookings"
        aria-haspopup="dialog"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex bg-slate-950/55 sm:items-start sm:justify-center sm:p-6 sm:pt-[10vh]"
          onMouseDown={event => { if (event.target === event.currentTarget) close(); }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-search-title"
            className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[75vh] sm:max-w-2xl sm:rounded-2xl"
            onKeyDown={handlePanelKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 p-3 sm:p-4">
              <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <h2 id="global-search-title" className="sr-only">Search daily work</h2>
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-label="Search customer or phone"
                aria-autocomplete="list"
                aria-expanded={results.length > 0}
                aria-controls="global-search-results"
                aria-activedescendant={activeIndex >= 0 && results[activeIndex]
                  ? `global-search-option-${results[activeIndex].type}-${results[activeIndex].id}`
                  : undefined}
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search customer or phone"
                className="h-12 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close search"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div id="global-search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {query.trim().length < 2 && (
                <SearchMessage title="Find daily work" text="Type at least 2 characters from a customer name or phone number." />
              )}
              {query.trim().length >= 2 && state === 'loading' && (
                <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500" role="status">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Searching…
                </div>
              )}
              {state === 'error' && (
                <div className="flex flex-col items-center p-10 text-center" role="alert">
                  <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-900">Search could not be completed</p>
                  <p className="mt-1 text-sm text-slate-500">Check the connection and try again.</p>
                  <button type="button" onClick={() => setRetryVersion(value => value + 1)} className="mt-4 h-11 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">Try again</button>
                </div>
              )}
              {state === 'success' && response?.total === 0 && (
                <SearchMessage title="No matching records" text={`No enquiries or bookings match “${response.query}”.`} />
              )}
              {state === 'success' && groups.map(group => (
                <section key={group.label} className="mb-5 last:mb-0" aria-labelledby={`global-search-${group.label.toLocaleLowerCase()}`}>
                  <h3 id={`global-search-${group.label.toLocaleLowerCase()}`} className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-slate-500">{group.label}</h3>
                  <div className="space-y-1">
                    {group.items.map(item => {
                      runningIndex += 1;
                      const index = runningIndex;
                      return (
                        <SearchResultRow
                          key={`${item.type}-${item.id}`}
                          item={item}
                          active={activeIndex === index}
                          onActivate={() => setActiveIndex(index)}
                          onOpen={() => openResult(item)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="hidden items-center gap-4 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex">
              <span>↑↓ Navigate</span><span className="flex items-center gap-1"><CornerDownLeft className="h-3.5 w-3.5" /> Open</span><span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchMessage({ title, text }: { title: string; text: string }) {
  return <div className="p-12 text-center"><p className="font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}

function SearchResultRow({ item, active, onActivate, onOpen }: {
  item: AdminSearchItem;
  active: boolean;
  onActivate: () => void;
  onOpen: () => void;
}) {
  const Icon = item.type === 'enquiry' ? Mail : CalendarDays;
  const details = [item.phone, item.service, item.location].filter(Boolean).join(' · ');
  return (
    <button
      id={`global-search-option-${item.type}-${item.id}`}
      type="button"
      role="option"
      aria-selected={active}
      onMouseMove={onActivate}
      onFocus={onActivate}
      onClick={onOpen}
      className={`flex min-h-16 w-full items-center gap-3 rounded-xl p-3 text-left outline-none transition-colors ${active ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50 focus-visible:bg-blue-50'}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.type === 'enquiry' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{item.customerName || 'Unnamed customer'}</span><span className="mt-0.5 block truncate text-sm text-slate-500">{details || item.email || 'No additional details'}</span></span>
      <span className="shrink-0 text-right"><span className="block rounded-full bg-white px-2 py-1 text-[11px] font-semibold capitalize text-slate-600">{item.status.replace(/_/g, ' ')}</span>{item.relevantDate && <span className="mt-1 block text-[11px] text-slate-400">{formatSearchDate(item.relevantDate)}</span>}</span>
    </button>
  );
}

function formatSearchDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
