import type { ElementType, KeyboardEvent, ReactNode } from "react";
import type { PublicWeddingQuotation, QuotationDraft } from "../types";
import { buildQuotationPagePlan } from "../../components/quotation/quotationPagePlan";
import type { QuotationSelection } from "./state";

const palette = {
  champagne: {
    page: "#f6f0e5",
    ink: "#29241f",
    accent: "#8d6938",
    card: "#fffaf2",
    border: "#d9c7aa",
  },
  blush: {
    page: "#f8eeee",
    ink: "#381f27",
    accent: "#7e344b",
    card: "#fff8f8",
    border: "#e2bdc5",
  },
  midnight: {
    page: "#111821",
    ink: "#f7f0e3",
    accent: "#d7b56d",
    card: "#19232f",
    border: "#59616b",
  },
};

type Props = {
  quotation: PublicWeddingQuotation;
  draft: QuotationDraft;
  mode: "website" | "pdf";
  device: "mobile" | "desktop";
  selection?: QuotationSelection;
  onSelect: (selection: QuotationSelection) => void;
  onEdit: (draft: QuotationDraft, selection?: QuotationSelection) => void;
};

export function QuotationCanvas({
  quotation,
  draft,
  mode,
  device,
  selection,
  onSelect,
  onEdit,
}: Props) {
  const colors = palette[draft.palette];
  const update = <K extends keyof QuotationDraft>(
    key: K,
    value: QuotationDraft[K],
    selected?: QuotationSelection,
  ) => onEdit({ ...draft, [key]: value }, selected);
  const updateEvent = (
    id: string,
    key: "name" | "location" | "notes",
    value: string,
  ) =>
    update(
      "events",
      draft.events.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
      { sectionId: "events", itemId: id, field: key },
    );
  const updateOption = (id: string, key: "name" | "tagline", value: string) =>
    update(
      "options",
      draft.options.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
      { sectionId: "pricing", itemId: id, field: key },
    );
  const updateList = (
    optionId: string,
    key: "inclusions" | "deliverables",
    index: number,
    value: string,
  ) =>
    update(
      "options",
      draft.options.map((item) =>
        item.id === optionId
          ? {
              ...item,
              [key]: item[key].map((row, rowIndex) =>
                rowIndex === index ? value : row,
              ),
            }
          : item,
      ),
      { sectionId: "pricing", itemId: optionId, field: `${key}.${index}` },
    );
  const updateAddOn = (
    id: string,
    key: "name" | "description",
    value: string,
  ) =>
    update(
      "addOns",
      draft.addOns.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
      { sectionId: "addons", itemId: id, field: key },
    );
  const edit = {
    quotation,
    draft,
    colors,
    selection,
    onSelect,
    update,
    updateEvent,
    updateOption,
    updateList,
    updateAddOn,
  };

  if (mode === "pdf") return <A4Canvas {...edit} />;
  return (
    <div
      data-quotation-canvas="website"
      className="mx-auto overflow-hidden rounded-[28px] shadow-2xl"
      style={{
        width: device === "mobile" ? 390 : 1080,
        background: colors.page,
        color: colors.ink,
      }}
    >
      <Cover edit={edit} compact={device === "mobile"} />
      <div className={device === "mobile" ? "px-5 py-8" : "px-12 py-14"}>
        {draft.sectionOrder.map((section) =>
          draft.visibleSections.includes(section) ? (
            <EditableSection key={section} sectionId={section} edit={edit} />
          ) : null,
        )}
        <Pricing edit={edit} />
        <Closing edit={edit} />
      </div>
      <BrandFooter quotation={quotation} colors={colors} />
    </div>
  );
}

type EditContext = Omit<Props, "mode" | "device" | "onEdit"> & {
  colors: (typeof palette)[keyof typeof palette];
  update: <K extends keyof QuotationDraft>(
    key: K,
    value: QuotationDraft[K],
    selected?: QuotationSelection,
  ) => void;
  updateEvent: (
    id: string,
    key: "name" | "location" | "notes",
    value: string,
  ) => void;
  updateOption: (id: string, key: "name" | "tagline", value: string) => void;
  updateList: (
    optionId: string,
    key: "inclusions" | "deliverables",
    index: number,
    value: string,
  ) => void;
  updateAddOn: (id: string, key: "name" | "description", value: string) => void;
};

function A4Canvas(edit: EditContext) {
  const pages = buildQuotationPagePlan(edit.quotation);
  return (
    <div data-quotation-canvas="pdf" className="space-y-7">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          className="relative mx-auto overflow-hidden bg-white shadow-2xl"
          style={{
            width: 794,
            minHeight: 1123,
            background: edit.colors.page,
            color: edit.colors.ink,
          }}
        >
          {page.kind === "cover" ? (
            <>
              <Cover edit={edit} a4 />
              <div className="pointer-events-none absolute bottom-5 right-8 text-xs text-white/75">
                Doll Pictures · 1/{pages.length}
              </div>
            </>
          ) : (
            <div className="flex min-h-[1123px] flex-col px-14 pb-14 pt-12">
              <div className="flex-1">
                {page.sections.map((section) => (
                  <A4Section
                    key={`${section.sectionId}-${section.itemIds?.join("-")}`}
                    section={section}
                    edit={edit}
                  />
                ))}
              </div>
              <div className="mt-8 flex justify-between border-t pt-4 text-[11px] opacity-60">
                <span>Doll Pictures · Stories, beautifully remembered</span>
                <span>
                  {edit.quotation.quotationNumber} · {page.pageNumber}/
                  {pages.length}
                </span>
              </div>
            </div>
          )}
          {edit.quotation.expired && (
            <div className="pointer-events-none absolute inset-x-10 top-[48%] -rotate-12 text-center text-5xl font-bold text-red-700/20">
              EXPIRED QUOTATION
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function A4Section({
  section,
  edit,
}: {
  section: { sectionId: string; itemIds?: string[] };
  edit: EditContext;
}) {
  if (section.sectionId === "pricing")
    return <Pricing edit={edit} optionIds={section.itemIds} a4 />;
  if (section.sectionId === "closing") return <Closing edit={edit} a4 />;
  return (
    <EditableSection
      sectionId={section.sectionId}
      itemIds={section.itemIds}
      edit={edit}
      a4
    />
  );
}

function Cover({
  edit,
  compact = false,
  a4 = false,
}: {
  edit: EditContext;
  compact?: boolean;
  a4?: boolean;
}) {
  const { quotation, draft, colors } = edit;
  const height = a4 ? 1123 : compact ? 620 : 720;
  return (
    <Selectable
      sectionId="cover"
      edit={edit}
      className="relative overflow-hidden"
      style={{ height }}
    >
      <img
        src={quotation.coverPhoto.url}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div
        className={`relative flex h-full flex-col justify-between text-white ${a4 ? "p-14" : compact ? "p-6" : "p-12"}`}
      >
        <div className="flex items-center justify-between">
          <img
            src={quotation.brand.logoUrl || "/logo-doll.png"}
            alt="Doll Pictures"
            className="h-16 w-16 rounded-full border border-white/50 object-cover"
          />
          <span className="text-xs font-bold tracking-[0.2em]">
            {quotation.quotationNumber}
          </span>
        </div>
        <div>
          <InlineText
            value={draft.weddingTitle}
            onCommit={(value) =>
              edit.update("weddingTitle", value, {
                sectionId: "cover",
                field: "weddingTitle",
              })
            }
            onFocus={() =>
              edit.onSelect({ sectionId: "cover", field: "weddingTitle" })
            }
            className="text-sm uppercase tracking-[0.28em] text-white/80"
          />
          <InlineText
            as="h1"
            value={draft.coupleNames}
            onCommit={(value) =>
              edit.update("coupleNames", value, {
                sectionId: "cover",
                field: "coupleNames",
              })
            }
            onFocus={() =>
              edit.onSelect({ sectionId: "cover", field: "coupleNames" })
            }
            className={`${compact ? "text-5xl" : a4 ? "text-7xl" : "text-7xl"} mt-4 font-display leading-none`}
          />
          <InlineText
            multiline
            value={draft.introduction}
            onCommit={(value) =>
              edit.update("introduction", value, {
                sectionId: "cover",
                field: "introduction",
              })
            }
            onFocus={() =>
              edit.onSelect({ sectionId: "cover", field: "introduction" })
            }
            className="mt-5 max-w-2xl whitespace-pre-line text-base leading-7 text-white/90"
          />
          <p
            className="mt-5 text-xs font-semibold"
            style={{ color: colors.accent }}
          >
            Click visible text to edit · Select the cover to change its image
          </p>
        </div>
      </div>
    </Selectable>
  );
}

function EditableSection({
  sectionId,
  itemIds,
  edit,
  a4 = false,
}: {
  sectionId: string;
  itemIds?: string[];
  edit: EditContext;
  a4?: boolean;
}) {
  const { draft, quotation, colors } = edit;
  const title: Record<string, string> = {
    events: "Your wedding story",
    gallery: "Stories with soul",
    why: "Why couples choose us",
    addons: "Optional additions",
    payments: "Payment journey",
    delivery: "Delivery",
    testimonial: "Kind words",
    terms: "Terms",
  };
  let body: ReactNode = null;
  if (sectionId === "events")
    body = (
      <div className="grid gap-4 sm:grid-cols-2">
        {draft.events
          .filter((item) => !itemIds || itemIds.includes(item.id))
          .map((event) => (
            <Selectable
              key={event.id}
              sectionId="events"
              itemId={event.id}
              edit={edit}
              className="rounded-2xl border p-5"
              style={{ background: colors.card, borderColor: colors.border }}
            >
              <InlineText
                as="h3"
                value={event.name}
                onCommit={(value) => edit.updateEvent(event.id, "name", value)}
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "events",
                    itemId: event.id,
                    field: "name",
                  })
                }
                className="font-display text-2xl"
              />
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: colors.accent }}
              >
                {prettyDate(event.date)}
              </p>
              <InlineText
                value={event.location || "Location to be confirmed"}
                onCommit={(value) =>
                  edit.updateEvent(
                    event.id,
                    "location",
                    value === "Location to be confirmed" ? "" : value,
                  )
                }
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "events",
                    itemId: event.id,
                    field: "location",
                  })
                }
                className="mt-1 text-sm opacity-75"
              />
              <InlineText
                multiline
                value={event.notes}
                placeholder="Add event notes"
                onCommit={(value) => edit.updateEvent(event.id, "notes", value)}
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "events",
                    itemId: event.id,
                    field: "notes",
                  })
                }
                className="mt-3 text-sm opacity-75"
              />
            </Selectable>
          ))}
      </div>
    );
  if (sectionId === "gallery")
    body = (
      <div className="grid grid-cols-3 gap-3">
        {quotation.galleryPhotos
          .filter((item) => !itemIds || itemIds.includes(item.id))
          .map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() =>
                edit.onSelect({ sectionId: "gallery", itemId: photo.id })
              }
              className="overflow-hidden rounded-xl border-2 border-transparent hover:border-current"
            >
              <img
                src={photo.url}
                alt={photo.altText || photo.title}
                className="aspect-[4/5] h-full w-full object-cover"
              />
            </button>
          ))}
      </div>
    );
  if (sectionId === "why")
    body = (
      <InlineText
        multiline
        value={draft.whyDollPictures}
        onCommit={(value) =>
          edit.update("whyDollPictures", value, {
            sectionId: "why",
            field: "whyDollPictures",
          })
        }
        onFocus={() =>
          edit.onSelect({ sectionId: "why", field: "whyDollPictures" })
        }
        className="whitespace-pre-line text-base leading-8 opacity-85"
      />
    );
  if (sectionId === "addons")
    body = (
      <div className="grid gap-3 sm:grid-cols-2">
        {draft.addOns
          .filter((item) => !itemIds || itemIds.includes(item.id))
          .map((item) => (
            <Selectable
              key={item.id}
              sectionId="addons"
              itemId={item.id}
              edit={edit}
              className="rounded-2xl border p-4"
              style={{ background: colors.card, borderColor: colors.border }}
            >
              <InlineText
                value={item.name}
                onCommit={(value) => edit.updateAddOn(item.id, "name", value)}
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "addons",
                    itemId: item.id,
                    field: "name",
                  })
                }
                className="font-semibold"
              />
              <InlineText
                multiline
                value={item.description}
                placeholder="Add a description"
                onCommit={(value) =>
                  edit.updateAddOn(item.id, "description", value)
                }
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "addons",
                    itemId: item.id,
                    field: "description",
                  })
                }
                className="mt-2 text-sm opacity-70"
              />
              <p
                className="mt-3 text-sm font-bold"
                style={{ color: colors.accent }}
              >
                {item.pricingMode === "enquire"
                  ? "On request"
                  : `${item.pricingMode === "starting_from" ? "From " : ""}${money(item.price || 0)}`}
              </p>
            </Selectable>
          ))}
      </div>
    );
  if (sectionId === "payments")
    body = (
      <div className="grid grid-cols-3 gap-3">
        {draft.paymentMilestones
          .filter((item) => !itemIds || itemIds.includes(item.id))
          .map((item) => (
            <Selectable
              key={item.id}
              sectionId="payments"
              itemId={item.id}
              edit={edit}
              className="rounded-2xl border p-5 text-center"
              style={{ background: colors.card, borderColor: colors.border }}
            >
              <p
                className="font-display text-4xl"
                style={{ color: colors.accent }}
              >
                {item.percentage}%
              </p>
              <InlineText
                value={item.label}
                onCommit={(value) =>
                  edit.update(
                    "paymentMilestones",
                    draft.paymentMilestones.map((row) =>
                      row.id === item.id ? { ...row, label: value } : row,
                    ),
                    { sectionId: "payments", itemId: item.id, field: "label" },
                  )
                }
                onFocus={() =>
                  edit.onSelect({
                    sectionId: "payments",
                    itemId: item.id,
                    field: "label",
                  })
                }
                className="mt-2 text-sm font-semibold"
              />
            </Selectable>
          ))}
      </div>
    );
  if (sectionId === "delivery")
    body = (
      <InlineText
        multiline
        value={draft.deliveryInformation}
        onCommit={(value) =>
          edit.update("deliveryInformation", value, {
            sectionId: "delivery",
            field: "deliveryInformation",
          })
        }
        onFocus={() =>
          edit.onSelect({ sectionId: "delivery", field: "deliveryInformation" })
        }
        className="whitespace-pre-line text-base leading-8 opacity-85"
      />
    );
  if (sectionId === "testimonial" && quotation.testimonial)
    body = (
      <blockquote
        className="rounded-2xl border p-6"
        style={{ background: colors.card, borderColor: colors.border }}
      >
        <p className="font-display text-2xl">“{quotation.testimonial.text}”</p>
        <p className="mt-3 text-sm font-bold" style={{ color: colors.accent }}>
          {quotation.testimonial.name}
        </p>
      </blockquote>
    );
  if (sectionId === "terms")
    body = (
      <InlineText
        multiline
        value={draft.terms}
        onCommit={(value) =>
          edit.update("terms", value, { sectionId: "terms", field: "terms" })
        }
        onFocus={() => edit.onSelect({ sectionId: "terms", field: "terms" })}
        className="whitespace-pre-line text-sm leading-7 opacity-80"
      />
    );
  if (!body) return null;
  return (
    <Selectable
      sectionId={sectionId}
      edit={edit}
      className={a4 ? "py-5" : "py-10"}
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-50">
        Doll Pictures
      </p>
      <h2 className={`${a4 ? "text-4xl" : "text-5xl"} mb-7 mt-2 font-display`}>
        {title[sectionId]}
      </h2>
      {body}
    </Selectable>
  );
}

function Pricing({
  edit,
  optionIds,
  a4 = false,
}: {
  edit: EditContext;
  optionIds?: string[];
  a4?: boolean;
}) {
  const { draft, colors } = edit;
  const options = draft.options.filter(
    (item) => !optionIds || optionIds.includes(item.id),
  );
  return (
    <Selectable
      sectionId="pricing"
      edit={edit}
      className={a4 ? "py-5" : "py-10"}
    >
      <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-50">
        Your investment
      </p>
      <h2 className={`${a4 ? "text-4xl" : "text-5xl"} mb-7 mt-2 font-display`}>
        Choose the story that feels right
      </h2>
      <div
        className={`grid gap-5 ${!a4 && options.length > 1 ? "lg:grid-cols-2" : ""}`}
      >
        {options.map((option) => (
          <Selectable
            key={option.id}
            sectionId="pricing"
            itemId={option.id}
            edit={edit}
            className="relative rounded-3xl border p-6"
            style={{
              background: colors.card,
              borderColor: option.recommended ? colors.accent : colors.border,
            }}
          >
            {option.recommended && (
              <span
                className="absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: colors.accent }}
              >
                Recommended
              </span>
            )}
            <InlineText
              as="h3"
              value={option.name}
              onCommit={(value) => edit.updateOption(option.id, "name", value)}
              onFocus={() =>
                edit.onSelect({
                  sectionId: "pricing",
                  itemId: option.id,
                  field: "name",
                })
              }
              className="font-display text-3xl"
            />
            <InlineText
              multiline
              value={option.tagline}
              placeholder="Add a package tagline"
              onCommit={(value) =>
                edit.updateOption(option.id, "tagline", value)
              }
              onFocus={() =>
                edit.onSelect({
                  sectionId: "pricing",
                  itemId: option.id,
                  field: "tagline",
                })
              }
              className="mt-2 text-sm opacity-70"
            />
            <div className="mt-5 space-y-2">
              {option.lineItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 border-b border-current/10 py-2"
                >
                  <span className="font-semibold">{item.title}</span>
                  <span>{money(item.amount)}</span>
                </div>
              ))}
            </div>
            {option.discountAmount > 0 && (
              <p className="mt-3 text-sm text-emerald-600">
                Special adjustment −{money(option.discountAmount)}
              </p>
            )}
            <p
              className="mt-4 font-display text-4xl"
              style={{ color: colors.accent }}
            >
              {money(option.total)}
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {option.inclusions.map((item, index) => (
                <li
                  key={`${option.id}-inclusion-${index}`}
                  className="flex gap-2"
                >
                  <span style={{ color: colors.accent }}>✓</span>
                  <InlineText
                    value={item}
                    onCommit={(value) =>
                      edit.updateList(option.id, "inclusions", index, value)
                    }
                    onFocus={() =>
                      edit.onSelect({
                        sectionId: "pricing",
                        itemId: option.id,
                        field: `inclusions.${index}`,
                      })
                    }
                  />
                </li>
              ))}
            </ul>
            {!!option.deliverables.length && (
              <div className="mt-5 border-t border-current/10 pt-4">
                <p className="text-xs font-bold uppercase opacity-50">
                  Deliverables
                </p>
                {option.deliverables.map((item, index) => (
                  <InlineText
                    key={`${option.id}-deliverable-${index}`}
                    value={item}
                    onCommit={(value) =>
                      edit.updateList(option.id, "deliverables", index, value)
                    }
                    onFocus={() =>
                      edit.onSelect({
                        sectionId: "pricing",
                        itemId: option.id,
                        field: `deliverables.${index}`,
                      })
                    }
                    className="mt-2 text-sm"
                  />
                ))}
              </div>
            )}
          </Selectable>
        ))}
      </div>
    </Selectable>
  );
}

function Closing({ edit, a4 = false }: { edit: EditContext; a4?: boolean }) {
  return (
    <Selectable
      sectionId="closing"
      edit={edit}
      className={`${a4 ? "py-16" : "py-12"} text-center`}
    >
      <InlineText
        multiline
        value={edit.draft.closingMessage}
        onCommit={(value) =>
          edit.update("closingMessage", value, {
            sectionId: "closing",
            field: "closingMessage",
          })
        }
        onFocus={() =>
          edit.onSelect({ sectionId: "closing", field: "closingMessage" })
        }
        className="mx-auto max-w-2xl whitespace-pre-line font-display text-3xl leading-relaxed"
      />
      <p className="mt-8 text-sm opacity-60">
        Valid until {prettyDate(edit.draft.validUntil)}
      </p>
    </Selectable>
  );
}

function BrandFooter({
  quotation,
  colors,
}: {
  quotation: PublicWeddingQuotation;
  colors: EditContext["colors"];
}) {
  return (
    <footer
      className="border-t px-6 py-10 text-center"
      style={{ borderColor: colors.border }}
    >
      <img
        src={quotation.brand.logoUrl || "/logo-doll.png"}
        alt=""
        className="mx-auto h-14 w-14 rounded-full object-cover"
      />
      <p className="mt-3 font-display text-2xl">Doll Pictures</p>
      <p className="mt-1 text-sm" style={{ color: colors.accent }}>
        Stories, beautifully remembered
      </p>
    </footer>
  );
}

function Selectable({
  sectionId,
  itemId,
  edit,
  className = "",
  style,
  children,
}: {
  sectionId: string;
  itemId?: string;
  edit: EditContext;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  const selected =
    edit.selection?.sectionId === sectionId &&
    (!itemId || edit.selection.itemId === itemId);
  return (
    <section
      data-canvas-section={sectionId}
      data-canvas-item={itemId}
      onClick={(event) => {
        event.stopPropagation();
        edit.onSelect({ sectionId, ...(itemId ? { itemId } : {}) });
      }}
      className={`relative outline-offset-4 transition ${selected ? "outline outline-2 outline-blue-500" : "hover:outline hover:outline-1 hover:outline-blue-400/60"} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

function InlineText({
  as: Tag = "div",
  value,
  placeholder = "Click to add text",
  multiline = false,
  onCommit,
  onFocus,
  className = "",
}: {
  as?: ElementType;
  value: string;
  placeholder?: string;
  multiline?: boolean;
  onCommit: (value: string) => void;
  onFocus: () => void;
  className?: string;
}) {
  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!multiline && event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck
      onFocus={onFocus}
      onKeyDown={keyDown}
      onBlur={(event: React.FocusEvent<HTMLElement>) =>
        onCommit(event.currentTarget.innerText.trim())
      }
      data-placeholder={placeholder}
      className={`min-h-[1em] cursor-text rounded-sm outline-none empty:before:text-current/40 empty:before:content-[attr(data-placeholder)] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent ${className}`}
    >
      {value}
    </Tag>
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
function prettyDate(value: string) {
  if (!value) return "Date to be confirmed";
  return new Date(`${value}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
