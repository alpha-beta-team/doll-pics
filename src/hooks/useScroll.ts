import { useEffect, useRef, useState, useCallback } from 'react';

// Tracks whether an element is in the viewport (replaces framer-motion's useInView)
export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px', ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, inView };
}

// Tracks scroll progress of an element through the viewport (replaces framer-motion's useScroll)
// Returns a ref and a progress value 0..1
export function useScrollProgress<T extends HTMLElement>(
  offsetStart: 'start' | 'center' | 'end' = 'start',
  offsetEnd: 'start' | 'center' | 'end' = 'end'
) {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calc = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const startMap = { start: 0, center: vh / 2, end: vh };
      const startY = startMap[offsetStart];

      // Total scroll range: from when element's top hits startY to when element's bottom hits endY
      const totalRange = rect.height + vh;
      const scrolled = startY - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / totalRange));
      setProgress(p);
    };

    calc();
    window.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc);
    return () => {
      window.removeEventListener('scroll', calc);
      window.removeEventListener('resize', calc);
    };
  }, [offsetStart, offsetEnd]);

  return { ref, progress };
}

// Smooth scroll to an element
export function scrollToSection(href: string) {
  const el = document.querySelector(href);
  el?.scrollIntoView({ behavior: 'smooth' });
}

// Count-up animation hook
export function useCountUp(target: number, active: boolean, duration = 2000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);

  return value;
}

// Mouse position relative to element (for tilt effects)
export function useMousePosition<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }, []);

  const handleLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return { ref, pos, handleMove, handleLeave };
}
