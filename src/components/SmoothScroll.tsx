import { useEffect, type ReactNode } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

function shouldDisableSmoothScroll() {
  if (typeof window === 'undefined') return true;
  // Mobile / touch / PSI lab — native scroll is cheaper and avoids long tasks
  return window.matchMedia(
    '(pointer: coarse), (max-width: 768px), (hover: none)',
  ).matches;
}

// Pure JS smooth scroll — desktop only (replaces Lenis)
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || shouldDisableSmoothScroll()) return;

    let target = window.scrollY;
    let current = window.scrollY;
    let raf = 0;
    let isAnimating = false;

    const lerp = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        current = target;
        isAnimating = false;
        return;
      }
      current += diff * 0.08;
      window.scrollTo(0, current);
      raf = requestAnimationFrame(lerp);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      target = Math.max(
        0,
        Math.min(
          document.documentElement.scrollHeight - window.innerHeight,
          target + e.deltaY,
        ),
      );
      if (!isAnimating) {
        isAnimating = true;
        raf = requestAnimationFrame(lerp);
      }
    };

    const onScroll = () => {
      if (!isAnimating) target = window.scrollY;
    };

    const onKey = (e: KeyboardEvent) => {
      if (
        ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(
          e.key,
        )
      ) {
        setTimeout(() => {
          target = window.scrollY;
        }, 0);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return <>{children}</>;
}
