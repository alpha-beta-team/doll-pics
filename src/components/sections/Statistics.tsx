import { useEffect, useRef } from 'react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView, useCountUp } from '../../hooks/useScroll';

export function Statistics() {
  const { stats } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section className="relative py-32 px-6 lg:px-10 overflow-hidden bg-ink-900">
      <ParticleField />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div ref={ref} className={`text-center mb-20 reveal ${inView ? 'in' : ''}`}>
          <div className="section-label mb-4">By The Numbers</div>
          <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 max-w-3xl mx-auto leading-tight">
            A decade of
            <span className="italic text-gradient-gold"> devotion.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {stats.map((stat, i) => (
            <StatItem key={i} stat={stat} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatItem({ stat, index, inView }: { stat: { value: number; suffix: string; label: string }; index: number; inView: boolean }) {
  const value = useCountUp(stat.value, inView);

  return (
    <div
      className={`text-center reveal ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="font-display text-5xl md:text-6xl font-light text-gradient-gold mb-2">
        {value}{stat.suffix}
      </div>
      <div className="text-xs tracking-widest uppercase text-ink-200/60">{stat.label}</div>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      a: Math.random() * 0.5 + 0.1,
    }));

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 162, 73, ${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
}
