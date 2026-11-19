import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type InputComponentProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  shortcut?: ReactNode;
  containerClassName?: string;
};

export function InputComponent({
  label = 'Quick search',
  shortcut = '⌘K',
  id,
  name = 'search',
  type = 'text',
  className = '',
  containerClassName = '',
  disabled,
  ...inputProps
}: InputComponentProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className="block text-sm/6 font-medium text-gray-900">
        {label}
      </label>
      <div className="mt-2">
        <div className={`flex rounded-md bg-white outline outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600 ${disabled ? 'bg-gray-100 opacity-60' : ''}`}>
          <input
            {...inputProps}
            id={inputId}
            name={name}
            type={type}
            disabled={disabled}
            className={`block min-w-0 grow rounded-md bg-transparent px-3 py-1.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed sm:text-sm/6 ${className}`}
          />
          {shortcut && (
            <div className="flex py-1.5 pr-1.5">
              <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">
                {shortcut}
              </kbd>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InputComponent;
