import { useEffect, useRef } from 'react';
import { useInView } from '../../hooks/useScroll';
import { ArrowRight } from 'lucide-react';

export function BookingCTA() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();

  // Parallax background
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = bgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
        el.style.transform = `translateY(${progress * 30}%) scale(${1 + progress * 0.2})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="booking" className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <img
          src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/60 to-ink-950/90" />
      </div>

      <CTAParticles />

      <div ref={ref} className="relative z-10 text-center max-w-3xl mx-auto">
        <div
          className={`section-label mb-6 ${inView ? 'fade-in-up' : ''}`}
          style={{ opacity: inView ? undefined : 0 }}
        >
          Your Story Awaits
        </div>

        <h2
          className={`font-display text-6xl md:text-8xl font-light text-ink-50 leading-[0.95] text-shadow-cinematic ${inView ? 'fade-in-up stagger-2' : ''}`}
          style={{ opacity: inView ? undefined : 0 }}
        >
          Let's create
          <br />
          <span className="italic text-gradient-gold">your story.</span>
        </h2>

        <p
          className={`mt-8 text-lg md:text-xl text-ink-200/80 font-light max-w-xl mx-auto ${inView ? 'fade-in-up stagger-3' : ''}`}
          style={{ opacity: inView ? undefined : 0 }}
        >
          Book a free consultation and let's craft something unforgettable together.
        </p>

        <div
          className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 ${inView ? 'fade-in-up stagger-4' : ''}`}
          style={{ opacity: inView ? undefined : 0 }}
        >
          <button data-cursor="hover" className="btn-primary group">
            <span className="relative z-10 flex items-center gap-2">
              Let's Create Your Story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-300 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
          <button data-cursor="hover" className="btn-ghost">
            Book a Free Consultation
          </button>
        </div>
      </div>
    </section>
  );
}

function CTAParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      vy: -(Math.random() * 0.5 + 0.1),
      a: Math.random() * 0.6 + 0.1,
    }));

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
