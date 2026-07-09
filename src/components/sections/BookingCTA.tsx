import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from '../../hooks/useScroll';
import { ArrowRight, X } from 'lucide-react';
import { publicApi } from '../../lib/api';

export function BookingCTA() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView<HTMLDivElement>();
  const [showForm, setShowForm] = useState(false);

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
          alt="Couple portrait — book a photography session with DOLL PICTURES"
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
          <button data-cursor="hover" className="btn-primary group" onClick={() => setShowForm(true)}>
            <span className="relative z-10 flex items-center gap-2">
              Let's Create Your Story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-300 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
          <button data-cursor="hover" className="btn-ghost" onClick={() => setShowForm(true)}>
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
  const [shootType, setShootType] = useState('Wedding');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await publicApi.createEnquiry({ name, email, phone, shootType, message });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send enquiry');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-200 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        {status === 'success' ? (
          <div className="text-center py-8">
            <h3 className="font-display text-2xl text-ink-50 mb-2">Thank you!</h3>
            <p className="text-ink-200/70">We'll be in touch shortly.</p>
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
                className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
              <select
                value={shootType}
                onChange={e => setShootType(e.target.value)}
                className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-lg text-ink-50 focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                {['Wedding', 'Pre-Wedding', 'Portrait', 'Maternity', 'Commercial', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <textarea
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us about your event..."
                rows={4}
                className="w-full px-4 py-3 bg-ink-950 border border-white/10 rounded-lg text-ink-50 placeholder:text-ink-300/40 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
              />
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
                className="w-full py-3 bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950 font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
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
