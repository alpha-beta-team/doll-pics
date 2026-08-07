import { Quote, Star, ThumbsUp } from 'lucide-react';
import type { PublicTestimonial } from '../../shared/types';

type ClientReviewsProps = {
  reviews: PublicTestimonial[];
};

function ratingValue(value: number) {
  return Math.max(0, Math.min(5, value));
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function RatingStars({ rating }: { rating: number }) {
  const value = ratingValue(rating);
  const filled = Math.round(value);
  const label = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`${label} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${
            index < filled
              ? 'fill-gold-400 text-gold-400'
              : 'fill-transparent text-ink-400/50'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewerAvatar({
  name,
  avatar,
}: {
  name: string;
  avatar: string;
}) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold-400/30 bg-gold-500/10 text-sm font-semibold text-gold-300">
      <span aria-hidden="true">{initials(name)}</span>
      {avatar ? (
        <img
          src={avatar}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
    </div>
  );
}

function ReviewCard({
  review,
  index,
  featured,
}: {
  review: PublicTestimonial;
  index: number;
  featured: boolean;
}) {
  return (
    <li
      className={`group relative overflow-hidden rounded-3xl border border-hairline/10 bg-ink-900/65 p-6 shadow-2xl shadow-black/10 transition-colors duration-500 hover:border-gold-400/25 sm:p-8 ${
        featured ? 'lg:col-span-2 lg:p-10' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'rgb(var(--gold-glow) / 0.08)' }}
      />

      <article className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-6">
          <Quote className="h-8 w-8 text-gold-400/55" aria-hidden="true" />
          <div className="flex items-center gap-4 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-300/60">
            {review.likes > 0 ? (
              <span
                className="flex items-center gap-1.5"
                aria-label={`${review.likes} likes`}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                {review.likes}
              </span>
            ) : null}
            <span>{String(index + 1).padStart(2, '0')}</span>
          </div>
        </div>

        <RatingStars rating={review.rating} />

        <blockquote
          className={`mt-6 font-sans font-normal tracking-[-0.015em] text-ink-50/95 ${
            featured
              ? 'max-w-4xl text-xl leading-[1.65] sm:text-2xl sm:leading-[1.6] lg:text-[1.65rem]'
              : 'text-lg leading-[1.7] sm:text-xl sm:leading-[1.65]'
          }`}
        >
          <p>&ldquo;{review.text}&rdquo;</p>
        </blockquote>

        <footer className="mt-auto pt-8">
          <div className="flex flex-wrap items-center gap-4 border-t border-hairline/10 pt-6">
            <div className="flex min-w-0 items-center gap-3">
              <ReviewerAvatar name={review.name} avatar={review.avatar} />
              <div className="min-w-0">
                <cite className="block truncate font-sans text-sm font-medium not-italic text-ink-50">
                  {review.name}
                </cite>
                {review.role ? (
                  <p className="mt-1 truncate text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-300">
                    {review.role}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {review.reply ? (
            <div className="mt-5 rounded-2xl border border-gold-400/10 bg-gold-500/[0.04] p-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-400">
                A note from Doll Pictures
              </p>
              <p className="mt-3 text-[0.95rem] leading-7 text-ink-100/85">
                {review.reply}
              </p>
            </div>
          ) : null}
        </footer>
      </article>
    </li>
  );
}

export function ClientReviews({ reviews }: ClientReviewsProps) {
  if (!reviews.length) return null;

  const average =
    reviews.reduce((sum, review) => sum + ratingValue(review.rating), 0) /
    reviews.length;

  return (
    <section
      aria-labelledby="client-reviews-title"
      className="relative px-6 py-24 sm:py-28 lg:px-10 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-8 border-b border-hairline/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label mb-4">In their own words</p>
            <h2
              id="client-reviews-title"
              className="max-w-2xl font-display text-4xl font-light leading-tight text-ink-50 sm:text-5xl md:text-6xl"
            >
              What our clients
              <span className="italic text-gradient-gold"> remember most.</span>
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-hairline/10 bg-ink-900/60 px-5 py-4">
            <div className="font-display text-4xl font-light text-ink-50">
              {average.toFixed(1)}
            </div>
            <div>
              <RatingStars rating={average} />
              <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.16em] text-ink-300">
                {reviews.length} {reviews.length === 1 ? 'story' : 'stories'}
              </p>
            </div>
          </div>
        </div>

        <ul className="grid list-none gap-6 p-0 lg:grid-cols-2">
          {reviews.map((review, index) => (
            <ReviewCard
              key={`${review.name}-${index}`}
              review={review}
              index={index}
              featured={index === 0 && reviews.length > 2}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
