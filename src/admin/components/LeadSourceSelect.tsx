import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import type { EnquirySource } from '../types';
import { LEAD_SOURCE_OPTIONS, leadSourceLabel } from './leadSource';
import { leadSourceMenuPosition, type LeadSourceMenuPosition } from './leadSourceMenu.utils';

type LeadSourceValue = EnquirySource | '';

export function LeadSourceSelect({
  value,
  onChange,
  allowUnrecorded = false,
  labelClassName = 'font-medium',
}: {
  value: LeadSourceValue;
  onChange: (value: LeadSourceValue) => void;
  allowUnrecorded?: boolean;
  labelClassName?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [menuPosition, setMenuPosition] = useState<LeadSourceMenuPosition | null>(null);
  const options = allowUnrecorded
    ? [{ value: '' as const, label: 'Not recorded' }, ...LEAD_SOURCE_OPTIONS]
    : LEAD_SOURCE_OPTIONS;
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));

  const positionMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    let clippingParent = trigger.parentElement;
    while (clippingParent && clippingParent !== document.body) {
      const { overflowY } = window.getComputedStyle(clippingParent);
      if (/(auto|scroll|hidden|clip)/.test(overflowY)) break;
      clippingParent = clippingParent.parentElement;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const boundaryRect = clippingParent && clippingParent !== document.body
      ? clippingParent.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };
    setMenuPosition(leadSourceMenuPosition(
      triggerRect,
      boundaryRect,
      { width: window.innerWidth, height: window.innerHeight },
    ));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    positionMenu();
  }, [open, positionMenu]);

  useEffect(() => {
    if (!open) return;

    window.setTimeout(() => optionRefs.current[selectedIndex]?.focus(), 0);

    const closeOnOutsidePress = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key === 'Tab') {
        setOpen(false);
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

      event.preventDefault();
      const currentIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Home') optionRefs.current[0]?.focus();
      else if (event.key === 'End') optionRefs.current[options.length - 1]?.focus();
      else {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const start = currentIndex < 0 ? selectedIndex : currentIndex;
        optionRefs.current[(start + direction + options.length) % options.length]?.focus();
      }
    };

    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, true);
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', handleKeyboard);
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu, true);
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', handleKeyboard);
    };
  }, [open, options.length, positionMenu, selectedIndex]);

  const select = (nextValue: LeadSourceValue) => {
    onChange(nextValue);
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  return (
    <div ref={rootRef} className={`relative text-sm text-slate-700 ${labelClassName}`}>
      <span id={`${id}-label`}>Came from</span>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-labelledby={`${id}-label ${id}-trigger`}
        onClick={() => setOpen(current => !current)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={`mt-1 flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-3 text-left text-base text-slate-900 outline-none transition ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100'}`}
      >
        <span className="min-w-0 flex-1 truncate">{leadSourceLabel(value)}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={`${id}-options`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          data-placement={menuPosition.placement}
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
          className="fixed z-[80] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value || 'unrecorded'}
                ref={node => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(option.value)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${selected ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700'}`}
              >
                <span className="min-w-0 flex-1">{option.label}</span>
                <Check className={`h-4 w-4 shrink-0 text-blue-600 ${selected ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
