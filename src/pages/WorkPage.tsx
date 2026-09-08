import { Site } from './Site';
import { FeaturedWork } from '../components/sections/FeaturedWork';

/** Shared eager section for matching initial HTML and hydration. */
export function WorkPage() {
  return <Site sectionComponent={FeaturedWork} />;
}
