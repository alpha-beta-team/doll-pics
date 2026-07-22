/**
 * Admin types — re-export shared CMS domain types.
 * Prefer importing from here inside `/admin` so paths stay stable.
 */
export type {
  AuthState,
  BehindScene,
  Booking,
  BookingStatus,
  BookingWritePayload,
  Category,
  Enquiry,
  HeroSlide,
  LocationType,
  ImageTransform,
  Package,
  PackageCategory,
  Photo,
  PricingMode,
  ServiceNavLink,
  SiteContent,
  Stat,
  StoryScene,
  TeamMember,
  Testimonial,
  User,
} from '../../shared/types';
