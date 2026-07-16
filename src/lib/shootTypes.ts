/** Shared shoot-type options for enquiry form and admin bookings. */
export const SHOOT_TYPE_OPTIONS = [
  'Wedding',
  'Pre-Wedding',
  'Maternity',
  'Newborn',
  'Baby Milestone',
  'Cake Smash',
  'Family',
  'Portrait',
  'Commercial',
  'Other',
] as const;

export type ShootTypeOption = (typeof SHOOT_TYPE_OPTIONS)[number];

export const DEFAULT_SHOOT_TYPE: ShootTypeOption = 'Wedding';
