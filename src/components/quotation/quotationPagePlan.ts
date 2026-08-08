import type { PublicWeddingQuotation } from "../../shared/types";

export type QuotationPagePlan = {
  pageNumber: number;
  kind: "cover" | "content";
  sections: Array<{ sectionId: string; itemIds?: string[] }>;
};

export const MANDATORY_QUOTATION_SECTIONS = [
  "cover",
  "pricing",
  "closing",
  "footer",
] as const;

export function buildQuotationPagePlan(
  quotation: PublicWeddingQuotation,
): QuotationPagePlan[] {
  const visible = new Set(quotation.visibleSections);
  const pages: Omit<QuotationPagePlan, "pageNumber">[] = [
    { kind: "cover", sections: [{ sectionId: "cover" }] },
  ];
  const add = (sectionId: string, itemIds?: string[]) =>
    pages.push({
      kind: "content",
      sections: [{ sectionId, ...(itemIds ? { itemIds } : {}) }],
    });

  for (const sectionId of quotation.sectionOrder) {
    if (!visible.has(sectionId)) continue;
    if (sectionId === "events" && quotation.events.length)
      add(
        "events",
        quotation.events.map((item) => item.id),
      );
    if (sectionId === "gallery" && quotation.galleryPhotos.length)
      add(
        "gallery",
        quotation.galleryPhotos.map((item) => item.id),
      );
    if (sectionId === "why" && quotation.whyDollPictures) add("why");
    if (sectionId === "addons" && quotation.addOns.length)
      add(
        "addons",
        quotation.addOns.map((item) => item.id),
      );
    if (sectionId === "payments" && quotation.paymentMilestones.length)
      add(
        "payments",
        quotation.paymentMilestones.map((item) => item.id),
      );
    if (sectionId === "delivery" && quotation.deliveryInformation)
      add("delivery");
    if (sectionId === "testimonial" && quotation.testimonial)
      add("testimonial", [quotation.testimonial.id]);
    if (sectionId === "terms" && quotation.terms) add("terms");
  }
  quotation.options.forEach((option) => add("pricing", [option.id]));
  add("closing");
  return pages.map((page, index) => ({ ...page, pageNumber: index + 1 }));
}
