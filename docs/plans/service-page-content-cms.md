# Service Page Content CMS — Permanent Solution

**Created:** 11 Aug 2026  
**Status:** Proposed  
**Scope:** `doll-pics` frontend/admin and `photography-cms-backend`

## Outcome

Every published service can have complete landing-page content managed from the admin UI, including experience sections, FAQs, related links, and its media-category mapping. Creating a new service must not require manually editing `src/data/service-pages.json`.

## Current problem

Published services are loaded from the CMS `serviceNavLinks` array. The current CMS service model contains navigation, introductory, and SEO fields only:

- label and public path
- card description, icon, and image
- SEO title and description
- page heading and lead
- display order and publication status

Rich landing-page content still comes from `src/data/service-pages.json`. When a service path is not present in that file, `resolveServicePage()` generates a minimal page with empty arrays:

```ts
sections: [];
faqs: [];
```

`ServicePage.tsx` renders the Experience and FAQ blocks only when those arrays contain items. This is why a CMS-created page such as `/toddler-baby-photography-erode` gets its route, hero copy, navigation entry, sitemap entry, and gallery, but not the rich content sections.

## Architecture decision

Use the CMS as the source of truth for service landing-page content. Keep `service-pages.json` temporarily as a backward-compatible fallback while existing services are migrated.

The data flow will be:

```text
Admin service editor
        ↓
PUT /api/admin/site-content
        ↓
MongoDB serviceNavLinks subdocument
        ↓
GET /api/site-content
        ↓
Runtime service page + build-time prerendering
```

This plan extends the existing embedded service model. A separate `services` collection is unnecessary at the current content volume, but can be considered later if services require independent permissions, revision history, or concurrent editing.

## Target service content model

Add the following optional fields to each service:

```ts
type ServiceContentSection = {
  heading: string;
  paragraphs: string[];
};

type ServiceFaq = {
  question: string;
  answer: string;
};

type ServiceRelatedLink = {
  label: string;
  path: string;
};

type ServiceNavLink = {
  // Existing fields remain unchanged.
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

  // New landing-page fields.
  sections?: ServiceContentSection[];
  faqs?: ServiceFaq[];
  related?: ServiceRelatedLink[];
  imageCategorySlug?: string;
};
```

`imageCategorySlug` explicitly connects the service page to its photo category. It avoids relying on a label-derived slug, which can break when a service is renamed.

Do not move `fallbackImages` into the CMS as part of this change. Service pages currently use published category media from the API. Static fallback images can remain a legacy/build fallback until they are deliberately removed.

## Backend implementation

Repository: `photography-cms-backend`

### 1. Add nested schemas

In `src/site-content/schemas/site-content.schema.ts`:

- Add a `ServiceContentSection` subdocument with `heading` and `paragraphs`.
- Add a `ServiceFaq` subdocument with `question` and `answer`.
- Add a `ServiceRelatedLink` subdocument with `label` and `path`.
- Add optional `sections`, `faqs`, `related`, and `imageCategorySlug` properties to `ServiceNavLink`.
- Use `_id: false` for section, FAQ, and related-link subdocuments unless stable item IDs are required for drag-and-drop editing.

The new array fields should remain optional for legacy records during migration. Avoid silently writing empty arrays onto every old service before its static content has been migrated.

### 2. Extend request validation

In `src/site-content/dto/site-content.dto.ts`:

- Add nested DTOs for sections, FAQs, and related links.
- Validate arrays with `@IsArray()` and `@ValidateNested({ each: true })`.
- Validate paragraph arrays with `@IsString({ each: true })`.
- Validate `imageCategorySlug` as an optional string.
- Apply sensible maximum lengths to headings, questions, answers, paragraphs, labels, and paths.

### 3. Normalize saved content

Before persistence:

- Trim all strings.
- Remove completely blank sections and FAQs.
- Remove blank paragraphs from otherwise valid sections.
- Normalize related paths so they begin with `/` and contain no query string or fragment.
- Normalize `imageCategorySlug` to lowercase kebab case.
- Preserve section and FAQ order.

Do not accept HTML from these fields. They should remain plain text and be rendered through React escaping.

### 4. Use the explicit media-category slug

Update the category synchronization logic to prefer `service.imageCategorySlug`. Fall back to the existing slugified service label for legacy data.

### 5. Trigger frontend regeneration

Update `src/frontend-deploy/seo-change.util.ts` so changes to these fields request a frontend rebuild:

- `sections`
- `faqs`
- `related`
- `imageCategorySlug`

The live React application can read these fields immediately, but a rebuild is still required to update prerendered no-JavaScript content and FAQ structured data.

## Frontend data implementation

Repository: `doll-pics`

### 1. Extend shared types

Update `src/shared/types/index.ts`:

- Add the three nested content types.
- Add the new optional fields to `ServiceNavLink` and `ServiceNavLinkInput`.
- Ensure the public `SiteContent` response retains the fields.

### 2. Preserve fields in API mappers

Update `src/admin/api/mappers.ts` and `src/lib/navigation.ts`:

- Map and normalize `sections`, `faqs`, `related`, and `imageCategorySlug`.
- Do not accidentally drop these fields while sorting or renumbering services.
- Deep-copy nested arrays in service editor helpers so editing one form does not mutate the service list baseline.

### 3. Merge CMS content with legacy JSON

Extend `ServiceNavLinkLike` in `src/lib/seo-core.ts` and change `resolveServicePage()` to use this precedence:

1. CMS value when the field is present.
2. Matching `service-pages.json` value for an unmigrated legacy service.
3. Generated fallback for a service without either source.

Conceptually:

```ts
return {
  ...base,
  title: pick(nav?.seoTitle, base.title),
  description: pick(nav?.seoDescription, base.description),
  heading: pick(nav?.heading, base.heading),
  lead: pick(nav?.lead, base.lead),
  sections: nav?.sections ?? base.sections,
  faqs: nav?.faqs ?? base.faqs,
  related: nav?.related ?? base.related,
  imageCategories: nav?.imageCategorySlug
    ? [nav.imageCategorySlug]
    : base.imageCategories,
};
```

The distinction between `undefined` and `[]` is intentional:

- `undefined` means the legacy JSON fallback has not yet been migrated.
- `[]` means an editor deliberately saved no items and the section should be hidden.

### 4. Fetch media by explicit slug

Update `ServicePage.tsx` so `resolveApiServiceCategory()` first uses the CMS `imageCategorySlug`, then keeps the current path/label-derived behavior as a legacy fallback.

No changes are required to `ServiceExperience` or `ServiceFaq`; they already render non-empty arrays correctly.

## Admin editor implementation

Extend the Page Content tab in `src/admin/pages/ServiceEditorPage.tsx`.

### Experience sections

Provide a repeatable editor that supports:

- Add section.
- Edit section heading.
- Add and remove paragraphs.
- Reorder sections.
- Delete section with confirmation.
- Reorder paragraphs if the UI supports it cleanly.

### FAQs

Provide a repeatable editor that supports:

- Add FAQ.
- Edit question and answer.
- Reorder FAQs.
- Delete FAQ with confirmation.

### Related links

Prefer a service selector over unrestricted manual URLs for service links. Also permit approved core routes such as `/packages`, `/booking`, `/stories`, and `/work`.

Prevent:

- A service linking to itself.
- Duplicate related paths.
- Links to draft services.
- Invalid external URLs in a field intended for internal paths.

### Media category

Use a select populated from service photo categories. Store the category slug rather than its display label.

### Publication validation

A draft may be saved with incomplete content. Before publishing, require:

- Service label and unique public path.
- Page heading and lead.
- SEO title and meta description.
- At least one Experience section with a heading and paragraph.
- At least one FAQ.
- A valid media-category slug, or an explicit confirmation that the page has no gallery yet.

Show validation errors in the relevant editor tab and focus the first invalid field.

## Migration

Create an idempotent backend migration that reads the six existing entries from `src/data/service-pages.json` or an equivalent checked-in migration payload and copies these fields into matching CMS services by normalized path:

- `sections`
- `faqs`
- `related`
- the appropriate `imageCategorySlug`

Migration requirements:

- Do not overwrite non-empty CMS content.
- Report unmatched JSON paths and unmatched CMS services.
- Support a dry-run mode.
- Preserve the original array order.
- Be safe to run more than once.

After the migration, manually enter and approve rich content for services that were created only in the CMS, including Toddler Baby Shoots.

Keep `service-pages.json` for at least one release as a fallback. Remove or reduce it only after production API responses, prerendered HTML, and structured data have been verified for every published service.

## Deployment order

1. Deploy the backend schema and DTO changes while all new fields remain optional.
2. Run the migration in dry-run mode and review its report.
3. Run the production migration.
4. Deploy the frontend types, resolver, media mapping, and admin editor.
5. Complete rich content for CMS-only services and publish it.
6. Trigger a frontend production rebuild.
7. Verify live rendered pages and prerendered HTML.
8. Remove the static JSON dependency in a later release only after all acceptance criteria pass.

Deploying the backend first keeps the old frontend compatible. The frontend must not start preferring empty CMS arrays until legacy content has been migrated or the `undefined` fallback behavior has been confirmed.

## Testing

### Backend tests

- [ ] Accept valid nested sections, FAQs, related links, and category slug.
- [ ] Reject malformed nested objects and non-string paragraphs.
- [ ] Reject invalid internal related paths.
- [ ] Preserve array order.
- [ ] Confirm plain text is stored without interpreting HTML.
- [ ] Confirm content changes request a frontend deploy.
- [ ] Confirm the migration is idempotent and does not overwrite CMS-authored content.

### Frontend unit tests

- [ ] A legacy static service uses JSON sections when CMS fields are absent.
- [ ] CMS sections override matching JSON sections.
- [ ] An explicit empty CMS array hides a section.
- [ ] A newly created CMS service renders Experience and FAQs.
- [ ] Admin mappers preserve all nested fields.
- [ ] Reorder helpers do not mutate the original arrays.
- [ ] The explicit image category slug takes precedence over label-derived mapping.

### Admin interaction tests

- [ ] Add, edit, reorder, and remove an Experience section.
- [ ] Add, edit, reorder, and remove an FAQ.
- [ ] Unsaved-change protection detects nested edits.
- [ ] Draft saving permits incomplete content.
- [ ] Publishing blocks incomplete required content.
- [ ] Reloading the editor returns exactly the saved order and values.

### Build and SEO tests

- [ ] `npm run typecheck`
- [ ] `npm run lint` has no new errors.
- [ ] `npm run test:lib`
- [ ] `npm run test:admin`
- [ ] Backend tests pass.
- [ ] `npm run build`
- [ ] Prerendered HTML includes Experience content for CMS-only services.
- [ ] Prerendered HTML includes FAQ structured data when FAQs exist.
- [ ] Draft services are absent from routes, navigation, and sitemap.

## Production verification

For `/toddler-baby-photography-erode` and at least one legacy service:

- [ ] Route returns HTTP 200.
- [ ] H1 and lead match the CMS.
- [ ] Experience navigation and content are visible.
- [ ] Gallery uses the configured service category.
- [ ] FAQ section is visible and keyboard accessible.
- [ ] Page source contains the expected title, description, canonical, service JSON-LD, and FAQ JSON-LD.
- [ ] Related links work and do not point to drafts.
- [ ] The page remains present in `/sitemap.xml`.
- [ ] Mobile layout and booking actions still work.

## Acceptance criteria

- [ ] A new service can be created, fully authored, previewed, and published from the admin UI without editing frontend JSON.
- [ ] Published CMS sections and FAQs appear at runtime and in prerendered HTML.
- [ ] Existing six service pages retain their current content throughout migration.
- [ ] Editors can intentionally hide Experience or FAQ content by saving an empty array.
- [ ] Service-to-photo-category mapping survives service label changes.
- [ ] FAQ structured data matches the FAQs visible on the page.
- [ ] Draft and incomplete services cannot accidentally enter navigation or the sitemap.
- [ ] `service-pages.json` is documented as a temporary fallback, not the source for future services.

## Likely files

### `doll-pics`

- `src/shared/types/index.ts`
- `src/lib/navigation.ts`
- `src/lib/seo-core.ts`
- `src/pages/ServicePage.tsx`
- `src/admin/api/mappers.ts`
- `src/admin/pages/ServiceEditorPage.tsx`
- `src/admin/services/serviceNavLinks.ts`
- `scripts/lib/seo-build.ts`
- Related frontend and admin test files

### `photography-cms-backend`

- `src/site-content/schemas/site-content.schema.ts`
- `src/site-content/dto/site-content.dto.ts`
- `src/site-content/site-content.service.ts`
- `src/categories/categories.service.ts`
- `src/frontend-deploy/seo-change.util.ts`
- New service-content migration script
- Related backend test files

## Out of scope

- AI-generated service copy.
- A general-purpose page builder.
- Arbitrary HTML or rich-text blocks.
- Moving portfolio photos into service content records.
- Removing `service-pages.json` in the same release as the migration.
