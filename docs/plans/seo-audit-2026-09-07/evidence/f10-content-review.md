# F10 media inventory and studio review

Local code audit, 8 September 2026. This is not an inspection of production media or proof of client consent.

| Surface / source | Classification and implementation | Studio owner follow-up |
|---|---|---|
| Home selected stories, `/work`, Contact hero — `SiteDataContext` featured photos | Published CMS records retained with authored alt/title/location/year. Six stock fallback sessions removed from runtime defaults; empty/failure starts with no portfolio images. | Review each published photo ID/URL, original studio authorship, category slug, caption/alt, location/year, and client publication permission. |
| Home editorial images, `/gallery` — gallery photos | Twelve stock defaults removed. A successful empty gallery is authoritative; no cross-population from featured results. A failed refresh retains already loaded records. | Confirm published gallery identity and permission. Untagged images may appear in general galleries but cannot populate category packages. |
| Package category pages | Only featured/gallery photos tagged with the page category slug are eligible; whitespace/case and toddler plural alias normalized. Unrelated categories and untagged records excluded. First eligible image is now retained. | Supply correctly tagged approved photos for empty categories. Verify especially pre-wedding versus wedding, baby shower versus maternity, and toddler versus milestone. |
| Scroll storytelling | Five stock scene defaults removed; empty scenes render no visual section. Existing CMS scenes retained. | Review imagery and accompanying claims before publishing scenes. |
| Non-rendered service HTML | 48 seed fallback image references across six service definitions no longer emit as “Selected work”. They remain in source data for historical compatibility; studio attribution removed from their alt strings. No media files or stored CMS assets deleted. | Do not approve these stock references as original work. Publish approved section images via CMS instead. |
| Rendered service pages, service preview images | Existing category-scoped CMS media and missing-local-image rejection preserved. | Verify actual CDN delivery and relevance; existing code cannot establish ownership or consent. |
| Contact without featured media | Text, contact details and enquiry flow remain available without an image. | No replacement is required for functionality; choose an approved original only if desired. |

For each proposed original/replacement, record: photo ID, URL, category slug(s), owner/photographer, approval date, client consent reference, authored alt/caption, verified location and year. Leave unknown fields blank; do not infer them from stock imagery or filenames.

No new/replacement media was published by this change. Pending owner: studio content owner. Next action: review actual published CMS records using the fields above, and provide approved originals for categories with no eligible photos. Frontend owner then verifies deployed image status/content type, direct entry and navigation on priority pages. Production inventory and approval remain pending.
