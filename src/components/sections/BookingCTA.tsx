import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useScroll';
import { ArrowRight, X } from 'lucide-react';
import { publicApi } from '../../lib/api';
import {
  trackBookingStart,
  trackEmailCapture,
  trackGenerateLead,
} from '../../lib/analytics';
import {
  DEFAULT_SHOOT_TYPE,
  SHOOT_TYPE_OPTIONS,
  type ShootTypeOption,
} from '../../lib/shootTypes';
import { getGoldGlowRgb } from '../../lib/theme';

export function BookingCTA() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const [showForm, setShowForm] = useState(false);

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

  const openForm = () => setShowForm(true);

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
            className="btn-ghost !text-white !border-white/20 hover:!border-gold-400/60"
            onClick={openForm}
          >
            Book a Free Consultation
          </button>
        </div>
      </div>

      {showForm && <EnquiryModal onClose={() => setShowForm(false)} />}
    </section>
  );
}

function EnquiryModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shootType, setShootType] = useState(DEFAULT_SHOOT_TYPE);
  const [message, setMessage] = useState('');
  const [tipsOptIn, setTipsOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedTipsOptIn, setSubmittedTipsOptIn] = useState(false);
  // One booking_start per modal open (not per field change).
  const bookingStartSent = useRef(false);
  const leadSent = useRef(false);
  const emailCaptureSent = useRef(false);

  useEffect(() => {
    if (bookingStartSent.current) return;
    bookingStartSent.current = true;
    trackBookingStart({ service_name: shootType });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on open with initial shoot type
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    const messageWithOptIn = tipsOptIn
      ? `${message.trim()}\n\n[Tips email: yes]`
      : message;
    try {
      await publicApi.createEnquiry({
        name,
        email,
        phone,
        shootType,
        message: messageWithOptIn,
      });
      setSubmittedTipsOptIn(tipsOptIn);
      setStatus('success');
      if (!leadSent.current) {
        leadSent.current = true;
        trackGenerateLead({
          method: 'booking_form',
          service_name: shootType,
        });
      }
      if (tipsOptIn && !emailCaptureSent.current) {
        emailCaptureSent.current = true;
        trackEmailCapture({
          method: 'booking_form',
          service_name: shootType,
        });
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send enquiry');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-hairline/10 rounded-2xl w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking form"
          className="absolute top-4 right-4 text-ink-200 hover:text-ink-50"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-8">
            <h3 className="font-display text-2xl text-ink-50 mb-2">Thank you!</h3>
            <p className="text-ink-200/70">We'll be in touch shortly.</p>
            {submittedTipsOptIn ? (
              <p className="mt-3 text-sm text-ink-200/60">
                Shoot-prep tips will also go to your email.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl text-ink-50 mb-6">Book a Consultation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                className="w-full px-4 py-3 bg-ink-950 border border-hairline/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                aria-label="Email"
                className="w-full px-4 py-3 bg-ink-950 border border-hairline/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                aria-label="Phone (optional)"
                className="w-full px-4 py-3 bg-ink-950 border border-hairline/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <select
                value={shootType}
                onChange={e => setShootType(e.target.value as ShootTypeOption)}
                aria-label="Shoot type"
                className="w-full px-4 py-3 bg-ink-950 border border-hairline/10 rounded-lg text-ink-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                {SHOOT_TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your event..."
                aria-label="Tell us about your event"
                rows={4}
                className="w-full px-4 py-3 bg-ink-950 border border-hairline/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
              />
              <label className="flex items-start gap-3 text-left text-sm text-ink-200/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tipsOptIn}
                  onChange={e => setTipsOptIn(e.target.checked)}
                  className="mt-1 rounded border-hairline/20 bg-ink-950 text-gold-400 focus:ring-gold-400"
                />
                <span>
                  Email me shoot-prep tips for Erode / Tamil Nadu sessions
                </span>
              </label>
              {status === 'error' && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
              <p className="text-xs leading-relaxed text-ink-200/50">
                By submitting, you agree to our{' '}
                <Link
                  to="/terms"
                  className="text-gold-400/80 underline-offset-2 hover:text-gold-300 hover:underline"
                  onClick={onClose}
                >
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link
                  to="/privacy"
                  className="text-gold-400/80 underline-offset-2 hover:text-gold-300 hover:underline"
                  onClick={onClose}
                >
                  Privacy Policy
                </Link>
                .
              </p>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 bg-gradient-to-r from-gold-300 to-gold-500 text-on-gold font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {status === 'sending' ? 'Sending...' : 'Send Enquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
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
