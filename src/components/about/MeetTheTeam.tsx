import { useSiteData } from '../../contexts/SiteDataContext';
import { useInView } from '../../hooks/useScroll';
import { TeamCard } from './TeamCard';

export function MeetTheTeam() {
  const { teamMembers, loading } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="team" className="relative scroll-mt-24 bg-ink-950 px-6 py-32 lg:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 h-64 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 50% 80% at 50% 50%, rgb(var(--gold-glow) / 0.08), transparent)',
        }}
      />

      <div ref={ref} className={`relative mx-auto mb-16 max-w-7xl text-center reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">Meet the Team</div>
        <h2 className="font-display text-4xl font-light leading-tight text-ink-50 md:text-6xl">
          The hearts behind
          <span className="italic text-gradient-gold"> the camera.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.95rem] leading-relaxed text-ink-200/70">
          A close-knit collective of photographers, editors, and dreamers who believe every story deserves cinema.
        </p>
      </div>

      <div className="relative mx-auto max-w-7xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {teamMembers.map((member, i) => (
              <TeamCard key={`${member.name}-${i}`} member={member} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
