export type SaleOffer = {
  campaignId: string; revision: number; name: string; terms: string;
  startsAt: string; endsAt: string; discountType: 'percentage' | 'fixed';
  discountValue: number; basePrice: number; discountAmount: number; salePrice: number;
};
export type PackagePricing = {
  basePrice: number | null; effectivePrice: number | null; evaluatedAt: string;
  nextTransitionAt: string | null; activeOffer: SaleOffer | null; upcomingOffer: SaleOffer | null;
  token: string;
};
export type PricingSnapshot = {
  campaignId: string | null; campaignName: string; revision: number; terms: string;
  basePrice: number | null; discountAmount: number; salePrice: number | null;
  agreedTotal: number | null; isStartingFrom: boolean; adjustmentAmount: number;
  overrideReason: string; appliedAt: string; currency: string;
};
export type SaleOverride = { packageId: string; discountType: 'percentage' | 'fixed'; discountValue: number };
export type Sale = {
  overrides?: SaleOverride[];
  _id: string; id?: string; name: string; description: string; terms: string;
  startsAt: string; endsAt: string; state: 'draft' | 'published' | 'paused' | 'archived';
  phase: string; enabled: boolean; revision: number; showUpcoming: boolean;
  discountType: 'percentage' | 'fixed'; discountValue: number; packageIds: string[];
};
export type SaleDetailPackage = {
  packageId: string; packageName: string; categoryId: string | null; categoryName: string;
  pricingMode: string; discountType: 'percentage' | 'fixed'; discountValue: number;
  basePrice: number | null; discountAmount: number | null; salePrice: number | null;
  hasOverride: boolean; priceSource: 'saved' | 'preview' | 'unavailable';
  availability: 'available' | 'unpublished' | 'deleted'; warnings: string[];
};
export type SaleDetail = Sale & { packages: SaleDetailPackage[] };
export type SaleInput = Pick<Sale, 'name' | 'description' | 'terms' | 'startsAt' | 'endsAt' | 'discountType' | 'discountValue' | 'packageIds' | 'showUpcoming'> & { overrides?: SaleOverride[] };
export type SaleMetrics = {
  bookings: number; cancelledBookings: number; listedValue: number; campaignDiscount: number;
  estimatedDiscount: number; startingFromBookings: number; adjustments: number; bookedRevenue: number;
  lifetimeCollections: number; periodCollections: number; cancelledCollections: number;
  outstanding: number; overpayments: number;
};
export type SaleReport = {
  summary: Partial<SaleMetrics>;
  campaigns: (SaleMetrics & { _id: string; name: string })[];
  locations: (SaleMetrics & { _id: string })[];
  packages: (SaleMetrics & { _id: string; name: string })[];
  shootTypes: (SaleMetrics & { _id: string })[];
  trend: (SaleMetrics & { _id: string })[];
  calendarWindows: { campaignId: string; name: string; bookings: number; bookedRevenue: number }[];
};
