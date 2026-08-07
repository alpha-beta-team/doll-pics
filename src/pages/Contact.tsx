import { useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomCursor } from '../components/CustomCursor';
import { Navbar } from '../components/Navbar';
import { SmoothScroll } from '../components/SmoothScroll';
import { Footer } from '../components/sections/Footer';
import { useSiteData } from '../contexts/SiteDataContext';
import { usePageSeo } from '../hooks/usePageSeo';
import { ApiError, parseApiFieldErrors, publicApi } from '../lib/api';
import {
  trackGenerateLead,
  trackPhoneClick,
  trackWhatsAppClick,
} from '../lib/analytics';
import { whatsappDigits } from '../lib/pricing';
import {
  DEFAULT_SHOOT_TYPE,
  SHOOT_TYPE_OPTIONS,
  type ShootTypeOption,
} from '../lib/shootTypes';
import { STUDIO_ADDRESS, STUDIO_MAPS_URL } from '../lib/studioLocation';
import { OPENING_HOURS } from '../lib/businessIdentity';

const FORM_FIELDS = [
  'name',
  'email',
  'phone',
  'shootType',
  'bookingDate',
  'location',
  'message',
] as const;

type FormField = (typeof FORM_FIELDS)[number];
type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const fieldClass = (hasError = false) =>
  `w-full border-b bg-transparent px-0 py-3.5 text-sm text-ink-50 outline-none transition-colors placeholder:text-ink-300/45 focus:border-gold-400 ${
    hasError ? 'border-red-400' : 'border-hairline/15'
  }`;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-red-400">{message}</p> : null;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ContactContent() {
  const { siteContent, featuredWork } = useSiteData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shootType, setShootType] = useState<ShootTypeOption>(DEFAULT_SHOOT_TYPE);
  const [bookingDate, setBookingDate] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [status, setStatus] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const leadTracked = useRef(false);

  usePageSeo({
    phone: siteContent.phone,
    email: siteContent.contactEmail,
    socials: siteContent.socials,
  });

  const heroImage = featuredWork[0];
  const waNumber = whatsappDigits(siteContent.whatsapp);
  const whatsappUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hello Doll Pictures, I would like to enquire about a photography session.')}`
    : '';

  const clearError = (field: FormField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    setFieldErrors({});

    try {
      await publicApi.createEnquiry({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        shootType,
        bookingDate: bookingDate || undefined,
        location: location.trim() || undefined,
        whatsappOptIn,
        preferredLanguage: 'en',
        message: message.trim(),
      });
      setStatus('success');
      if (!leadTracked.current) {
        leadTracked.current = true;
        trackGenerateLead({ method: 'contact_form', service_name: shootType });
      }
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError) {
        const nextErrors = parseApiFieldErrors(error.messages, FORM_FIELDS);
        setFieldErrors(nextErrors);
        setErrorMessage(
          Object.keys(nextErrors).length ? 'Please check the highlighted fields.' : error.message,
        );
      } else {
        setErrorMessage('We could not send your message. Please try again or contact us on WhatsApp.');
      }
    }
  };

  return (
    <div className="relative bg-ink-950">
      <CustomCursor />
      <div className="film-grain" />
      <Navbar />

      <main className="relative overflow-hidden bg-ink-950 pt-20">
        <section className="relative px-6 pb-20 pt-16 sm:pt-24 lg:px-10 lg:pb-28 lg:pt-32">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 18% 20%, rgb(var(--gold-glow) / 0.12), transparent 70%)',
            }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] lg:items-end lg:gap-20">
            <div>
              <p className="section-label mb-6">Contact the studio</p>
              <h1 className="font-display text-6xl font-light leading-[0.92] text-ink-50 sm:text-7xl md:text-8xl lg:text-[7.5rem]">
                Let&apos;s create
                <span className="block italic text-gradient-gold">something timeless.</span>
              </h1>
              <p className="mt-8 max-w-xl text-base font-light leading-relaxed text-ink-100/70 sm:text-lg">
                Tell us what you&apos;re celebrating, the moments that matter, and how you want them to feel. We&apos;ll help shape the rest.
              </p>
            </div>

            {heroImage ? (
              <figure className="relative ml-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-sm lg:aspect-[5/4]">
                <picture>
                  {heroImage.avifSrcSet ? <source type="image/avif" srcSet={heroImage.avifSrcSet} /> : null}
                  {heroImage.webpSrcSet ? <source type="image/webp" srcSet={heroImage.webpSrcSet} /> : null}
                  <img
                    src={heroImage.image}
                    alt={heroImage.alt}
                    className="h-full w-full object-cover"
                    sizes="(min-width: 1024px) 52vw, 100vw"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/45 via-transparent to-transparent" />
                <figcaption className="absolute bottom-5 left-5 text-[0.65rem] uppercase tracking-[0.22em] text-white/75">
                  {heroImage.category} · {heroImage.location}
                </figcaption>
              </figure>
            ) : null}
          </div>
        </section>

        <section className="relative border-y border-hairline/10 bg-ink-900/35 px-6 py-20 sm:py-24 lg:px-10 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
            <aside>
              <p className="section-label mb-5">Ways to reach us</p>
              <h2 className="font-display text-4xl font-light text-ink-50 sm:text-5xl">
                Come say <span className="italic text-gold-300">hello.</span>
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-200/60">
                Based in Erode and available across Tamil Nadu. Enquiries are usually answered within one working day.
              </p>

              <div className="mt-10 space-y-7">
                {siteContent.contactEmail ? (
                  <a href={`mailto:${siteContent.contactEmail}`} className="group flex items-start gap-4" data-cursor="hover">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/10 text-gold-400 transition-colors group-hover:border-gold-400/50">
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-ink-300/55">Email</span>
                      <span className="mt-1 block text-sm text-ink-100/80 transition-colors group-hover:text-gold-300">{siteContent.contactEmail}</span>
                    </span>
                  </a>
                ) : null}

                {siteContent.phone ? (
                  <a
                    href={`tel:${siteContent.phone.replace(/\s/g, '')}`}
                    className="group flex items-start gap-4"
                    data-cursor="hover"
                    onClick={() => trackPhoneClick({ cta_location: 'contact_page' })}
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/10 text-gold-400 transition-colors group-hover:border-gold-400/50">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-ink-300/55">Call</span>
                      <span className="mt-1 block text-sm text-ink-100/80 transition-colors group-hover:text-gold-300">{siteContent.phone}</span>
                    </span>
                  </a>
                ) : null}

                <a
                  href={STUDIO_MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Get directions to the Doll Pictures studio in Google Maps"
                  className="group -mx-3 flex items-start gap-4 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-gold-400/20 hover:bg-gold-400/[0.04] focus-visible:border-gold-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/30"
                  data-cursor="hover"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/10 text-gold-400 transition-colors group-hover:border-gold-400/50">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-ink-300/55">Visit our studio</span>
                    <span className="mt-1 block max-w-xs text-sm leading-relaxed text-ink-100/80 transition-colors group-hover:text-gold-300">{STUDIO_ADDRESS}</span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-gold-400 transition-colors group-hover:text-gold-300">
                      Get directions · Google Maps
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </a>

                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline/10 text-gold-400">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.65rem] uppercase tracking-[0.2em] text-ink-300/55">Opening hours</span>
                    <span className="mt-2 grid max-w-xs gap-1 text-sm text-ink-100/80">
                      {OPENING_HOURS.map(({ day, hours }) => (
                        <span key={day} className="grid grid-cols-[5.5rem_1fr] gap-3">
                          <span>{day}</span>
                          <span>{hours}</span>
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block text-xs text-ink-200/55">Please contact us before you arrive.</span>
                  </span>
                </div>
              </div>

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-[#25D366]/35 px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-[#58dc87] transition-colors hover:border-[#25D366]/70 hover:bg-[#25D366]/5"
                  onClick={() => trackWhatsAppClick({ cta_location: 'contact_page' })}
                  data-cursor="hover"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Chat on WhatsApp
                </a>
              ) : null}
            </aside>

            <div className="rounded-2xl border border-hairline/10 bg-ink-950/55 p-6 shadow-2xl shadow-black/15 sm:p-10 lg:p-12">
              {status === 'success' ? (
                <div className="flex min-h-[36rem] flex-col items-center justify-center text-center" role="status">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/35 bg-gold-400/10 text-gold-300">
                    <Check className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <p className="section-label mt-8">Message received</p>
                  <h2 className="mt-4 font-display text-4xl font-light text-ink-50 sm:text-5xl">Thank you, {name.split(' ')[0]}.</h2>
                  <p className="mt-5 max-w-md leading-relaxed text-ink-200/65">
                    We&apos;ll review your plans and get back to you within 24 hours. We can&apos;t wait to hear more about your story.
                  </p>
                  <Link to="/gallery" className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold-300 hover:text-gold-200" data-cursor="hover">
                    Explore our work <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-9">
                    <p className="section-label mb-4">Start a conversation</p>
                    <h2 className="font-display text-4xl font-light text-ink-50 sm:text-5xl">Tell us about <span className="italic text-gold-300">your story.</span></h2>
                    <p className="mt-4 text-sm leading-relaxed text-ink-200/60">A few details are enough to begin. Fields marked with * are required.</p>
                  </div>

                  <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="contact-name" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Your name *</label>
                      <input id="contact-name" required autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); clearError('name'); }} placeholder="How should we address you?" className={fieldClass(Boolean(fieldErrors.name))} aria-invalid={Boolean(fieldErrors.name)} />
                      <FieldError message={fieldErrors.name} />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Email address *</label>
                      <input id="contact-email" required type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email'); }} placeholder="you@example.com" className={fieldClass(Boolean(fieldErrors.email))} aria-invalid={Boolean(fieldErrors.email)} />
                      <FieldError message={fieldErrors.email} />
                    </div>
                    <div>
                      <label htmlFor="contact-phone" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Phone number</label>
                      <input id="contact-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); clearError('phone'); }} placeholder="+91 00000 00000" className={fieldClass(Boolean(fieldErrors.phone))} aria-invalid={Boolean(fieldErrors.phone)} />
                      <FieldError message={fieldErrors.phone} />
                    </div>
                    <div>
                      <label htmlFor="contact-shoot" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">I&apos;m interested in *</label>
                      <select id="contact-shoot" value={shootType} onChange={(e) => { setShootType(e.target.value as ShootTypeOption); clearError('shootType'); }} className={fieldClass(Boolean(fieldErrors.shootType))} aria-invalid={Boolean(fieldErrors.shootType)}>
                        {SHOOT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      <FieldError message={fieldErrors.shootType} />
                    </div>
                    <div>
                      <label htmlFor="contact-date" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Preferred date</label>
                      <input id="contact-date" type="date" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); clearError('bookingDate'); }} className={fieldClass(Boolean(fieldErrors.bookingDate))} aria-invalid={Boolean(fieldErrors.bookingDate)} />
                      <FieldError message={fieldErrors.bookingDate} />
                    </div>
                    <div>
                      <label htmlFor="contact-location" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Location</label>
                      <input id="contact-location" value={location} onChange={(e) => { setLocation(e.target.value); clearError('location'); }} placeholder="Erode, Coimbatore…" className={fieldClass(Boolean(fieldErrors.location))} aria-invalid={Boolean(fieldErrors.location)} />
                      <FieldError message={fieldErrors.location} />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="contact-message" className="text-xs uppercase tracking-[0.16em] text-ink-200/65">Tell us a little more *</label>
                      <textarea id="contact-message" required rows={4} value={message} onChange={(e) => { setMessage(e.target.value); clearError('message'); }} placeholder="Your event, ideas, questions, or anything you'd love us to know…" className={`${fieldClass(Boolean(fieldErrors.message))} resize-none`} aria-invalid={Boolean(fieldErrors.message)} />
                      <FieldError message={fieldErrors.message} />
                    </div>
                  </div>

                  <label className="mt-7 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-ink-200/55">
                    <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="mt-0.5 rounded border-hairline/20 bg-ink-950 text-gold-400 focus:ring-gold-400" />
                    <span>I&apos;m happy to receive updates about this enquiry on WhatsApp. I can opt out at any time.</span>
                  </label>

                  {status === 'error' && errorMessage ? <p className="mt-5 text-sm text-red-400" role="alert">{errorMessage}</p> : null}

                  <div className="mt-8 flex flex-col gap-4 border-t border-hairline/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xs text-[0.7rem] leading-relaxed text-ink-300/50">
                      By sending this form, you agree to our <Link to="/privacy" className="underline underline-offset-2 hover:text-gold-300">Privacy Policy</Link>.
                    </p>
                    <button type="submit" disabled={status === 'sending'} className="btn-primary group shrink-0 disabled:cursor-wait disabled:opacity-60" data-cursor="hover">
                      <span className="relative z-10">{status === 'sending' ? 'Sending…' : 'Send enquiry'}</span>
                      <Send className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export function Contact() {
  return (
    <SmoothScroll>
      <ContactContent />
    </SmoothScroll>
  );
}
