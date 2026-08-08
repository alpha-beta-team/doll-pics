import { Plus, Trash2, X } from "lucide-react";
import type {
  QuotationAssets,
  QuotationDraft,
  QuotationOption,
} from "../types";
import { calculateQuotationOption } from "../quotationForm";
import type { QuotationSelection } from "./state";
import { validateQuotationCanvasDraft } from "./state";
import { recommendQuotationOption, toggleGalleryPhoto } from "./helpers";

const control =
  "mt-1 min-h-11 w-full rounded-xl border border-admin-control bg-admin-surface px-3 text-sm text-admin-text outline-none focus:border-admin-focus focus:ring-2 focus:ring-admin-focus/30";
const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;

export function QuotationInspector({
  draft,
  assets,
  selection,
  onEdit,
  onClose,
}: {
  draft: QuotationDraft;
  assets: QuotationAssets;
  selection?: QuotationSelection;
  onEdit: (draft: QuotationDraft, selection?: QuotationSelection) => void;
  onClose?: () => void;
}) {
  const section = selection?.sectionId || "cover";
  const issues = validateQuotationCanvasDraft(draft).filter(
    (issue) => issue.sectionId === section,
  );
  const set = <K extends keyof QuotationDraft>(
    key: K,
    value: QuotationDraft[K],
  ) => onEdit({ ...draft, [key]: value }, selection);
  return (
    <div className="flex h-full flex-col bg-admin-elevated text-admin-text">
      <header className="flex items-center justify-between border-b border-admin-border p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-admin-subtle">
            Properties
          </p>
          <h2 className="mt-1 text-lg font-semibold capitalize">
            {section === "pricing" ? "Package option" : section}
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-admin-border"
            aria-label="Close properties"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {issues.length > 0 && (
          <div className="mb-4 space-y-1 rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200">
            {issues.map((issue) => (
              <p key={issue.message}>{issue.message}</p>
            ))}
          </div>
        )}
        {section === "cover" && (
          <CoverInspector draft={draft} assets={assets} set={set} />
        )}
        {section === "events" && (
          <EventsInspector
            draft={draft}
            selectedId={selection?.itemId}
            set={set}
          />
        )}
        {section === "pricing" && (
          <PricingInspector
            draft={draft}
            assets={assets}
            selectedId={selection?.itemId}
            set={set}
          />
        )}
        {section === "gallery" && (
          <GalleryInspector draft={draft} assets={assets} set={set} />
        )}
        {section === "addons" && (
          <AddOnInspector
            draft={draft}
            selectedId={selection?.itemId}
            set={set}
          />
        )}
        {section === "payments" && (
          <PaymentsInspector draft={draft} set={set} />
        )}
        {section === "testimonial" && (
          <SelectField
            label="Testimonial"
            value={draft.testimonialId}
            onChange={(value) => set("testimonialId", value)}
            options={[
              { value: "", label: "No testimonial" },
              ...assets.testimonials.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            ]}
          />
        )}
        {section === "why" && (
          <TextArea
            label="Why Doll Pictures"
            value={draft.whyDollPictures}
            onChange={(value) => set("whyDollPictures", value)}
          />
        )}
        {section === "delivery" && (
          <TextArea
            label="Delivery information"
            value={draft.deliveryInformation}
            onChange={(value) => set("deliveryInformation", value)}
          />
        )}
        {section === "terms" && (
          <TextArea
            label="Terms"
            value={draft.terms}
            onChange={(value) => set("terms", value)}
            rows={10}
          />
        )}
        {section === "closing" && (
          <TextArea
            label="Closing message"
            value={draft.closingMessage}
            onChange={(value) => set("closingMessage", value)}
          />
        )}
        {section === "footer" && (
          <p className="rounded-xl border border-admin-border bg-admin-surface p-4 text-sm text-admin-secondary">
            The Doll Pictures logo, website and contact footer are mandatory and
            use the published brand settings.
          </p>
        )}
      </div>
    </div>
  );
}

function CoverInspector({
  draft,
  assets,
  set,
}: {
  draft: QuotationDraft;
  assets: QuotationAssets;
  set: Setter;
}) {
  return (
    <div className="space-y-4">
      <Input
        label="Customer name (private)"
        value={draft.customerName}
        onChange={(value) => set("customerName", value)}
      />
      <Input
        label="Phone (private)"
        value={draft.customerPhone}
        onChange={(value) => set("customerPhone", value)}
      />
      <Input
        label="Email (private)"
        value={draft.customerEmail}
        onChange={(value) => set("customerEmail", value)}
      />
      <Input
        label="Couple names"
        value={draft.coupleNames}
        onChange={(value) => set("coupleNames", value)}
      />
      <Input
        label="Quotation title"
        value={draft.weddingTitle}
        onChange={(value) => set("weddingTitle", value)}
      />
      <Input
        label="Valid until"
        type="date"
        value={draft.validUntil}
        onChange={(value) => set("validUntil", value)}
      />
      <SelectField
        label="Palette"
        value={draft.palette}
        onChange={(value) => set("palette", value as QuotationDraft["palette"])}
        options={[
          { value: "champagne", label: "Champagne and ivory" },
          { value: "blush", label: "Blush and wine" },
          { value: "midnight", label: "Midnight and gold" },
        ]}
      />
      <TextArea
        label="Introduction"
        value={draft.introduction}
        onChange={(value) => set("introduction", value)}
      />
      <PhotoPicker
        label="Cover photograph"
        photos={assets.photos}
        selected={[draft.coverPhotoId]}
        onToggle={(id) => set("coverPhotoId", id)}
        single
      />
    </div>
  );
}

function EventsInspector({
  draft,
  selectedId,
  set,
}: {
  draft: QuotationDraft;
  selectedId?: string;
  set: Setter;
}) {
  const rows = selectedId
    ? draft.events.filter((item) => item.id === selectedId)
    : draft.events;
  const update = (
    id: string,
    patch: Partial<QuotationDraft["events"][number]>,
  ) =>
    set(
      "events",
      draft.events.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  return (
    <div className="space-y-4">
      {rows.map((event) => (
        <div
          key={event.id}
          className="space-y-3 rounded-xl border border-admin-border bg-admin-surface p-3"
        >
          <Input
            label="Event name"
            value={event.name}
            onChange={(value) => update(event.id, { name: value })}
          />
          <Input
            label="Date"
            type="date"
            value={event.date}
            onChange={(value) => update(event.id, { date: value })}
          />
          <Input
            label="Location"
            value={event.location}
            onChange={(value) => update(event.id, { location: value })}
          />
          <TextArea
            label="Notes"
            value={event.notes}
            onChange={(value) => update(event.id, { notes: value })}
          />
          <RemoveButton
            label="Remove event"
            onClick={() =>
              set(
                "events",
                draft.events.filter((item) => item.id !== event.id),
              )
            }
          />
        </div>
      ))}
      <AddButton
        label="Add wedding event"
        onClick={() =>
          set("events", [
            ...draft.events,
            {
              id: uid("event"),
              name: "Wedding event",
              date: "",
              location: "",
              notes: "",
            },
          ])
        }
      />
    </div>
  );
}

function PricingInspector({
  draft,
  assets,
  selectedId,
  set,
}: {
  draft: QuotationDraft;
  assets: QuotationAssets;
  selectedId?: string;
  set: Setter;
}) {
  const option =
    draft.options.find((item) => item.id === selectedId) || draft.options[0];
  const patch = (value: Partial<QuotationOption>) =>
    option &&
    set(
      "options",
      draft.options.map((item) =>
        item.id === option.id
          ? calculateQuotationOption({ ...item, ...value })
          : item,
      ),
    );
  const prefill = (id: string) => {
    const pkg = assets.packages.find((item) => item.id === id);
    if (!pkg || !option) return;
    const price = Number(pkg.price || 0);
    patch({
      name: pkg.name,
      tagline: pkg.description,
      inclusions: pkg.inclusions,
      advanceAmount: Number(pkg.advanceAmount || 0),
      lineItems: [
        {
          id: uid("line"),
          eventId: draft.events[0]?.id || "",
          title: pkg.name,
          description: pkg.description,
          quantity: 1,
          unitPrice: price,
          amount: price,
        },
      ],
    });
  };
  if (!option)
    return (
      <AddButton
        label="Add package option"
        onClick={() => set("options", [...draft.options, emptyOption()])}
      />
    );
  return (
    <div className="space-y-4">
      <SelectField
        label="Prefill from package"
        value=""
        onChange={prefill}
        options={[
          { value: "", label: "Choose package…" },
          ...assets.packages.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ]}
      />
      <Input
        label="Option name"
        value={option.name}
        onChange={(value) => patch({ name: value })}
      />
      <TextArea
        label="Tagline"
        value={option.tagline}
        onChange={(value) => patch({ tagline: value })}
      />
      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-admin-border bg-admin-surface px-3 text-sm">
        <input
          type="checkbox"
          checked={option.recommended}
          onChange={(event) =>
            set(
              "options",
              recommendQuotationOption(
                draft.options,
                option.id,
                event.target.checked,
              ),
            )
          }
          className="h-5 w-5"
        />
        Recommended option
      </label>
      <div>
        <p className="text-sm font-semibold">Pricing lines</p>
        {option.lineItems.map((line, index) => (
          <div
            key={line.id}
            className="mt-2 space-y-2 rounded-xl border border-admin-border bg-admin-surface p-3"
          >
            <Input
              label="Service"
              value={line.title}
              onChange={(value) =>
                patch({
                  lineItems: option.lineItems.map((item, i) =>
                    i === index ? { ...item, title: value } : item,
                  ),
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Quantity"
                value={line.quantity}
                onChange={(value) =>
                  patch({
                    lineItems: option.lineItems.map((item, i) =>
                      i === index ? { ...item, quantity: value } : item,
                    ),
                  })
                }
              />
              <NumberInput
                label="Unit price"
                value={line.unitPrice}
                onChange={(value) =>
                  patch({
                    lineItems: option.lineItems.map((item, i) =>
                      i === index ? { ...item, unitPrice: value } : item,
                    ),
                  })
                }
              />
            </div>
            <RemoveButton
              label="Remove line"
              onClick={() =>
                patch({
                  lineItems: option.lineItems.filter((_, i) => i !== index),
                })
              }
            />
          </div>
        ))}
        <AddButton
          label="Add pricing line"
          onClick={() =>
            patch({
              lineItems: [
                ...option.lineItems,
                {
                  id: uid("line"),
                  eventId: "",
                  title: "Photography service",
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  amount: 0,
                },
              ],
            })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Discount"
          value={option.discountAmount}
          onChange={(value) => patch({ discountAmount: value })}
        />
        <NumberInput
          label="Advance"
          value={option.advanceAmount}
          onChange={(value) => patch({ advanceAmount: value })}
        />
      </div>
      <p className="rounded-xl bg-admin-surface p-3 text-sm">
        Calculated total{" "}
        <strong className="float-right text-admin-text">
          ₹{calculateQuotationOption(option).total.toLocaleString("en-IN")}
        </strong>
      </p>
      <StringList
        label="Inclusions"
        values={option.inclusions}
        onChange={(values) => patch({ inclusions: values })}
      />
      <StringList
        label="Deliverables"
        values={option.deliverables}
        onChange={(values) => patch({ deliverables: values })}
      />
      <RemoveButton
        label="Remove package option"
        onClick={() =>
          set(
            "options",
            draft.options.filter((item) => item.id !== option.id),
          )
        }
      />
      {draft.options.length < 3 && (
        <AddButton
          label="Add package option"
          onClick={() => set("options", [...draft.options, emptyOption()])}
        />
      )}
    </div>
  );
}

function GalleryInspector({
  draft,
  assets,
  set,
}: {
  draft: QuotationDraft;
  assets: QuotationAssets;
  set: Setter;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const next = [...draft.galleryPhotoIds];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("galleryPhotoIds", next);
  };
  return (
    <div className="space-y-4">
      {!!draft.galleryPhotoIds.length && (
        <div>
          <p className="text-sm font-semibold text-admin-secondary">
            Gallery order
          </p>
          <div className="mt-2 space-y-2">
            {draft.galleryPhotoIds.map((id, index) => {
              const photo = assets.photos.find((item) => item.id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface p-2"
                >
                  <img
                    src={photo?.url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {photo?.title || `Photo ${index + 1}`}
                  </span>
                  <button
                    disabled={!index}
                    onClick={() => move(index, -1)}
                    className="h-10 w-10 disabled:opacity-20"
                    aria-label="Move photo earlier"
                  >
                    ↑
                  </button>
                  <button
                    disabled={index === draft.galleryPhotoIds.length - 1}
                    onClick={() => move(index, 1)}
                    className="h-10 w-10 disabled:opacity-20"
                    aria-label="Move photo later"
                  >
                    ↓
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <PhotoPicker
        label={`Portfolio gallery (${draft.galleryPhotoIds.length}/6)`}
        photos={assets.photos}
        selected={draft.galleryPhotoIds}
        onToggle={(id) =>
          set("galleryPhotoIds", toggleGalleryPhoto(draft.galleryPhotoIds, id))
        }
      />
    </div>
  );
}

function AddOnInspector({
  draft,
  selectedId,
  set,
}: {
  draft: QuotationDraft;
  selectedId?: string;
  set: Setter;
}) {
  const item =
    draft.addOns.find((row) => row.id === selectedId) || draft.addOns[0];
  const patch = (value: Partial<NonNullable<typeof item>>) =>
    item &&
    set(
      "addOns",
      draft.addOns.map((row) =>
        row.id === item.id ? { ...row, ...value } : row,
      ),
    );
  return (
    <div className="space-y-4">
      {item && (
        <>
          <Input
            label="Name"
            value={item.name}
            onChange={(value) => patch({ name: value })}
          />
          <TextArea
            label="Description"
            value={item.description}
            onChange={(value) => patch({ description: value })}
          />
          <SelectField
            label="Pricing"
            value={item.pricingMode}
            onChange={(value) =>
              patch({
                pricingMode: value as typeof item.pricingMode,
                ...(value === "enquire" ? { price: undefined } : {}),
              })
            }
            options={[
              { value: "fixed", label: "Fixed price" },
              { value: "starting_from", label: "Starting from" },
              { value: "enquire", label: "On request" },
            ]}
          />
          {item.pricingMode !== "enquire" && (
            <NumberInput
              label="Price"
              value={item.price || 0}
              onChange={(value) => patch({ price: value })}
            />
          )}
          <RemoveButton
            label="Remove add-on"
            onClick={() =>
              set(
                "addOns",
                draft.addOns.filter((row) => row.id !== item.id),
              )
            }
          />
        </>
      )}
      <AddButton
        label="Add optional add-on"
        onClick={() =>
          set("addOns", [
            ...draft.addOns,
            {
              id: uid("addon"),
              name: "Optional add-on",
              description: "",
              pricingMode: "fixed",
              price: 0,
            },
          ])
        }
      />
    </div>
  );
}

function PaymentsInspector({
  draft,
  set,
}: {
  draft: QuotationDraft;
  set: Setter;
}) {
  const total = draft.paymentMilestones.reduce(
    (sum, item) => sum + Number(item.percentage),
    0,
  );
  return (
    <div className="space-y-3">
      {draft.paymentMilestones.map((item, index) => (
        <div
          key={item.id}
          className="rounded-xl border border-admin-border bg-admin-surface p-3"
        >
          <Input
            label="Milestone"
            value={item.label}
            onChange={(value) =>
              set(
                "paymentMilestones",
                draft.paymentMilestones.map((row, i) =>
                  i === index ? { ...row, label: value } : row,
                ),
              )
            }
          />
          <NumberInput
            label="Percentage"
            value={item.percentage}
            onChange={(value) =>
              set(
                "paymentMilestones",
                draft.paymentMilestones.map((row, i) =>
                  i === index ? { ...row, percentage: value } : row,
                ),
              )
            }
          />
          <RemoveButton
            label="Remove"
            onClick={() =>
              set(
                "paymentMilestones",
                draft.paymentMilestones.filter((_, i) => i !== index),
              )
            }
          />
        </div>
      ))}
      <p
        className={`rounded-xl p-3 text-sm font-bold ${total === 100 ? "bg-emerald-950/40 text-emerald-300" : "bg-red-950/40 text-red-300"}`}
      >
        Total {total}%
      </p>
      <AddButton
        label="Add milestone"
        onClick={() =>
          set("paymentMilestones", [
            ...draft.paymentMilestones,
            { id: uid("payment"), label: "Payment milestone", percentage: 0 },
          ])
        }
      />
    </div>
  );
}

type Setter = <K extends keyof QuotationDraft>(
  key: K,
  value: QuotationDraft[K],
) => void;
function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-admin-secondary">
      {label}
      <input
        className={control}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-medium text-admin-secondary">
      {label}
      <input
        className={control}
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium text-admin-secondary">
      {label}
      <textarea
        className={`${control} py-3`}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm font-medium text-admin-secondary">
      {label}
      <select
        className={control}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-admin-primary bg-admin-primary/10 px-3 text-sm font-semibold text-blue-300"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex min-h-10 items-center gap-2 text-sm font-semibold text-red-300"
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </button>
  );
}
function PhotoPicker({
  label,
  photos,
  selected,
  onToggle,
  single = false,
}: {
  label: string;
  photos: QuotationAssets["photos"];
  selected: string[];
  onToggle: (id: string) => void;
  single?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-admin-secondary">{label}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            type="button"
            key={photo.id}
            onClick={() => onToggle(photo.id)}
            className={`overflow-hidden rounded-xl border-2 ${selected.includes(photo.id) ? "border-blue-500 ring-2 ring-blue-500/30" : "border-admin-border"}`}
            aria-pressed={selected.includes(photo.id)}
          >
            <img
              src={photo.url}
              alt={photo.altText || photo.title}
              className="aspect-square w-full object-cover"
            />
          </button>
        ))}
      </div>
      {!photos.length && (
        <p className="mt-2 text-sm text-admin-subtle">
          No published portfolio images are available.
        </p>
      )}
      {single && selected[0] && (
        <p className="mt-2 text-xs text-admin-subtle">
          The selected image is used as the full-page cover.
        </p>
      )}
    </div>
  );
}
function StringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-admin-secondary">{label}</p>
      {values.map((value, index) => (
        <div key={`${label}-${index}`} className="mt-2 flex gap-2">
          <input
            className={control.replace("mt-1", "mt-0")}
            value={value}
            onChange={(event) =>
              onChange(
                values.map((row, i) =>
                  i === index ? event.target.value : row,
                ),
              )
            }
          />
          <button
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            className="h-11 w-11 shrink-0 text-red-300"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, "New item"])}
        className="mt-2 text-sm font-semibold text-blue-300"
      >
        + Add {label.toLowerCase()}
      </button>
    </div>
  );
}
function emptyOption(): QuotationOption {
  return {
    id: uid("option"),
    name: "New package",
    tagline: "",
    recommended: false,
    lineItems: [],
    inclusions: [],
    deliverables: [],
    discountAmount: 0,
    subtotal: 0,
    total: 0,
    advanceAmount: 0,
  };
}
