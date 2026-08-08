import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import interRegular from "@fontsource/inter/files/inter-latin-400-normal.woff";
import interBold from "@fontsource/inter/files/inter-latin-700-normal.woff";
import cormorantRegular from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff";
import cormorantBold from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff";
import type {
  PublicWeddingQuotation,
  QuotationOption,
} from "../../shared/types";
import { buildQuotationPagePlan } from "./quotationPagePlan";
import { normalizeQuotationPresentation } from "./quotationPresentationModel";

Font.register({
  family: "Inter",
  fonts: [{ src: interRegular }, { src: interBold, fontWeight: 700 }],
});
Font.register({
  family: "Cormorant",
  fonts: [{ src: cormorantRegular }, { src: cormorantBold, fontWeight: 600 }],
});

const palettes = {
  champagne: {
    ink: "#29241f",
    accent: "#8d6938",
    pale: "#f6f0e5",
    border: "#d9c7aa",
  },
  blush: {
    ink: "#381f27",
    accent: "#7e344b",
    pale: "#f8eeee",
    border: "#e2bdc5",
  },
  midnight: {
    ink: "#f7f0e3",
    accent: "#d7b56d",
    pale: "#111821",
    border: "#59616b",
  },
};

const s = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingHorizontal: 42,
    paddingBottom: 52,
    fontFamily: "Inter",
    fontSize: 9,
    lineHeight: 1.55,
    color: "#29241f",
  },
  cover: { padding: 0, backgroundColor: "#111821", color: "#ffffff" },
  coverImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.62,
  },
  coverBody: { position: "absolute", left: 42, right: 42, bottom: 62 },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 2.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverTitle: {
    fontFamily: "Cormorant",
    fontSize: 42,
    lineHeight: 1.05,
    marginBottom: 12,
  },
  coverCopy: { maxWidth: 390, fontSize: 10, lineHeight: 1.7, opacity: 0.9 },
  quoteNumber: {
    position: "absolute",
    top: 35,
    right: 42,
    fontSize: 8,
    letterSpacing: 1.4,
  },
  coverPageNumber: {
    position: "absolute",
    bottom: 24,
    right: 42,
    fontSize: 7,
    color: "#ffffff",
    opacity: 0.75,
  },
  heading: { fontFamily: "Cormorant", fontSize: 26, marginBottom: 14 },
  section: { marginBottom: 24 },
  body: { fontSize: 9.5, lineHeight: 1.7 },
  event: { borderWidth: 1, borderRadius: 7, padding: 12, marginBottom: 8 },
  eventName: { fontFamily: "Cormorant", fontSize: 17 },
  option: { borderWidth: 1, borderRadius: 9, padding: 15, marginBottom: 14 },
  recommended: {
    fontSize: 7,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  optionName: { fontFamily: "Cormorant", fontSize: 23 },
  tagline: { marginTop: 3, marginBottom: 10, color: "#686159" },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ded8cf",
  },
  lineTitle: { flexGrow: 1 },
  total: { fontFamily: "Cormorant", fontSize: 25, marginTop: 10 },
  list: { marginTop: 9 },
  listItem: { marginBottom: 3 },
  row: { flexDirection: "row", gap: 8 },
  milestone: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 7,
    padding: 11,
    textAlign: "center",
  },
  percentage: { fontFamily: "Cormorant", fontSize: 22 },
  gallery: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  galleryImage: {
    width: "31.8%",
    height: 105,
    objectFit: "cover",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 42,
    right: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#81786e",
  },
  watermark: {
    position: "absolute",
    top: "46%",
    left: 75,
    right: 75,
    transform: "rotate(-28deg)",
    textAlign: "center",
    fontSize: 35,
    color: "#b42318",
    opacity: 0.18,
  },
});

const money = (value: number) =>
  `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}`;
const date = (value: string) =>
  value
    ? new Date(`${value}T12:00:00+05:30`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "To be confirmed";

export function QuotationPdfDocument({
  quotation: source,
  safeImages,
}: {
  quotation: PublicWeddingQuotation;
  safeImages: Set<string>;
}) {
  const quotation = normalizeQuotationPresentation(source);
  const palette = palettes[quotation.palette];
  const coverAvailable = safeImages.has(quotation.coverPhoto.url);
  const pages = buildQuotationPagePlan(quotation);
  return (
    <Document
      title={`${quotation.quotationNumber} · Doll Pictures`}
      author="Doll Pictures"
      subject="Wedding photography quotation"
    >
      <Page
        size="A4"
        style={[
          s.cover,
          {
            backgroundColor:
              quotation.palette === "midnight" ? "#111821" : palette.ink,
          },
        ]}
      >
        {coverAvailable && (
          <Image src={quotation.coverPhoto.url} style={s.coverImage} />
        )}
        <Text style={s.quoteNumber}>{quotation.quotationNumber}</Text>
        <Text style={s.coverPageNumber}>Doll Pictures · 1/{pages.length}</Text>
        <View style={s.coverBody}>
          <Text style={s.eyebrow}>
            {quotation.weddingTitle || "Wedding photography quotation"}
          </Text>
          <Text style={s.coverTitle}>{quotation.coupleNames}</Text>
          <Text style={s.coverCopy}>{quotation.introduction}</Text>
        </View>
        {quotation.expired && (
          <Text style={s.watermark}>EXPIRED QUOTATION</Text>
        )}
      </Page>
      {pages.slice(1).map((page) => (
        <Page
          key={page.pageNumber}
          size="A4"
          style={[
            s.page,
            { color: palette.ink, backgroundColor: palette.pale },
          ]}
          wrap={false}
        >
          {page.sections.map((section) => (
            <PdfPlannedSection
              key={`${section.sectionId}-${section.itemIds?.join("-")}`}
              section={section}
              quotation={quotation}
              safeImages={safeImages}
              palette={palette}
            />
          ))}
          {quotation.expired && (
            <Text fixed style={s.watermark}>
              EXPIRED QUOTATION
            </Text>
          )}
          <View fixed style={s.footer}>
            <Text>
              Doll Pictures · {quotation.brand.website || quotation.brand.phone}
            </Text>
            <Text>
              {quotation.quotationNumber} · {page.pageNumber}/{pages.length}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}

function PdfPlannedSection({
  section,
  quotation,
  safeImages,
  palette,
}: {
  section: { sectionId: string; itemIds?: string[] };
  quotation: PublicWeddingQuotation;
  safeImages: Set<string>;
  palette: (typeof palettes)[keyof typeof palettes];
}) {
  const ids = new Set(section.itemIds || []);
  if (section.sectionId === "events")
    return (
      <Section title="Your wedding story" palette={palette}>
        {quotation.events
          .filter((item) => !ids.size || ids.has(item.id))
          .map((event) => (
            <View
              key={event.id}
              style={[s.event, { borderColor: palette.border }]}
            >
              <Text style={s.eventName}>{event.name}</Text>
              <Text style={{ color: palette.accent, marginTop: 3 }}>
                {date(event.date)}
              </Text>
              {event.location && <Text>{event.location}</Text>}
              {event.notes && (
                <Text style={{ marginTop: 4 }}>{event.notes}</Text>
              )}
            </View>
          ))}
      </Section>
    );
  if (section.sectionId === "pricing")
    return (
      <Section title="Your investment" palette={palette}>
        {quotation.options
          .filter((item) => !ids.size || ids.has(item.id))
          .map((option) => (
            <PdfOption key={option.id} option={option} palette={palette} />
          ))}
      </Section>
    );
  if (section.sectionId === "addons")
    return (
      <Section title="Optional additions" palette={palette}>
        {quotation.addOns
          .filter((item) => !ids.size || ids.has(item.id))
          .map((item) => (
            <View key={item.id} style={s.line}>
              <Text style={s.lineTitle}>
                {item.name}
                {item.description ? ` — ${item.description}` : ""}
              </Text>
              <Text>
                {item.pricingMode === "enquire"
                  ? "On request"
                  : `${item.pricingMode === "starting_from" ? "From " : ""}${money(item.price || 0)}`}
              </Text>
            </View>
          ))}
      </Section>
    );
  if (section.sectionId === "payments")
    return (
      <Section title="Payment journey" palette={palette}>
        <View style={s.row}>
          {quotation.paymentMilestones
            .filter((item) => !ids.size || ids.has(item.id))
            .map((item) => (
              <View
                key={item.id}
                style={[s.milestone, { borderColor: palette.border }]}
              >
                <Text style={[s.percentage, { color: palette.accent }]}>
                  {item.percentage}%
                </Text>
                <Text>{item.label}</Text>
              </View>
            ))}
        </View>
      </Section>
    );
  if (section.sectionId === "delivery")
    return (
      <Section title="Delivery" palette={palette}>
        <Text style={s.body}>{quotation.deliveryInformation}</Text>
      </Section>
    );
  if (section.sectionId === "gallery")
    return (
      <Section title="Selected work" palette={palette}>
        <View style={s.gallery}>
          {quotation.galleryPhotos
            .filter(
              (item) =>
                (!ids.size || ids.has(item.id)) && safeImages.has(item.url),
            )
            .map((item) => (
              <Image key={item.id} src={item.url} style={s.galleryImage} />
            ))}
        </View>
      </Section>
    );
  if (section.sectionId === "why")
    return (
      <Section title="Why Doll Pictures" palette={palette}>
        <Text style={s.body}>{quotation.whyDollPictures}</Text>
      </Section>
    );
  if (section.sectionId === "testimonial" && quotation.testimonial)
    return (
      <Section title="Kind words" palette={palette}>
        <Text style={[s.body, { fontFamily: "Cormorant", fontSize: 17 }]}>
          “{quotation.testimonial.text}”
        </Text>
        <Text style={{ color: palette.accent, marginTop: 7 }}>
          {quotation.testimonial.name}
        </Text>
      </Section>
    );
  if (section.sectionId === "terms")
    return (
      <Section title="Terms" palette={palette}>
        <Text style={s.body}>{quotation.terms}</Text>
      </Section>
    );
  if (section.sectionId === "closing")
    return (
      <Section title="Let’s create something timeless" palette={palette}>
        <Text style={[s.body, { fontFamily: "Cormorant", fontSize: 18 }]}>
          {quotation.closingMessage}
        </Text>
        <Text style={{ marginTop: 12 }}>
          Valid until {date(quotation.validUntil)}
        </Text>
      </Section>
    );
  return null;
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: (typeof palettes)[keyof typeof palettes];
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={{ ...s.eyebrow, color: palette.accent }}>Doll Pictures</Text>
      <Text style={[s.heading, { color: palette.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

function PdfOption({
  option,
  palette,
}: {
  option: QuotationOption;
  palette: (typeof palettes)[keyof typeof palettes];
}) {
  return (
    <View style={[s.option, { borderColor: palette.border }]} wrap={false}>
      {option.recommended && (
        <Text style={[s.recommended, { color: palette.accent }]}>
          Recommended
        </Text>
      )}
      <Text style={s.optionName}>{option.name}</Text>
      {option.tagline && <Text style={s.tagline}>{option.tagline}</Text>}
      {option.lineItems.map((item) => (
        <View key={item.id} style={s.line}>
          <Text style={s.lineTitle}>{item.title}</Text>
          <Text>{money(item.amount)}</Text>
        </View>
      ))}
      {option.discountAmount > 0 && (
        <Text style={{ marginTop: 7, color: "#24734c" }}>
          Special adjustment −{money(option.discountAmount)}
        </Text>
      )}
      <Text style={[s.total, { color: palette.accent }]}>
        {money(option.total)}
      </Text>
      {option.advanceAmount > 0 && (
        <Text>Booking advance {money(option.advanceAmount)}</Text>
      )}
      {option.inclusions.length > 0 && (
        <View style={s.list}>
          {option.inclusions.map((item) => (
            <Text key={item} style={s.listItem}>
              • {item}
            </Text>
          ))}
        </View>
      )}
      {option.deliverables.length > 0 && (
        <View style={s.list}>
          {option.deliverables.map((item) => (
            <Text key={item} style={s.listItem}>
              Deliverable · {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
