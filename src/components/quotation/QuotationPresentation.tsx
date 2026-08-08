import type {
  PublicWeddingQuotation,
  QuotationOption,
} from "../../shared/types";
import { normalizeQuotationPresentation } from "./quotationPresentationModel";

const themes = {
  champagne: {
    page: "bg-[#f6f0e5] text-[#29241f]",
    accent: "text-[#9a7440]",
    card: "border-[#d9c7aa] bg-[#fffaf2]",
    button: "bg-[#8d6938] text-white",
  },
  blush: {
    page: "bg-[#f8eeee] text-[#381f27]",
    accent: "text-[#8f4157]",
    card: "border-[#e2bdc5] bg-[#fff8f8]",
    button: "bg-[#7e344b] text-white",
  },
  midnight: {
    page: "bg-[#111821] text-[#f7f0e3]",
    accent: "text-[#d7b56d]",
    card: "border-[#59616b] bg-[#19232f]",
    button: "bg-[#d7b56d] text-[#111821]",
  },
} as const;

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
function day(value: string) {
  if (!value) return "Date to be confirmed";
  return new Date(`${value}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export function QuotationPresentation({
  quotation: source,
  actions,
}: {
  quotation: PublicWeddingQuotation;
  actions?: React.ReactNode;
}) {
  const quotation = normalizeQuotationPresentation(source);
  const theme = themes[quotation.palette];
  const visible = new Set(quotation.visibleSections);
  const sections: Record<string, React.ReactNode> = {
    events: quotation.events.length ? (
      <EditorialSection
        key="events"
        eyebrow="The celebrations"
        title="Your wedding story"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {quotation.events.map((event) => (
            <article
              key={event.id}
              className={`rounded-2xl border p-5 ${theme.card}`}
            >
              <h3 className="font-display text-2xl">{event.name}</h3>
              <p className={`mt-2 text-sm font-semibold ${theme.accent}`}>
                {day(event.date)}
              </p>
              <p className="mt-1 text-sm opacity-75">
                {event.location || "Location to be confirmed"}
              </p>
              {event.notes && (
                <p className="mt-3 text-sm leading-6 opacity-80">
                  {event.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      </EditorialSection>
    ) : null,
    gallery: quotation.galleryPhotos.length ? (
      <EditorialSection
        key="gallery"
        eyebrow="Selected work"
        title="Stories with soul"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {quotation.galleryPhotos.map((photo, index) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={
                photo.altText ||
                photo.title ||
                "Doll Pictures wedding portfolio"
              }
              className={`w-full rounded-2xl object-cover ${index === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]"}`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      </EditorialSection>
    ) : null,
    why: quotation.whyDollPictures ? (
      <EditorialSection
        key="why"
        eyebrow="The Doll Pictures promise"
        title="Why couples choose us"
      >
        <p className="max-w-3xl whitespace-pre-line text-base leading-8 opacity-85">
          {quotation.whyDollPictures}
        </p>
      </EditorialSection>
    ) : null,
    addons: quotation.addOns.length ? (
      <EditorialSection
        key="addons"
        eyebrow="Make it yours"
        title="Optional additions"
      >
        <div className="grid gap-3 md:grid-cols-2">
          {quotation.addOns.map((item) => (
            <article
              key={item.id}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${theme.card}`}
            >
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                {item.description && (
                  <p className="mt-1 text-sm leading-6 opacity-70">
                    {item.description}
                  </p>
                )}
              </div>
              <strong className={`shrink-0 text-sm ${theme.accent}`}>
                {item.pricingMode === "enquire"
                  ? "On request"
                  : `${item.pricingMode === "starting_from" ? "From " : ""}${money(item.price || 0)}`}
              </strong>
            </article>
          ))}
        </div>
      </EditorialSection>
    ) : null,
    payments: quotation.paymentMilestones.length ? (
      <EditorialSection
        key="payments"
        eyebrow="Simple and transparent"
        title="Payment journey"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {quotation.paymentMilestones.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 text-center ${theme.card}`}
            >
              <div className={`font-display text-4xl ${theme.accent}`}>
                {item.percentage}%
              </div>
              <p className="mt-2 text-sm font-semibold">{item.label}</p>
            </div>
          ))}
        </div>
      </EditorialSection>
    ) : null,
    delivery: quotation.deliveryInformation ? (
      <EditorialSection
        key="delivery"
        eyebrow="After the celebration"
        title="Delivery"
      >
        <p className="max-w-3xl whitespace-pre-line text-base leading-8 opacity-85">
          {quotation.deliveryInformation}
        </p>
      </EditorialSection>
    ) : null,
    testimonial: quotation.testimonial ? (
      <EditorialSection
        key="testimonial"
        eyebrow="Kind words"
        title="From one of our couples"
      >
        <blockquote className={`rounded-3xl border p-6 md:p-8 ${theme.card}`}>
          <p className="font-display text-2xl leading-relaxed">
            “{quotation.testimonial.text}”
          </p>
          <footer className={`mt-4 text-sm font-semibold ${theme.accent}`}>
            {quotation.testimonial.name}
            {quotation.testimonial.role
              ? ` · ${quotation.testimonial.role}`
              : ""}
          </footer>
        </blockquote>
      </EditorialSection>
    ) : null,
    terms: quotation.terms ? (
      <EditorialSection key="terms" eyebrow="The details" title="Terms">
        <p className="whitespace-pre-line text-sm leading-7 opacity-75">
          {quotation.terms}
        </p>
      </EditorialSection>
    ) : null,
  };
  return (
    <article className={`min-h-screen overflow-hidden ${theme.page}`}>
      <header className="relative min-h-[70vh] overflow-hidden">
        <img
          src={quotation.coverPhoto.url}
          alt={
            quotation.coverPhoto.altText || "Doll Pictures wedding photography"
          }
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/15" />
        <div className="relative z-10 flex min-h-[70vh] flex-col justify-between p-6 text-white md:p-12">
          <div className="flex items-center justify-between">
            <img
              src={quotation.brand.logoUrl || "/logo-doll.png"}
              alt="Doll Pictures"
              className="h-16 w-16 rounded-full border border-white/40 object-cover shadow-xl"
              referrerPolicy="no-referrer"
            />
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">
              {quotation.quotationNumber || "Private quotation"}
            </span>
          </div>
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-white/80">
              {quotation.weddingTitle || "Wedding photography quotation"}
            </p>
            <h1 className="mt-4 font-display text-5xl font-light leading-tight md:text-7xl">
              {quotation.coupleNames}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85">
              {quotation.introduction}
            </p>
          </div>
        </div>
      </header>
      {quotation.expired && (
        <div className="bg-red-700 px-4 py-3 text-center text-sm font-semibold text-white">
          This quotation expired on {day(quotation.validUntil)}. Please contact
          Doll Pictures for an updated quotation.
        </div>
      )}
      <main className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
        {quotation.sectionOrder
          .filter((id) => visible.has(id))
          .map((id) => sections[id])}
        <EditorialSection
          eyebrow="Your investment"
          title="Choose the story that feels right"
        >
          <div
            className={`grid gap-5 ${quotation.options.length === 3 ? "lg:grid-cols-3" : quotation.options.length === 2 ? "md:grid-cols-2" : "mx-auto max-w-xl"}`}
          >
            {quotation.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                theme={theme}
                milestones={quotation.paymentMilestones}
              />
            ))}
          </div>
        </EditorialSection>
        <section className="py-12 text-center">
          <p className="mx-auto max-w-2xl whitespace-pre-line font-display text-3xl leading-relaxed">
            {quotation.closingMessage}
          </p>
          {actions && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {actions}
            </div>
          )}
          <p className="mt-8 text-sm opacity-65">
            Valid until {day(quotation.validUntil)}
          </p>
        </section>
      </main>
      <footer className="border-t border-current/15 px-5 py-10 text-center">
        <img
          src={quotation.brand.logoUrl || "/logo-doll.png"}
          alt=""
          className="mx-auto h-14 w-14 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
        <p className="mt-3 font-display text-2xl">
          {quotation.brand.name || "Doll Pictures"}
        </p>
        <p className={`mt-1 text-sm ${theme.accent}`}>
          {quotation.brand.tagline}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm opacity-75">
          {quotation.brand.phone && (
            <a href={`tel:${quotation.brand.phone.replace(/\s/g, "")}`}>
              {quotation.brand.phone}
            </a>
          )}
          {quotation.brand.email && (
            <a href={`mailto:${quotation.brand.email}`}>
              {quotation.brand.email}
            </a>
          )}
          {quotation.brand.website && (
            <a
              href={quotation.brand.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              Website
            </a>
          )}
          {quotation.brand.instagram && (
            <a
              href={socialUrl(quotation.brand.instagram)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          )}
        </div>
      </footer>
    </article>
  );
}

function EditorialSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 md:py-14">
      <p className="text-xs font-bold uppercase tracking-[0.24em] opacity-55">
        {eyebrow}
      </p>
      <h2 className="mt-2 mb-7 font-display text-4xl font-light md:text-5xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
function socialUrl(value: string) {
  return /^https?:\/\//i.test(value)
    ? value
    : `https://instagram.com/${value.replace(/^@/, "")}`;
}
function OptionCard({
  option,
  theme,
  milestones,
}: {
  option: QuotationOption;
  theme: (typeof themes)[keyof typeof themes];
  milestones: PublicWeddingQuotation["paymentMilestones"];
}) {
  return (
    <article
      className={`relative rounded-3xl border p-6 shadow-sm ${theme.card} ${option.recommended ? "ring-2 ring-current/40" : ""}`}
    >
      {option.recommended && (
        <span
          className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${theme.button}`}
        >
          Recommended
        </span>
      )}
      <h3 className="font-display text-3xl">{option.name}</h3>
      {option.tagline && (
        <p className="mt-2 text-sm leading-6 opacity-70">{option.tagline}</p>
      )}
      <div className="mt-6 space-y-3">
        {option.lineItems.map((item) => (
          <div
            key={item.id}
            className="flex justify-between gap-3 border-b border-current/10 pb-3"
          >
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description && (
                <p className="mt-1 text-xs leading-5 opacity-60">
                  {item.description}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm">{money(item.amount)}</span>
          </div>
        ))}
      </div>
      {option.discountAmount > 0 && (
        <p className="mt-4 text-sm text-emerald-700">
          Special adjustment −{money(option.discountAmount)}
        </p>
      )}
      <p className={`mt-5 font-display text-4xl ${theme.accent}`}>
        {money(option.total)}
      </p>
      {option.advanceAmount > 0 && (
        <p className="mt-1 text-xs opacity-65">
          Booking advance {money(option.advanceAmount)}
        </p>
      )}
      {option.inclusions.length > 0 && (
        <ul className="mt-6 space-y-2 text-sm">
          {option.inclusions.map((item) => (
            <li key={item} className="flex gap-2">
              <span className={theme.accent}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      )}
      {option.deliverables.length > 0 && (
        <div className="mt-5 border-t border-current/10 pt-4">
          <p className="text-xs font-bold uppercase tracking-wide opacity-50">
            Deliverables
          </p>
          <ul className="mt-2 space-y-1 text-sm opacity-80">
            {option.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {milestones.length > 0 && (
        <p className="mt-5 text-xs leading-5 opacity-55">
          Payment plan:{" "}
          {milestones
            .map((item) => `${item.percentage}% ${item.label.toLowerCase()}`)
            .join(" · ")}
        </p>
      )}
    </article>
  );
}
