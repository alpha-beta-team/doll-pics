/**
 * Shared CMS domain types — single source for public site + admin.
 * Admin entities add id/order/isPublished where the API requires them.
 * Public API views are Pick/Omit aliases of the same shapes.
 */

export type PricingMode = 'price' | 'startingFrom' | 'enquire';

export type EnquiryStatus = 'new' | 'read' | 'responded';
export type EnquiryStage = 'new' | 'contacted' | 'follow_up' | 'booked' | 'closed_lost';
export type EnquirySource = 'website' | 'phone' | 'whatsapp' | 'walk_in' | 'referral' | 'diary_import';

export type BookingStatus =
  | 'draft'
  | 'confirmed'
  | 'shoot_completed'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';
export type PaymentState = 'unpriced' | 'unpaid' | 'partial' | 'paid' | 'overpaid';

/** Ordered CMS row metadata (admin + published lists). */
export type CmsMeta = {
  id: string;
  order: number;
  isPublished: boolean;
};

// —— Navigation / site content ——————————————————————————————

export type ServiceNavLink = {
  id?: string;
  label: string;
  path: string;
  description: string;
  icon: string;
  imageUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order: number;
  isPublished: boolean;
};

/** Sparse API payload before normalizeServiceNavLinks. */
export type ServiceNavLinkInput = {
  _id?: string;
  id?: string;
  label: string;
  path: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order?: number;
  isPublished?: boolean;
};

export type SiteSocials = {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
};

export type SiteContent = {
  brandName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  ourStory: string;
  mission: string;
  aboutHeroSubtext: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socials: SiteSocials;
  serviceNavLinks: ServiceNavLink[];
};

/** Public `/site-content` response (optional story fields, loose socials). */
export type PublicSiteContent = {
  brandName: string;
  tagline: string;
  heroHeading: string;
  heroSubtext: string;
  about: string;
  ourStory?: string;
  mission?: string;
  aboutHeroSubtext?: string;
  contactEmail: string;
  whatsapp: string;
  phone: string;
  socials: Record<string, string>;
  serviceNavLinks?: ServiceNavLinkInput[];
};

// —— Packages ————————————————————————————————————————————————

export type PackageCategory = CmsMeta & {
  name: string;
  slug: string;
  /** Public SEO path, e.g. `/wedding-packages-erode`. */
  path: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heading: string;
  lead: string;
};

export type PublicPackageCategory = {
  name: string;
  slug: string;
  path?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  heading?: string;
  lead?: string;
  order?: number;
};

export type LocationType = '' | 'studio' | 'home' | 'outdoor';

export type Package = CmsMeta & {
  name: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  /** @deprecated Prefer categoryId */
  shootType?: string;
  description: string;
  inclusions: string[];
  pricingMode: PricingMode;
  price?: number;
  icon: string;
  imageUrl: string;
  durationLabel: string;
  advanceAmount: number | null;
  notes: string[];
  slotTimings: string[];
  locationType: LocationType;
  themeGuideUrl: string;
};

export type PublicPackage = {
  name: string;
  /** @deprecated Prefer categoryName */
  shootType?: string;
  categorySlug?: string;
  categoryName?: string;
  description: string;
  inclusions: string[];
  icon?: string;
  imageUrl?: string;
  pricingMode: string;
  price?: number;
  durationLabel?: string;
  advanceAmount?: number | null;
  notes?: string[];
  slotTimings?: string[];
  locationType?: LocationType;
  themeGuideUrl?: string;
};

// —— Media ————————————————————————————————————————————————————

export type PhotoWidthVariant = { url: string; width: number };

export type ImageTransform = {
  crop: { x: number; y: number; width: number; height: number } | null;
  cropPercentages?: { x: number; y: number; width: number; height: number } | null;
  outputWidth: number;
  outputHeight: number;
};

export type PhotoVariants = {
  webp?: string | PhotoWidthVariant[];
  avif?: string | PhotoWidthVariant[];
  original?: { url: string };
};

/** Public gallery photo (variant arrays for srcset). */
export type PublicPhoto = {
  _id?: string;
  id?: string;
  title: string;
  altText?: string;
  location?: string;
  year?: string;
  isFeatured?: boolean;
  storageKey?: string;
  width?: number;
  height?: number;
  blurPlaceholder?: string;
  variants?: PhotoVariants;
  categoryIds?: Array<{ name: string; slug: string } | string>;
};

/** Admin list/edit photo (flattened URLs for the CMS UI). */
export type Photo = {
  id: string;
  title: string;
  altText: string;
  categories: string[];
  variants: {
    webp: string;
    avif: string;
    original: string;
    sizes: number[];
  };
  imageTransform: ImageTransform | null;
  width: number;
  height: number;
  order: number;
  isFeatured: boolean;
  isPublished: boolean;
  location: string;
  year: string;
  createdAt: string;
};

export type Category = CmsMeta & {
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  coverPhotoId: string | null;
};

// —— Ordered homepage content ————————————————————————————————

export type HeroSlide = CmsMeta & {
  image: string;
  label: string;
};

export type StoryScene = CmsMeta & {
  text: string;
  image: string;
};

export type Stat = CmsMeta & {
  value: number;
  suffix: string;
  label: string;
};

export type Testimonial = CmsMeta & {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  likes: number;
  reply: string;
};

export type BehindScene = CmsMeta & {
  title: string;
  image: string;
  video?: string;
  description?: string;
};

export type TeamMember = CmsMeta & {
  name: string;
  role: string;
  bio: string;
  photo: string;
  photoOriginal: string;
  photoStorageKey: string;
  imageTransform: ImageTransform | null;
};

/** Public list items omit admin meta (API may still send it). */
export type PublicHeroSlide = Pick<HeroSlide, 'image' | 'label'>;
export type PublicStoryScene = Pick<StoryScene, 'text' | 'image'>;
export type PublicStat = Pick<Stat, 'value' | 'suffix' | 'label'>;
export type PublicTestimonial = Pick<
  Testimonial,
  'name' | 'role' | 'avatar' | 'rating' | 'text' | 'likes' | 'reply'
>;
export type PublicBehindScene = Pick<
  BehindScene,
  'title' | 'image' | 'video' | 'description'
>;
export type PublicTeamMember = Pick<TeamMember, 'name' | 'role' | 'bio' | 'photo'>;

// —— Ops ——————————————————————————————————————————————————————

export type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  shootType: string;
  preferredEvent: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  location: string;
  notes: string;
  message: string;
  status: EnquiryStatus;
  stage: EnquiryStage;
  source: EnquirySource;
  nextFollowUpAt?: string;
  followUpNote: string;
  lastFollowUpCompletedAt?: string;
  convertedBookingId?: string;
  whatsappOptIn: boolean;
  whatsappOptInAt?: string;
  whatsappOptInSource: string;
  whatsappNotificationsEnabled: boolean;
  whatsappOptOutAt?: string;
  preferredLanguage: string;
  createdAt: string;
  updatedAt?: string;
};

export type AdminEnquiryWritePayload = {
  name: string;
  phone: string;
  email?: string;
  shootType?: string;
  preferredEvent?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  message?: string;
  source?: Exclude<EnquirySource, 'website'>;
  nextFollowUpAt?: string;
  followUpNote?: string;
  whatsappOptIn?: boolean;
  whatsappNotificationsEnabled?: boolean;
  preferredLanguage?: string;
};

export type ConvertEnquiryPayload = {
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  shootType?: string;
  preferredEvent?: string;
  location?: string;
  packageId?: string | null;
  agreedTotal?: number | null;
  assignedTeamMemberId?: string | null;
  paymentDueDate?: string;
  notes?: string;
  advanceAmount?: number;
  advancePaidAt?: string;
  advanceMethod?: PaymentMethod;
  whatsappOptIn?: boolean;
  whatsappNotificationsEnabled?: boolean;
};

export type CreateEnquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  shootType: string;
  preferredEvent?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  whatsappOptIn?: boolean;
  preferredLanguage?: string;
  message: string;
};

export type BookingPayment = {
  id: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference: string;
  note: string;
  createdAt?: string;
};

export type PaymentSummary = {
  amountPaid: number;
  balanceDue: number | null;
  status: PaymentState;
};

export type WhatsAppMessageSummary = {
  id: string;
  eventType: string;
  templateName: string;
  templateLanguage: string;
  redactedRecipient: string;
  scheduledAt: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled' | 'dry-run';
  attemptCount: number;
  failureCode?: string;
  failureReason?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt?: string;
};

export type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shootType: string;
  preferredEvent: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number | null;
  durationHours: number;
  location: string;
  paymentDueDate: string;
  nextFollowUpAt?: string;
  followUpNote: string;
  lastFollowUpCompletedAt?: string;
  notes: string;
  packageId?: string;
  packageName: string;
  packageListedPrice: number | null;
  packagePricingMode: PricingMode | '';
  agreedTotal: number | null;
  assignedTeamMemberId?: string;
  assignedTeamMemberName: string;
  payments: BookingPayment[];
  paymentSummary: PaymentSummary;
  driveGalleryUrl: string;
  driveEditedUrl: string;
  driveRawsUrl: string;
  driveNotes: string;
  deliverySentAt?: string;
  status: BookingStatus;
  confirmedAt?: string;
  shootCompletedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  statusBeforeCancellation?: Exclude<BookingStatus, 'cancelled'>;
  whatsappOptIn: boolean;
  whatsappOptInAt?: string;
  whatsappOptInSource: string;
  whatsappNotificationsEnabled: boolean;
  preferredLanguage: string;
  whatsappOptOutAt?: string;
  enquiryId?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
  calendarSyncStatus?: 'not_applicable' | 'pending' | 'synced' | 'dry_run' | 'failed';
  calendarSyncErrorCode?: string;
  calendarSyncedAt?: string;
  calendarEventGeneration?: number;
  createdAt: string;
  updatedAt: string;
};

export type GoogleCalendarIntegrationStatus = {
  enabled: boolean;
  dryRun: boolean;
  configured: boolean;
  health: 'disabled' | 'misconfigured' | 'needs_attention' | 'dry_run' | 'healthy';
  timezone: string;
  serviceAccountEmail: string;
  failedBookings: number;
  failedJobs: number;
  jobCounts: Record<string, number>;
  lastSyncedAt?: string;
};

export type WeeklyOwnerReport = {
  weekStart: string;
  weekEnd: string;
  timezone: string;
  newEnquiries: number;
  sourceBreakdown: Array<{ source: EnquirySource; count: number }>;
  confirmedBookings: number;
  cancelledBookings: number;
  shootsCompleted: number;
  paymentsReceived: number;
  outstandingBalance: number;
  overdueFollowUps: number;
  untouchedNewEnquiries: number;
  upcomingStart: string;
  upcomingEnd: string;
  upcomingShoots: number;
  topSource?: { source: string; count: number };
};

export type BookingWritePayload = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shootType?: string;
  preferredEvent?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  location?: string;
  paymentDueDate?: string;
  nextFollowUpAt?: string;
  followUpNote?: string;
  notes?: string;
  packageId?: string | null;
  agreedTotal?: number | null;
  assignedTeamMemberId?: string | null;
  advanceAmount?: number;
  advancePaidAt?: string;
  advanceMethod?: PaymentMethod;
  driveGalleryUrl?: string;
  driveEditedUrl?: string;
  driveRawsUrl?: string;
  driveNotes?: string;
  enquiryId?: string;
  whatsappOptIn?: boolean;
  whatsappNotificationsEnabled?: boolean;
  preferredLanguage?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'operations';
  isActive: boolean;
  mustChangePassword: boolean;
};

export type TodayFollowUp = {
  entityType: 'enquiry' | 'booking';
  id: string;
  name: string;
  phone: string;
  shootType: string;
  dueAt?: string;
  note: string;
  overdue: boolean;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  balanceDue?: number | null;
  paymentDueDate?: string;
  whatsappOptIn?: boolean;
  whatsappOptOutAt?: string;
};

export type TodaySummaryItem = {
  id: string;
  name: string;
  phone: string;
  shootType: string;
  bookingDate?: string;
  location?: string;
  status?: BookingStatus;
  source?: EnquirySource;
  createdAt?: string;
  assignedTeamMemberName?: string;
  startTime?: string;
  endTime?: string;
  whatsappOptIn?: boolean;
  whatsappOptOutAt?: string;
};

export type TodayPaymentItem = TodaySummaryItem & {
  paymentDueDate: string;
  balanceDue: number;
};

export type TodayWork = {
  date: string;
  tomorrow: string;
  timezone: string;
  followUps: TodayFollowUp[];
  newEnquiries: TodaySummaryItem[];
  todayShoots: TodaySummaryItem[];
  paymentsDue: TodayPaymentItem[];
  tomorrowShoots: TodaySummaryItem[];
};

export type AdminSearchItem = {
  id: string;
  type: 'enquiry' | 'booking';
  customerName: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  status: string;
  relevantDate: string;
};

export type AdminSearchResponse = {
  query: string;
  enquiries: AdminSearchItem[];
  bookings: AdminSearchItem[];
  total: number;
};

export type CustomerLookupRecord = {
  id: string;
  type: 'enquiry' | 'booking';
  customerName: string;
  phone: string;
  email: string;
  service: string;
  status: string;
  relevantDate: string;
  active: boolean;
};

export type CustomerLookupResponse = {
  canonicalPhone: string;
  active: CustomerLookupRecord[];
  history: CustomerLookupRecord[];
  suggestedContact?: {
    customerName: string;
    email: string;
  };
};

export type VoiceNoteSummary = {
  id: string;
  recordType: 'enquiry' | 'booking';
  recordId: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
};

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
};
