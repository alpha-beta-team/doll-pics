import type { PublicTeamMember } from '../../lib/api';
import { useInView } from '../../hooks/useScroll';

export function TeamCard({ member, index }: { member: PublicTeamMember; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`group text-center reveal-blur ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="relative mx-auto mb-6 h-44 w-44">
        <div className="absolute inset-0 rounded-full border border-gold-400/20 transition-colors duration-500 group-hover:border-gold-400/50 group-hover:shadow-[0_0_40px_-12px_rgba(212,162,73,0.45)]" />
        <div className="absolute inset-2 overflow-hidden rounded-full">
          <img
            src={member.photo}
            alt={member.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </div>
      <h3 className="font-display text-2xl font-light text-ink-50">{member.name}</h3>
      <div className="mt-2 text-[10px] uppercase tracking-widest text-gold-400">{member.role}</div>
      <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-ink-200/60">{member.bio}</p>
    </div>
  );
}
