import type { PublicPackage } from '../../lib/api';
import { PackageCard } from './PackageCard';

interface PackagesGridProps {
  packages: PublicPackage[];
  whatsapp: string;
  className?: string;
}

export function PackagesGrid({ packages, whatsapp, className = '' }: PackagesGridProps) {
  if (!packages.length) {
    return (
      <p className="py-16 text-center font-display text-lg text-ink-200/60">
        Packages will be available soon. Please enquire to book a session.
      </p>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 items-stretch gap-7 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 ${className}`}
    >
      {packages.map((pkg, i) => (
        <PackageCard
          key={`${pkg.name}-${i}`}
          pkg={pkg}
          whatsapp={whatsapp}
          index={i}
        />
      ))}
    </div>
  );
}
