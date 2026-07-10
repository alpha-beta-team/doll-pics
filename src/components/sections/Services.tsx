import { useSiteData, type ServiceItem } from '../../contexts/SiteDataContext';
import { useInView, useMousePosition } from '../../hooks/useScroll';
import { Heart, Camera, Gift, Baby, Sparkles, Briefcase, Plane, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Heart, Camera, Gift, Baby, Sparkles, Briefcase, Plane,
};

export function Services() {
  const { services } = useSiteData();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <section id="services" className="relative py-32 px-6 lg:px-10 bg-ink-950">
      <div ref={ref} className={`max-w-7xl mx-auto mb-20 reveal ${inView ? 'in' : ''}`}>
        <div className="section-label mb-4">What We Do</div>
        <h2 className="font-display text-5xl md:text-7xl font-light text-ink-50 max-w-3xl leading-tight">
          Crafted for every
          <span className="italic text-gradient-gold"> chapter.</span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, i) => (
          <ServiceCard key={i} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ service, index }: { service: ServiceItem; index: number }) {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const { ref: mouseRef, pos, handleMove, handleLeave } = useMousePosition<HTMLDivElement>();
  const Icon = iconMap[service.icon] || Camera;

  return (
    <div
      ref={viewRef}
      className={`group relative h-80 perspective-1000 reveal ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div
        ref={mouseRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        data-cursor="hover"
        className="relative h-full w-full preserve-3d rounded-2xl overflow-hidden cursor-pointer transition-transform duration-300 ease-out"
        style={{ transform: `perspective(1000px) rotateY(${pos.x * 8}deg) rotateX(${-pos.y * 8}deg)` }}
      >
        <img
          src={service.image}
          alt={service.title}
          width={800}
          height={1000}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-ink-950/20" />
        <div className="absolute inset-0 rounded-2xl shadow-2xl shadow-black/40 group-hover:shadow-gold-500/10 transition-shadow duration-500" />

        <div className="absolute top-6 left-6 w-14 h-14 glass rounded-2xl flex items-center justify-center text-gold-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="font-display text-2xl font-light text-ink-50 mb-2">{service.title}</h3>
          <p className="text-sm text-ink-200/70 leading-relaxed max-h-0 group-hover:max-h-24 opacity-70 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
            {service.desc}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs tracking-widest uppercase text-gold-300 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
            Learn More
            <span className="w-8 h-px bg-gold-400" />
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-gold-400/30 transition-all duration-500" />
      </div>
    </div>
  );
}
