import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';

function shouldDisableSmoothScroll() {
  if (typeof window === 'undefined') return true;
  // Mobile / touch / PSI lab — native scroll is cheaper and avoids long tasks
  return window.matchMedia(
    '(pointer: coarse), (max-width: 768px), (hover: none)',
  ).matches;
}

/** Let modals / overflow panels use native wheel scroll. */
function isInsideNativeScrollTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  let node: Element | null = target;
  while (node && node !== document.documentElement) {
    if (node.hasAttribute('data-smooth-scroll-ignore')) return true;
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

// Pure JS smooth scroll — desktop only (replaces Lenis)
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const { pathname } = useLocation();

  // Always jump to top on route change (SPA keeps prior scroll otherwise).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (reduced || shouldDisableSmoothScroll()) return;

    let target = 0;
    let current = 0;
    let raf = 0;
    let isAnimating = false;

    window.scrollTo(0, 0);

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
      if (isInsideNativeScrollTarget(e.target)) return;
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
  }, [reduced, pathname]);

  return <>{children}</>;
}
