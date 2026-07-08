import { useRef, useState, useCallback, useEffect } from 'react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { MoveHorizontal } from 'lucide-react';

export function BeforeAfter() {
  const { beforeAfter } = useSiteData();
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const { ref: headingRef, inView } = useInView<HTMLDivElement>();

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) updatePos(e.clientX); };
    const onTouch = (e: TouchEvent) => { if (dragging.current && e.touches[0]) updatePos(e.touches[0].clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouch);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [updatePos]);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 lg:px-10 bg-ink-900 overflow-hidden">
      <div ref={headingRef} className={`max-w-7xl mx-auto mb-16 text-center reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">The Craft</div>
        <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 max-w-3xl mx-auto leading-tight">
          From raw to
          <span className="italic text-gradient-gold"> remarkable.</span>
        </h2>
        <p className="mt-6 text-ink-200/70 max-w-xl mx-auto">
          Drag the slider to see the difference professional color grading and retouching makes.
        </p>
      </div>

      <div
        ref={containerRef}
        data-cursor="drag"
        onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
        onTouchStart={(e) => { dragging.current = true; if (e.touches[0]) updatePos(e.touches[0].clientX); }}
        className={`relative max-w-5xl mx-auto aspect-[16/10] rounded-2xl overflow-hidden cursor-ew-resize select-none reveal-scale ${inView ? 'in' : ''}`}
      >
        <img src={beforeAfter.after} alt="After" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <span className="absolute top-5 right-5 px-3 py-1.5 glass rounded-full text-[10px] tracking-widest uppercase text-gold-300 z-10">
          Edited
        </span>

        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <img
            src={beforeAfter.before}
            alt="Before"
            className="absolute inset-0 h-full object-cover"
            style={{ width: containerRef.current?.clientWidth || '100%', maxWidth: 'none' }}
            loading="lazy"
          />
          <span className="absolute top-5 left-5 px-3 py-1.5 glass rounded-full text-[10px] tracking-widest uppercase text-ink-200">
            Original
          </span>
        </div>

        <div className="absolute top-0 bottom-0 w-px bg-gold-400 z-20 pointer-events-none" style={{ left: `${pos}%` }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-strong flex items-center justify-center text-gold-400 shadow-xl">
            <MoveHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
