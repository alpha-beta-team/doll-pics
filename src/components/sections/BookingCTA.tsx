import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInView } from '../../hooks/useScroll';
import { ArrowRight, MessageCircle } from 'lucide-react';
import {
  EnquiryModal,
  type EnquiryPrefill,
} from '../EnquiryModal';
import {
  DEFAULT_SHOOT_TYPE,
  SHOOT_TYPE_OPTIONS,
  type ShootTypeOption,
} from '../../lib/shootTypes';
import { getGoldGlowRgb } from '../../lib/theme';
import { enquiryWhatsAppUrl } from '../../lib/pricing';
import { useSiteData } from '../../contexts/SiteDataContext';
import { trackWhatsAppClick } from '../../lib/analytics';

export type { EnquiryPrefill };

function resolveShootType(raw: string | null): ShootTypeOption {
  if (!raw) return DEFAULT_SHOOT_TYPE;
  const match = SHOOT_TYPE_OPTIONS.find(
    t => t.toLowerCase() === raw.trim().toLowerCase(),
  );
  return match ?? DEFAULT_SHOOT_TYPE;
}

export function BookingCTA() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const [showForm, setShowForm] = useState(false);
  const [prefill, setPrefill] = useState<EnquiryPrefill | undefined>();
  const { siteContent } = useSiteData();
  const whatsappUrl = enquiryWhatsAppUrl(siteContent.whatsapp);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryConsumed = useRef(false);

  useEffect(() => {
    if (queryConsumed.current) return;
    const packageName = searchParams.get('package')?.trim() || '';
    const shootTypeParam = searchParams.get('shootType');
    if (!packageName && !shootTypeParam) return;

    queryConsumed.current = true;
    const shootType = resolveShootType(shootTypeParam);
    setPrefill({
      packageName: packageName || undefined,
      shootType,
      preferredEvent: packageName || undefined,
      message: packageName
        ? `I'm interested in the "${packageName}" package.`
        : undefined,
    });
    setShowForm(true);
    navigate('/booking', { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    // Skip parallax on mobile — PSI / touch devices don't need it
    if (window.matchMedia('(pointer: coarse), (max-width: 768px)').matches) {
      return;
    }
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

  const openForm = () => {
    setPrefill(undefined);
    setShowForm(true);
  };

  const openWhatsApp = () => {
    trackWhatsAppClick({ cta_location: 'booking_page' });
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="booking" className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <img
          src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp"
          alt="Couple portrait — book a photography session with DOLL PICTURES"
          width={800}
          height={450}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      <CTAParticles />

      <div ref={ref} className="relative z-10 text-center max-w-3xl mx-auto">
        <div
          className={`section-label mb-6 ${inView ? 'fade-in-up' : ''}`}
          style={{ opacity: inView ? undefined : 0.001 }}
        >
          Your Story Awaits
        </div>

        <h2
          className={`font-display text-6xl md:text-8xl font-light text-white leading-[0.95] text-shadow-cinematic ${inView ? 'fade-in-up stagger-2' : ''}`}
          style={{ opacity: inView ? undefined : 0.001 }}
        >
          Let's create
          <br />
          <span className="italic text-gradient-gold">your story.</span>
        </h2>

        <p
          className={`mt-8 text-lg md:text-xl text-white/80 font-light max-w-xl mx-auto ${inView ? 'fade-in-up stagger-3' : ''}`}
          style={{ opacity: inView ? undefined : 0.001 }}
        >
          Book a free consultation and let's craft something unforgettable together.
        </p>

        <div
          className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 ${inView ? 'fade-in-up stagger-4' : ''}`}
          style={{ opacity: inView ? undefined : 0.001 }}
        >
          <button data-cursor="hover" className="btn-primary group" onClick={openForm}>
            <span className="relative z-10 flex items-center gap-2">
              Let's Create Your Story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-300 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
          <button
            data-cursor="hover"
            type="button"
            className="btn-ghost !text-white !border-white/20 hover:!border-gold-400/60"
            onClick={openWhatsApp}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </span>
          </button>
        </div>
      </div>

      {showForm && (
        <EnquiryModal
          prefill={prefill}
          onClose={() => {
            setShowForm(false);
            setPrefill(undefined);
          }}
        />
      )}
    </section>
  );
}

function CTAParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Continuous canvas RAF is expensive — skip on mobile / PSI
    if (window.matchMedia('(pointer: coarse), (max-width: 768px)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    let visible = false;
    let raf = 0;

    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.5,
      vy: -(Math.random() * 0.5 + 0.1),
      a: Math.random() * 0.6 + 0.1,
    }));

    const render = () => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      const [gr, gg, gb] = getGoldGlowRgb().split(/\s+/);
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${p.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(render);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { rootMargin: '50px' },
    );
    io.observe(canvas);

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-60"
      aria-hidden
    />
  );
}
