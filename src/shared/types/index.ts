/**
 * Shared CMS domain types — single source for public site + admin.
 * Admin entities add id/order/isPublished where the API requires them.
 * Public API views are Pick/Omit aliases of the same shapes.
 */

export type PricingMode = 'price' | 'startingFrom' | 'enquire';

export type EnquiryStatus = 'new' | 'read' | 'responded';
export type EnquiryStage = 'new' | 'contacted' | 'follow_up' | 'booked' | 'closed_lost';
export type EnquirySource =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'google_business'
  | 'ads'
  | 'phone'
  | 'whatsapp'
  | 'walk_in'
  | 'referral'
  | 'diary_import';

export type BookingStatus =
  | 'draft'
  | 'confirmed'
  | 'shoot_completed'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'other';
export type PaymentState = 'unpriced' | 'unpaid' | 'partial' | 'paid' | 'overpaid';

export type BookingScheduleHistoryEntry = {
  id: string;
  action: 'rescheduled' | 'cancelled' | 'restored';
  previous: BookingScheduleSnapshot;
  next: BookingScheduleSnapshot;
  changedAt: string;
  changedBy: { id: string; name: string };
};

export type BookingScheduleSnapshot = {
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
};

export type BookingReviewStatus = 'not_requested' | 'requested' | 'received' | 'skipped';
export type BookingReviewHistoryEntry = {
  id: string;
  action: 'requested' | 'received' | 'skipped' | 'reopened';
  changedAt: string;
  changedBy: { id: string; name: string };
};

export type ScheduleBookingItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  location: string;
  assignedStaffAccountName: string;
  whatsappOptIn: boolean;
  whatsappOptOutAt?: string;
};

export type ScheduleResponse = {
  dateFrom: string;
  dateTo: string;
  timezone: 'Asia/Kolkata';
  bookings: ScheduleBookingItem[];
};

export type ScheduleConflictResponse = {
  timedConflicts: ScheduleBookingItem[];
  untimedConflicts: ScheduleBookingItem[];
  blocked: boolean;
  requiresUntimedConfirmation: boolean;
};

export type RescheduleBookingPayload = {
  bookingDate: string;
  startTime: string;
  endTime: string;
  acknowledgeUntimedConflict?: boolean;
};

/** Ordered CMS row metadata (admin + published lists). */
export type CmsMeta = {
  id: string;
  order: number;
  isPublished: boolean;
};

// —— Navigation / site content ——————————————————————————————

export type ServiceContentSection = {
  id?: string;
  heading: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
};

export type ServiceContentSectionInput = {
  _id?: string;
  id?: string;
  heading?: string;
  body?: string;
  imageUrl?: string | null;
  imageAlt?: string;
};

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
  sections: ServiceContentSection[];
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
  sections?: ServiceContentSectionInput[];
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

export type PublicCategory = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  coverPhotoId?: PublicPhoto | string | null;
};

export type PublicBookingBackground = {
  categoryName: string;
  categorySlug: string;
  coverPhoto: PublicPhoto;
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
    /** Largest optimized WebP, suitable for full-width content sections. */
    large?: string;
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
  imageOriginal: string;
  imageStorageKey: string;
  imageTransform: ImageTransform | null;
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

export type StaffProfile = CmsMeta & {
  name: string;
  jobTitle: string;
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
export type PublicStaffProfile = Pick<StaffProfile, 'name' | 'jobTitle' | 'bio' | 'photo'>;

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
  source: EnquirySource | '';
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
  source?: EnquirySource;
  nextFollowUpAt?: string;
  followUpNote?: string;
  whatsappOptIn?: boolean;
  whatsappNotificationsEnabled?: boolean;
  preferredLanguage?: string;
};

export type ConvertEnquiryPayload = {
  creationRequestId?: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  shootType?: string;
  preferredEvent?: string;
  location?: string;
  packageId?: string | null;
  agreedTotal?: number | null;
  assignedStaffAccountId?: string | null;
  paymentDueDate?: string;
  notes?: string;
  advanceAmount?: number;
  advancePaidAt?: string;
  advanceMethod?: PaymentMethod;
  whatsappOptIn?: boolean;
  whatsappNotificationsEnabled?: boolean;
  acknowledgeUntimedConflict?: boolean;
};

export type CreateEnquiryPayload = {
  name: string;
  email?: string;
  phone: string;
  shootType: string;
  preferredEvent?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  whatsappOptIn?: boolean;
  preferredLanguage?: string;
  message?: string;
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
  separateShootDecision?: { reason: string; reviewedRecordIds: string[]; actorId: string; decidedAt: string };
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  source: EnquirySource | '';
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
  assignedStaffAccountId?: string;
  assignedStaffAccountName: string;
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
  scheduleHistory: BookingScheduleHistoryEntry[];
  reviewStatus: BookingReviewStatus;
  reviewRequestCount: number;
  reviewLastRequestedAt?: string;
  reviewReceivedAt?: string;
  reviewSkippedAt?: string;
  reviewHistory: BookingReviewHistoryEntry[];
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

export type FinanceReport = {
  period: {
    dateFrom: string;
    dateTo: string;
    timezone: string;
    trendGroup: 'day' | 'week' | 'month';
  };
  summary: {
    paymentsReceived: number;
    paymentTransactions: number;
    bookedRevenue: number;
    shootValue: number;
    pricedShootBookings: number;
    confirmedBookings: number;
    outstandingNow: number;
    outstandingBookings: number;
    overdueNow: number;
    overdueBookings: number;
    averageBookingValue: number;
    salarySpend: number;
    netCashAfterSalary: number;
    collectionRate: number;
    averagePaymentReceived: number;
  };
  paymentTrend: Array<{
    period: string;
    amount: number;
    payments: number;
  }>;
  salaryTrend: Array<{
    period: string;
    amount: number;
    transactions: number;
  }>;
  revenueByShootType: Array<{
    shootType: string;
    bookedRevenue: number;
    bookings: number;
  }>;
  paymentStatus: {
    paid: number;
    partial: number;
    unpaid: number;
    overpaid: number;
  };
  overduePayments: Array<{
    bookingId: string;
    customerName: string;
    shootType: string;
    agreedTotal: number;
    amountPaid: number;
    balanceDue: number;
    paymentDueDate: string;
    daysOverdue: number;
  }>;
  recentPayments: Array<{
    bookingId: string;
    paymentId: string;
    customerName: string;
    shootType: string;
    bookingStatus: BookingStatus;
    amount: number;
    paidAt: string;
    method: PaymentMethod;
  }>;
  dataQuality: {
    unpricedBookings: number;
    missingDueDates: number;
    overpaidBookings: number;
  };
};

export type OwnerOverviewReport = {
  period: {
    dateFrom: string;
    dateTo: string;
    previousDateFrom: string;
    previousDateTo: string;
    timezone: string;
    generatedAt: string;
  };
  finance: FinanceReport;
  comparisons: {
    paymentsReceived: number | null;
    bookedRevenue: number | null;
    newEnquiries: number | null;
    confirmedBookings: number | null;
  };
  enquiries: {
    newEnquiries: number;
    engaged: number;
    converted: number;
    closedLost: number;
    conversionRate: number;
    sourceBreakdown: Array<{ source: EnquirySource | ''; count: number }>;
  };
  bookings: {
    confirmedBookings: number;
    cancelledBookings: number;
    upcoming7Days: number;
    upcoming30Days: number;
    statusBreakdown: Record<BookingStatus, number>;
    upcoming: Array<{
      bookingId: string;
      customerName: string;
      shootType: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      location: string;
      assignedStaffAccountName: string;
    }>;
  };
  attention: {
    newEnquiries: number;
    untouchedNewEnquiries: number;
    overdueFollowUps: number;
    draftsMissingDetails: number;
    outstandingBookings: number;
    overdueBookings: number;
    financeRecords: number;
  };
};

export type BookingWritePayload = {
  creationRequestId?: string;
  separateShootReason?: string;
  reviewedRecordIds?: string[];
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  source?: EnquirySource;
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
  assignedStaffAccountId?: string | null;
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
  acknowledgeUntimedConflict?: boolean;
};

export type StaffAccountRole = 'owner' | 'sales' | 'content_manager' | 'employee';

export type StaffAccessArea =
  | 'owner_overview'
  | 'dashboard'
  | 'today'
  | 'enquiries'
  | 'bookings'
  | 'schedule'
  | 'occasions'
  | 'quotations'
  | 'payments'
  | 'photos'
  | 'categories'
  | 'packages'
  | 'package_categories'
  | 'hero_slides'
  | 'story_scenes'
  | 'statistics'
  | 'testimonials'
  | 'behind_scenes'
  | 'staff_profiles'
  | 'services'
  | 'site_content'
  | 'integrations'
  | 'staff_accounts'
  | 'salary_management';

export type StaffAccessLevel = 'manage' | 'view' | 'none';

export type StaffPermissionOverrides = Partial<Record<StaffAccessArea, StaffAccessLevel>>;

export type StaffPermission = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  enabled: boolean;
};

export type StaffAccount = {
  id: string;
  email?: string;
  name: string;
  jobTitle?: string;
  role: StaffAccountRole;
  permissionOverrides?: StaffPermissionOverrides;
  permissions?: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  employeeCode?: string;
  attendanceEnabled?: boolean;
  joiningDate?: string;
  employmentEndDate?: string;
  punchPinConfigured?: boolean;
};

export type StaffAccountOption = {
  id: string;
  name: string;
  jobTitle: string;
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
  assignedStaffAccountName?: string;
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
  occasionsDue: TodayOccasionTask[];
  reviewRequests: TodayReviewTask[];
};

export type OccasionContactHistoryEntry = {
  id?: string;
  occurrenceDate: string;
  contactedAt: string;
  contactedBy: { id: string; name: string };
};

export type CustomerOccasion = {
  id: string;
  type: 'birthday' | 'anniversary';
  occasionName: string;
  customerName: string;
  phone: string;
  email?: string;
  occasionDate: string;
  nextOccurrenceDate: string;
  daysUntil: number;
  active: boolean;
  contactedForOccurrence: boolean;
  consentRecorded: boolean;
  optedOut: boolean;
  source?: { type: 'enquiry' | 'booking'; id: string };
  contactHistory?: OccasionContactHistoryEntry[];
};

export type TodayOccasionTask = CustomerOccasion & { overdue: boolean };

export type TodayReviewTask = {
  bookingId: string;
  customerName: string;
  phone: string;
  service: string;
  deliveredAt: string;
  dueAt: string;
  status: BookingReviewStatus;
  requestCount: number;
  lastRequestedAt?: string;
  reviewUrl: string;
  consentRecorded: boolean;
  optedOut: boolean;
};

export type WeddingQuotationStatus = 'draft' | 'published' | 'archived';
export type QuotationPricingMode = 'fixed' | 'starting_from' | 'enquire';
export type QuotationPalette = 'champagne' | 'blush' | 'midnight';

export type QuotationEvent = { id: string; name: string; date: string; location: string; notes: string };
export type QuotationLineItem = {
  id: string; eventId: string; title: string; description: string;
  quantity: number; unitPrice: number; amount: number;
};
export type QuotationOption = {
  id: string; name: string; tagline: string; recommended: boolean;
  lineItems: QuotationLineItem[]; inclusions: string[]; deliverables: string[];
  discountAmount: number; subtotal: number; total: number; advanceAmount: number;
};
export type QuotationAddOn = {
  id: string; name: string; description: string;
  pricingMode: QuotationPricingMode; price?: number;
};
export type QuotationPaymentMilestone = { id: string; label: string; percentage: number };
export type QuotationImage = { id: string; url: string; title: string; altText: string };
export type QuotationMetrics = {
  viewCount: number; downloadCount: number; firstViewedAt?: string; lastViewedAt?: string;
  revisionViewCount: number; revisionDownloadCount: number;
  revisionFirstViewedAt?: string; revisionLastViewedAt?: string;
};
export type QuotationDraft = {
  customerName: string; customerPhone: string; customerEmail: string;
  coupleNames: string; weddingTitle: string; validUntil: string;
  events: QuotationEvent[]; options: QuotationOption[]; addOns: QuotationAddOn[];
  paymentMilestones: QuotationPaymentMilestone[];
  coverPhotoId: string; galleryPhotoIds: string[]; testimonialId: string;
  introduction: string; whyDollPictures: string; deliveryInformation: string;
  terms: string; closingMessage: string; palette: QuotationPalette;
  visibleSections: string[]; sectionOrder: string[];
};
export type PublicWeddingQuotation = Omit<QuotationDraft,
  'customerName' | 'customerPhone' | 'customerEmail' | 'coverPhotoId' | 'galleryPhotoIds' | 'testimonialId'> & {
  quotationNumber: string; publishedRevision: number; publishedAt: string; expired: boolean;
  coverPhoto: QuotationImage; galleryPhotos: QuotationImage[];
  testimonial?: { id: string; name: string; role: string; text: string; rating: number };
  brand: { name: string; tagline: string; logoUrl: string; phone: string; email: string; whatsapp: string; instagram: string; website: string };
};
export type WeddingQuotation = {
  id: string; enquiryId: string; quotationNumber: string; status: WeddingQuotationStatus;
  customerName: string; customerPhone: string; customerEmail: string; draft: QuotationDraft;
  publishedRevision: number; publishedAt?: string; shareUrl: string; expired: boolean;
  metrics: QuotationMetrics;
  publishHistory: Array<{ revision: number; publishedAt: string; publishedBy: { id: string; name: string } }>;
  createdAt: string; updatedAt: string;
};
export type QuotationAssets = {
  packages: Array<{ id: string; name: string; description: string; inclusions: string[]; price: number | null; pricingMode: string; advanceAmount: number | null; categoryName: string }>;
  photos: QuotationImage[];
  testimonials: Array<{ id: string; name: string; role: string; text: string; rating: number }>;
};
export type QuotationSettings = {
  defaultPalette: QuotationPalette; defaultValidityDays: number;
  introduction: string; whyDollPictures: string; deliveryInformation: string;
  terms: string; closingMessage: string; paymentMilestones: QuotationPaymentMilestone[];
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
  bookingDate?: string;
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
  user: StaffAccount | null;
  token: string | null;
};
