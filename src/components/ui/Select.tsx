import { useRef, type AriaAttributes } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = AriaAttributes & {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  compact?: boolean;
  placeholder?: string;
  'data-wizard-autofocus'?: boolean;
};

/** Shared single select, styled after the Tailwind UI listbox. */
export function Select({
  value, onChange, options, id, name, disabled = false, required = false,
  compact = false, className = '', placeholder = 'Select an option', ...buttonProps
}: SelectProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find(option => option.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled} name={name}>
      <ListboxButton
        {...buttonProps}
        ref={buttonRef}
        id={id}
        aria-required={required || undefined}
        className={`grid ${compact ? "min-h-10 py-1.5 text-[13px]" : "min-h-11 py-2 text-sm"} w-full cursor-default grid-cols-1 rounded-md bg-white pl-3 pr-2 text-left font-normal text-gray-900 shadow-sm outline outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:outline-red-500 ${className}`}
      >
        <span className="col-start-1 row-start-1 truncate pr-6">{selected?.label ?? placeholder}</span>
        <ChevronsUpDown aria-hidden="true" className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500" />
      </ListboxButton>
      {required && (
        <select
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          required
          disabled={disabled}
          value={value}
          onChange={event => onChange(event.target.value)}
          onInvalid={event => { event.preventDefault(); buttonRef.current?.focus(); }}
        >
          <option value="" />
          {options.filter(option => option.value !== '').map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
      )}
      <ListboxOptions
        anchor={{ to: 'bottom start', gap: 4, padding: 8 }}
        modal={false}
        transition
        className={`z-[100] ${compact ? "[--anchor-max-height:12rem] text-[13px]" : "text-sm"} max-h-60 w-[var(--button-width)] overflow-auto overscroll-contain rounded-md bg-white py-1 text-gray-900 shadow-lg outline outline-1 outline-black/5 [color-scheme:light] focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in`}
      >
        {options.map(option => (
          <ListboxOption
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={`group relative ${compact ? "min-h-8 py-1.5 max-sm:min-h-10" : "min-h-11 py-2.5"} cursor-default select-none pl-8 pr-4 data-[disabled]:text-gray-400 data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-none`}
          >
            <span className="block truncate font-normal group-data-[selected]:font-semibold">{option.label}</span>
            <span className="absolute inset-y-0 left-0 hidden items-center pl-1.5 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
              <Check aria-hidden="true" className={compact ? "size-4" : "size-5"} />
            </span>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
