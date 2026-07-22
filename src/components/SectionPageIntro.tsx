type SectionPageIntroProps = {
  heading: string;
  body: string;
};

export function SectionPageIntro({ heading, body }: SectionPageIntroProps) {
  return (
    <header className="relative px-6 pb-8 pt-16 lg:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgb(var(--gold-glow) / 0.1), transparent)',
        }}
      />
      <div className="relative mx-auto max-w-7xl">
        <h1 className="max-w-3xl font-display text-5xl font-light leading-tight text-ink-50 md:text-7xl">
          {heading}
        </h1>
        <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          {body}
        </p>
      </div>
    </header>
  );
}
