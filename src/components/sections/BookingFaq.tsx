import seoPages from '../../data/seo-pages.json';
import { useInView } from '../../hooks/useScroll';

const faqs = seoPages.faqs ?? [];

export function BookingFaq() {
  const { ref, inView } = useInView<HTMLDivElement>();

  if (!faqs.length) return null;

  return (
    <section
      id="booking-faq"
      className="relative border-t border-white/5 bg-ink-950 px-6 py-24 lg:px-10"
      aria-labelledby="booking-faq-heading"
    >
      <div
        ref={ref}
        className={`mx-auto max-w-3xl reveal ${inView ? 'in' : ''}`}
      >
        <div className="section-label mb-4">FAQ</div>
        <h2
          id="booking-faq-heading"
          className="font-display text-4xl font-light leading-tight text-ink-50 md:text-5xl"
        >
          Questions before you
          <span className="italic text-gradient-gold"> book.</span>
        </h2>
        <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          Clear answers about booking, coverage, packages, and timelines.
        </p>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-white/10 bg-ink-900/40 px-5 py-4 open:border-gold-400/30"
            >
              <summary className="cursor-pointer list-none font-display text-xl font-light text-ink-50 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  <span className="pr-2">{faq.question}</span>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-gold-400 transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-200/70">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
