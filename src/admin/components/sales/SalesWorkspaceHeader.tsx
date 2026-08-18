import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { serviceCategoryTabId, type ServiceCategoryOption } from './serviceCategories';

type SalesWorkspaceHeaderProps = {
  title: string;
  actions: ReactNode;
  listControls: ReactNode;
  serviceCategories: ServiceCategoryOption[];
  serviceCategory: string;
  onServiceCategoryChange: (value: string) => void;
  panelId: string;
  readOnlyNotice?: ReactNode;
};

export function SalesWorkspaceHeader({
  title,
  actions,
  listControls,
  serviceCategories,
  serviceCategory,
  onServiceCategoryChange,
  panelId,
  readOnlyNotice,
}: SalesWorkspaceHeaderProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveServiceFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? serviceCategories.length - 1 : index - 1;
    else if (event.key === 'ArrowRight') nextIndex = index === serviceCategories.length - 1 ? 0 : index + 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = serviceCategories.length - 1;
    else return;

    event.preventDefault();
    const next = serviceCategories[nextIndex];
    if (!next) return;
    onServiceCategoryChange(next.value);
    const node = tabRefs.current[nextIndex];
    node?.focus({ preventScroll: true });
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <header className="rounded-2xl border border-admin-border bg-admin-surface shadow-[0_4px_18px_rgba(62,56,46,0.04)]">
      <div className="flex flex-col justify-between gap-3 px-3 py-3 sm:px-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight text-admin-text">{title}</h1>
          {readOnlyNotice}
        </div>
        <div className="min-w-0 xl:shrink-0">{actions}</div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t border-admin-border px-2 py-2 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden shrink-0 px-1 text-[11px] font-bold uppercase tracking-[0.13em] text-admin-subtle sm:inline">Service</span>
          <div className="min-w-0 flex-1 overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div role="tablist" aria-label="Filter by photography service" className="flex min-w-max items-center gap-1.5">
              {serviceCategories.map((category, index) => {
                const selected = serviceCategory === category.value;
                return (
                  <button
                    key={category.value || 'all'}
                    ref={node => { tabRefs.current[index] = node; }}
                    id={serviceCategoryTabId(category.value)}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => onServiceCategoryChange(category.value)}
                    onKeyDown={event => moveServiceFocus(event, index)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-admin-focus sm:min-h-9 ${selected ? 'border-admin-primary bg-admin-primary text-white shadow-sm' : 'border-admin-border bg-admin-surface text-admin-secondary hover:border-admin-primary/35 hover:bg-admin-muted hover:text-admin-text'}`}
                  >
                    <span>{category.label}</span>
                    <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] tabular-nums ${selected ? 'bg-white/20 text-white' : 'bg-admin-muted text-admin-subtle'}`}>{category.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">
          {listControls}
        </div>
      </div>
    </header>
  );
}
