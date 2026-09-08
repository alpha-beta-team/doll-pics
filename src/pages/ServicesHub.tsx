import { Site } from './Site';
import { Services } from '../components/sections/Services';

/** Eager section for identical server and initial browser markup. */
export function ServicesHub() {
  return <Site sectionComponent={Services} />;
}
