import type { PublicPackage } from '../../lib/api';
import { PackageCard } from './PackageCard';

interface PackagesGridProps {
  packages: PublicPackage[];
  whatsapp: string;
  className?: string;
  presentation?: 'preview' | 'comparison';
}

export function PackagesGrid({
  packages,
  whatsapp,
  className = '',
  presentation = 'preview',
}: PackagesGridProps) {
  if (!packages.length) {
    return (
      <p className="py-16 text-center font-display text-lg text-ink-200/80">
        Packages will be available soon. Please enquire to book a session.
      </p>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 ${
        presentation === 'comparison' ? 'items-start' : 'items-stretch'
      } ${className}`}
    >
      {packages.map((pkg, i) => (
        <PackageCard
          key={`${pkg.name}-${i}`}
          pkg={pkg}
          whatsapp={whatsapp}
          index={i}
          presentation={presentation}
        />
      ))}
    </div>
  );
}
