# DOLL PICTURES

Cinematic photography portfolio site for `DOLL PICTURES by Ramya Vignesh`, built as a React single-page experience with animated storytelling sections, immersive transitions, and branded contact/SEO metadata.

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

- brand name: `DOLL PICTURES`
- SEO title: `DOLL PICTURES by Ramya Vignesh`
- contact email: `dollpictures2025@gmail.com`
- contact phone: `+91 95975 62337`
- location: `URT TOWERS, 139/4-D, Perundurai Rd, Teachers Colony, Palayapalayam, Erode, Tamil Nadu 638011`

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

### Environment

Copy `.env.example` to `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_SITE_URL=https://dollpictures.in
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Yes (prod) | CMS/API base URL (includes `/api`). Build uses it to proxy `/sitemap.xml` → `{API}/sitemap.xml`. |
| `VITE_SITE_URL` | Recommended (prod) | Site origin for robots.txt, prerender, and SEO absolute URLs. No trailing slash. Defaults to `https://dollpictures.in` if unset. |

Backend: set `CORS_ORIGIN=http://localhost:5173` and change `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

### Production

| Service | Notes |
|---------|-------|
| `photography-cms-backend` | Deploy to Railway/Render/VPS. Serves live `GET /api/sitemap.xml` from CMS data. Set `SITE_URL=https://dollpictures.in`. |
| `doll-pics` | Deploy to Vercel/Netlify with `VITE_API_URL` and `VITE_SITE_URL` set |

SPA rewrites are configured in `vercel.json` / `netlify.toml`. Admin routes require the same fallback on other hosts. `/sitemap.xml` is proxied to the CMS API so new CMS landings appear without a frontend rebuild. Unknown public paths fall through to the SPA shell (200); React resolves CMS landings or shows `NotFound` with `noindex`. Prerendered folders on disk still win via filesystem-first routing.

#### Host environment variables (Step 4)

Set these in your host dashboard:

**Netlify:** Site configuration → Environment variables → add:

- `VITE_API_URL` = your production API URL (e.g. `https://photography-cms-backend.onrender.com/api`)
- `VITE_SITE_URL` = `https://dollpictures.in`

Apply to **Production** (and Preview if you want preview builds to use the same origin).

**Vercel:** Project → Settings → Environment Variables → add the same two variables for **Production** (and Preview if desired).

Redeploy after saving so `prebuild` writes `robots.txt` and Netlify `_redirects` for the sitemap proxy.

#### Google Search Console (Step 5)

After deploy:

1. Open `https://dollpictures.in/robots.txt` and confirm it includes `Sitemap: https://dollpictures.in/sitemap.xml`
2. Open `https://dollpictures.in/sitemap.xml` and confirm it is XML from the API (new CMS paths appear within ~5 minutes of publish, no frontend redeploy)
3. In [Google Search Console](https://search.google.com/search-console) → **Sitemaps** → submit `https://dollpictures.in/sitemap.xml` (or use **Refresh** if already submitted)

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
