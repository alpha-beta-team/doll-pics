# Doll Pictures

Cinematic photography portfolio site for `Doll Pictures by Ramya Vignesh`, built as a React single-page experience with animated storytelling sections, immersive transitions, and branded contact/SEO metadata.

## Overview

This project is a Vite + React + TypeScript frontend for a photography studio website. The site is structured as a scrolling landing page with dedicated sections for:

- hero storytelling
- featured work
- gallery
- before/after imagery
- services
- statistics
- testimonials
- behind-the-scenes content
- booking call to action
- footer contact details

The current branding uses:

- display brand: `Doll Pictures`
- company / GBP name: `Doll Pictures by Ramya Vignesh`
- contact email: `dollpictures2025@gmail.com`
- contact phone and WhatsApp: `+91 99945 55673`
- location: `URT TOWERS, 139/4-D, Perundurai Rd, Teachers Colony, Palayapalayam, Erode, Tamil Nadu 638011`
- website/profile: `https://dollpictures.in/`
- opening hours: Friday 10 am–12 am; Saturday 12–8:30 am and 10 am–8:30 pm; Sunday 10 am–8:30 pm; Monday 11 am–8:30 pm; Tuesday–Thursday 10 am–8:30 pm

Canonical public identity values live in `src/data/business-identity.json`. Update that file instead of adding contact or address literals elsewhere.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React icons

## Project Structure

```text
doll-pics/
├── index.html
├── package.json
├── public/
│   └── favicon.svg
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── CustomCursor.tsx
│   │   ├── SmoothScroll.tsx
│   │   └── sections/
│   │       ├── Hero.tsx
│   │       ├── ScrollStorytelling.tsx
│   │       ├── FeaturedWork.tsx
│   │       ├── HorizontalGallery.tsx
│   │       ├── Services.tsx
│   │       ├── Statistics.tsx
│   │       ├── Testimonials.tsx
│   │       ├── BehindScenes.tsx
│   │       ├── BookingCTA.tsx
│   │       └── Footer.tsx
│   ├── data/
│   │   └── content.ts
│   └── hooks/
│       ├── useReducedMotion.ts
│       └── useScroll.ts
└── vite.config.ts
```

## Full Stack Development (CMS + API)

This project combines the public portfolio with an admin CMS at `/admin`. Content is served by the NestJS backend in `../photography-cms-backend`.

### Prerequisites

- Node.js 18+
- MongoDB running locally (or `MONGODB_URI` configured in backend `.env`)

### Local dev (3 terminals)

```bash
# Terminal 1 — MongoDB (if not already running)
# mongod or Docker

# Terminal 2 — Backend API
cd ../photography-cms-backend
npm install
npm run seed        # first time only
npm run seed:admin  # first time only
npm run start:dev

# Terminal 3 — Frontend (this repo)
cp .env.example .env.local
npm install
npm run dev
```

- Public site: `http://localhost:5173/`
- Admin CMS: `http://localhost:5173/admin/login`
- API: `http://localhost:3001/api`

### Attendance and leave

The zero-cost attendance and leave MVP uses three isolated browser areas:

- `/admin/attendance` for owner dashboards, approvals, field assignments, reports, devices and policy settings.
- `/employee` for employee-code login, attendance history, leave, off-days, field punching and PIN setup.
- `/kiosk` for the registered Android office tablet.

Deploy the frontend and matching backend changes together. Existing CMS sessions must sign in again because backend JWT audience validation is now required. Production must use HTTPS for field-location permission.

For tablet setup, sign in as the owner, open **Attendance & Leave Settings**, generate a one-time device code, and enter it at `/kiosk`. The tablet must remain online; offline punching is intentionally unsupported.

### Environment

Copy `.env.example` to `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SITE_URL=https://dollpictures.in
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Yes (prod) | CMS/API base URL (includes `/api`). Runtime and prerender builds load published CMS content from it. |
| `VITE_SITE_URL` | Recommended (prod) | Site origin for robots.txt, prerender, and SEO absolute URLs. No trailing slash. Defaults to `https://dollpictures.in` if unset. |
| `VITE_ADMIN_DASHBOARD_MOCK_DATA` | No | Set to `true` to force bundled sample records on the admin dashboard. Local development also uses them automatically when both dashboard APIs are empty. |
| `SEO_REQUIRE_CMS` | Yes (prod) | Set to `true` so a production build fails if any required sitemap route is missing from the combined static/CMS prerender catalog. A temporary CMS outage uses the complete static fallback. |
| `SEO_CMS_RETRY_DELAYS_MS` | No | Comma-separated build retry delays for transient CMS errors. Defaults to `2000,4000,8000,15000`. |

Backend: set `CORS_ORIGIN=http://localhost:5173` and change `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Production

| Service | Notes |
|---------|-------|
| `photography-cms-backend` | Deploy to Railway/Render/VPS. Supplies published routes during the frontend build and triggers rebuilds after SEO changes. Set `SITE_URL=https://dollpictures.in`. |
| `doll-pics` | Deploy to Vercel/Netlify with `VITE_API_URL` and `VITE_SITE_URL` set |

Routing is configured in `vercel.json` / `netlify.toml`. `/sitemap.xml` is generated as a static frontend artifact from the same route catalog used for prerendering, so crawler access does not depend on backend uptime. `/admin` retains an SPA fallback. Public pages are served from prerendered files and unknown public paths use the generated `404.html` with a genuine HTTP 404. Published service/package SEO changes trigger a frontend deploy hook from the backend so new paths and the sitemap are regenerated together.

#### Host environment variables (Step 4)

Set these in your host dashboard:

**Netlify:** Site configuration → Environment variables → add:

- `VITE_API_URL` = your production API URL (e.g. `https://photography-cms-backend.onrender.com/api`)
- `VITE_SITE_URL` = `https://dollpictures.in`
- `SEO_REQUIRE_CMS` = `true`

Apply to **Production** (and Preview if you want preview builds to use the same origin).

**Vercel:** Project → Settings → Environment Variables → add the same three variables for **Production** (and Preview if desired).

Create a production-branch deploy hook in Vercel under Project → Settings → Git → Deploy Hooks. Store that secret URL in the backend's `FRONTEND_DEPLOY_HOOK_URLS`; never commit or paste it into frontend variables. Add a Netlify build-hook URL to the same comma-separated backend variable only when Netlify is actively deployed.

Redeploy after saving so prerendering reads the current published CMS routes. The generated static sitemap and prerender catalog are the routing sources of truth.

#### Google Search Console (Step 5)

After deploy:

1. Open `https://dollpictures.in/robots.txt` and confirm it includes `Sitemap: https://dollpictures.in/sitemap.xml`
2. Run `npm run seo:smoke` to verify the public sitemap URLs, their prerendered HTML, and the production 404.
3. Open `https://dollpictures.in/sitemap.xml` and confirm it is XML served by the frontend host.
4. In [Google Search Console](https://search.google.com/search-console) → **Sitemaps** → submit `https://dollpictures.in/sitemap.xml` (or use **Refresh** if already submitted).

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The Vite dev server will start locally and provide a browser URL in the terminal.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

## Available Scripts

- `npm run dev` starts the Vite development server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` serves the built app locally for verification.
- `npm run typecheck` runs TypeScript without emitting output.
- `npm run lint` runs ESLint across the project.

## Content And Branding

Most visual content is currently driven by static arrays in [src/data/content.ts](/Users/vetriveljaganathan/Desktop/new_repo/doll-pics/src/data/content.ts). That file contains:

- hero slides
- story scene copy
- featured work cards
- gallery image URLs
- services
- statistics
- testimonials
- behind-the-scenes items

Branding and shared contact metadata are primarily defined in:

- [src/components/Navbar.tsx](/Users/vetriveljaganathan/Desktop/new_repo/doll-pics/src/components/Navbar.tsx)
- [src/components/sections/Footer.tsx](/Users/vetriveljaganathan/Desktop/new_repo/doll-pics/src/components/sections/Footer.tsx)
- [index.html](/Users/vetriveljaganathan/Desktop/new_repo/doll-pics/index.html)
- [public/favicon.svg](/Users/vetriveljaganathan/Desktop/new_repo/doll-pics/public/favicon.svg)

## Notes For Future Updates

- The package name in `package.json` still uses the starter template name `vite-react-typescript-starter`. If this project is being published or handed off, it should be renamed to match the product branding.
- Image content currently uses externally hosted Pexels URLs. If long-term brand control or offline reliability matters, move those assets into a managed media pipeline or local/static storage.
- The footer contact links already support:
  - `mailto:` for email
  - `tel:` for phone
  - Google Maps for location

## Workflow Notes

This repository also contains `AGENT_PLANS`, `AGENT_TASK`, and `AGENT_TASK_SUMMARY` directories used to track approved changes and implementation history.
