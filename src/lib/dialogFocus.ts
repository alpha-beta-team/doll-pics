/** Focus containment for a mounted public dialog; returns its cleanup function. */
export function containDialogFocus(dialog: HTMLElement) {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'));
  const focusFirst = () => (controls()[0] ?? dialog).focus();
  focusFirst();
  const onFocus = (event: FocusEvent) => {
    if (!dialog.contains(event.target as Node)) focusFirst();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = controls();
    const first = items[0] ?? dialog;
    const last = items[items.length - 1] ?? dialog;
    if (!items.length || (event.shiftKey && document.activeElement === first) ||
      (!event.shiftKey && document.activeElement === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
  document.addEventListener('focusin', onFocus);
  dialog.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('focusin', onFocus);
    dialog.removeEventListener('keydown', onKey);
    if (previous?.isConnected) previous.focus();
  };
}
