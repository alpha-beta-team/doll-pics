import { Site } from './Site';
import { BookingCTA } from '../components/sections/BookingCTA';
import { BookingFaq } from '../components/sections/BookingFaq';

/** Eager sections let Booking paint its CMS background before JavaScript starts. */
export function BookingPage() {
  return <Site sectionComponent={BookingCTA} bookingFaqComponent={BookingFaq} />;
}
