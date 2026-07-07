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
│   │       ├── BeforeAfter.tsx
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
