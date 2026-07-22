import { Play } from 'lucide-react';
import { useInView } from '../../hooks/useScroll';

interface BehindSceneCardProps {
  scene: { title: string; image: string };
  index: number;
  showPlay?: boolean;
}

export function BehindSceneCard({ scene, index, showPlay = true }: BehindSceneCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-cursor="view"
      className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer reveal-blur ${inView ? 'in' : ''}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <img
        src={scene.image}
        alt={scene.title}
        width={600}
        height={800}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {showPlay && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full glass flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-gold-400/20 transition-all duration-500">
          <Play className="w-6 h-6 fill-current" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="text-xs tracking-widest uppercase text-gold-300 mb-1">
          {String(index + 1).padStart(2, '0')}
        </div>
        <h3 className="font-display text-xl font-light text-white">{scene.title}</h3>
      </div>
    </div>
  );
}
