import { useEffect, useRef, useState } from 'react';
import { storyScenes } from '../../data/content';

export function ScrollStorytelling() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = el.offsetHeight - window.innerHeight;
        const scrolled = Math.max(0, -rect.top);
        setProgress(Math.max(0, Math.min(1, scrolled / total)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={ref} className="relative" style={{ height: `${storyScenes.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {storyScenes.map((scene, i) => {
          const start = i / storyScenes.length;
          const end = (i + 1) / storyScenes.length;

          // Calculate opacity/scale/blur based on progress
          let opacity = 0, scale = 1.15, textY = 80, textOpacity = 0, blur = 12;

          if (progress >= start && progress <= end) {
            const local = (progress - start) / (end - start); // 0..1 within this scene
            if (local < 0.5) {
              const t = local / 0.5; // 0..1 first half
              opacity = t;
              scale = 1.15 - t * 0.15;
              textY = 80 - t * 80;
              textOpacity = t;
              blur = 12 - t * 12;
            } else {
              const t = (local - 0.5) / 0.5; // 0..1 second half
              opacity = 1 - t;
              scale = 1 + t * 0.1;
              textY = -t * 80;
              textOpacity = 1 - t;
              blur = t * 8;
            }
          }

          return (
            <div key={i} className="absolute inset-0">
              <div
                className="absolute inset-0 transition-none"
                style={{ opacity, transform: `scale(${scale})`, filter: `blur(${blur}px)` }}
              >
                <img src={scene.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-ink-950/50" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-950/60" />
              </div>

              <div
                className="relative z-10 h-full flex items-center justify-center px-6"
                style={{ opacity: textOpacity, transform: `translateY(${textY}px)` }}
              >
                <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-center text-ink-50 text-shadow-cinematic max-w-4xl leading-tight">
                  {scene.text}
                </h2>
              </div>
            </div>
          );
        })}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-ink-300/10">
          <div
            className="h-full bg-gradient-to-r from-gold-300 to-gold-500 origin-left transition-none"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
    </section>
  );
}
