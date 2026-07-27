import { useEffect } from 'react';

/** Enables the lightweight branded cursor on desktop fine-pointer devices. */
export function CustomCursor() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const syncCursor = () => {
      document.body.classList.toggle(
        'custom-cursor-active',
        finePointer.matches,
      );
    };

    syncCursor();
    if (typeof finePointer.addEventListener === 'function') {
      finePointer.addEventListener('change', syncCursor);
    } else {
      finePointer.addListener(syncCursor);
    }

    return () => {
      document.body.classList.remove('custom-cursor-active');
      if (typeof finePointer.removeEventListener === 'function') {
        finePointer.removeEventListener('change', syncCursor);
      } else {
        finePointer.removeListener(syncCursor);
      }
    };
  }, []);

  return null;
}
