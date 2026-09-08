import { Site } from './Site';
import { GalleryPortfolio } from '../components/gallery/GalleryPortfolio';

/** Shared eager section keeps initial HTML and hydration identical. */
export function GalleryPage() {
  return <Site sectionComponent={GalleryPortfolio} />;
}
