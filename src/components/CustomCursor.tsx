import { useEffect, useRef, useState } from 'react';

type Variant = 'default' | 'hover' | 'view' | 'drag';

export function CustomCursor() {
  const [variant, setVariant] = useState<Variant>('default');
  const [hidden, setHidden] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setHidden(true);
      return;
    }

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let raf = 0;

    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(animate);
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-cursor="view"]')) setVariant('view');
      else if (t.closest('[data-cursor="drag"]')) setVariant('drag');
      else if (t.closest('a, button, [data-cursor="hover"]')) setVariant('hover');
      else setVariant('default');
    };

    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (hidden) return null;

  const sizes: Record<Variant, number> = { default: 12, hover: 56, view: 80, drag: 64 };
  const size = sizes[variant];
  const showLabel = variant === 'view' || variant === 'drag';

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] flex items-center justify-center"
        style={{ willChange: 'transform' }}
      >
        <div
          className="rounded-full border flex items-center justify-center transition-all duration-300"
          style={{
            width: size,
            height: size,
            borderColor: variant === 'default' ? 'rgba(212,162,73,0.6)' : 'rgba(212,162,73,0.9)',
            backgroundColor: variant === 'default' ? 'rgba(212,162,73,0.15)' : 'rgba(212,162,73,0.05)',
          }}
        >
          {showLabel && (
            <span className="text-[9px] tracking-widest uppercase text-gold-300 font-medium">
              {variant === 'view' ? 'View' : 'Drag'}
            </span>
          )}
        </div>
      </div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-1.5 h-1.5 rounded-full bg-gold-400 transition-opacity duration-300"
        style={{ willChange: 'transform', opacity: variant === 'default' ? 1 : 0 }}
      />
    </>
  );
}
