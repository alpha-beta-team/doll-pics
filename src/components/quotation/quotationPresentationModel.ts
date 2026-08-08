import type {
  PublicWeddingQuotation,
  QuotationAssets,
  QuotationDraft,
  WeddingQuotation,
} from "../../admin/types";

export function normalizeQuotationPresentation(
  quotation: PublicWeddingQuotation,
): PublicWeddingQuotation {
  return {
    ...quotation,
    options: quotation.options.map((option) => {
      const lineItems = option.lineItems.map((item) => ({
        ...item,
        amount:
          Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) /
          100,
      }));
      const subtotal =
        Math.round(
          lineItems.reduce((sum, item) => sum + item.amount, 0) * 100,
        ) / 100;
      return {
        ...option,
        lineItems,
        subtotal,
        total: Math.max(0, subtotal - Number(option.discountAmount || 0)),
      };
    }),
  };
}

export function draftToQuotationPresentation(
  draft: QuotationDraft,
  assets: QuotationAssets,
  quote: WeddingQuotation,
): PublicWeddingQuotation {
  const cover = assets.photos.find((item) => item.id === draft.coverPhotoId) ||
    assets.photos[0] || {
      id: "",
      url: "/og-share.jpg",
      title: "",
      altText: "",
    };
  const galleryPhotos = draft.galleryPhotoIds
    .map((id) => assets.photos.find((item) => item.id === id))
    .filter(Boolean) as QuotationAssets["photos"];
  const testimonial = assets.testimonials.find(
    (item) => item.id === draft.testimonialId,
  );
  return normalizeQuotationPresentation({
    coupleNames: draft.coupleNames,
    weddingTitle: draft.weddingTitle,
    validUntil: draft.validUntil,
    events: draft.events,
    options: draft.options,
    addOns: draft.addOns,
    paymentMilestones: draft.paymentMilestones,
    introduction: draft.introduction,
    whyDollPictures: draft.whyDollPictures,
    deliveryInformation: draft.deliveryInformation,
    terms: draft.terms,
    closingMessage: draft.closingMessage,
    palette: draft.palette,
    visibleSections: draft.visibleSections,
    sectionOrder: draft.sectionOrder,
    quotationNumber: quote.quotationNumber || "DRAFT PREVIEW",
    publishedRevision: quote.publishedRevision || 0,
    publishedAt: quote.publishedAt || new Date().toISOString(),
    expired: quote.expired,
    coverPhoto: cover,
    galleryPhotos,
    ...(testimonial ? { testimonial } : {}),
    brand: {
      name: "Doll Pictures",
      tagline: "Stories, beautifully remembered",
      logoUrl: "/logo-doll.png",
      phone: "",
      email: "",
      whatsapp: "",
      instagram: "",
      website: "https://dollpictures.in",
    },
  });
}
