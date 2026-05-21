# CLAUDE.md — Felix Haba's personal website

Guide for AI agents (and Felix) working on this repo. It covers how to publish posts,
update pages, the architecture, and how deploys work. Read this first.

## What this is

A minimal, text-first personal site built with **Astro + MDX**. Statically generated,
no CSS framework, **zero client-side JS on text-only pages**. Posts that embed an
interactive widget hydrate only that widget (`client:visible`); everything else is plain
static HTML. Design is a single committed "Editorial" direction (off-white + ink, Spectral
display, Source Serif body, JetBrains Mono) — there is **no dark mode, no accent color, no
cards/hero images**. Keep it that way unless Felix asks otherwise.

Live at **www.felixhaba.com** (GitHub Pages, custom domain).

## Repo layout

```
src/
├── content/writing/          # posts (.mdx). *.draft.mdx are local-only drafts (gitignored)
├── components/
│   ├── BaseHead / Header / Footer (.astro)
│   └── widgets/               # interactive Preact islands (.tsx)
├── layouts/                   # BaseLayout, PostLayout
├── lib/posts.ts               # post queries, draft logic, date formatting
├── pages/                     # index, about, writing/, rss.xml.js
├── styles/global.css          # the entire design system (tokens + components)
└── consts.ts                  # contact links, tagline, bio intro, nav
public/
├── logos/                     # org logos used on /about
├── CNAME                       # www.felixhaba.com (custom domain)
└── felix-haba-resume.pdf       # ← Felix adds this; About button links to it
.github/workflows/deploy.yml    # builds + publishes to gh-pages/docs on push to master
```

## Authoring workflow

### 1. Add a post
Drop an `.mdx` file in `src/content/writing/`. Filename = URL slug
(`my-post.mdx` → `/writing/my-post/`). Frontmatter:

```yaml
---
title: "Simplifying healthcare price-transparency files with MinHashing"
date: 2026-01-14
description: "How a 19-billion-row payer file becomes searchable on a laptop."
featured: true          # show on homepage Featured list (optional, default false)
featured_order: 1       # 1 = top of featured list (optional)
tags: [data, healthcare]
draft: false            # optional; see Drafts below
---
```

Out of the box: `[^1]` **footnotes** render as the post's "Notes" endnotes section with `↩`
back-refs; fenced code blocks get **Shiki** highlighting; tables/blockquotes/lists are styled;
the **first paragraph gets a drop cap** automatically (CSS `:first-of-type`, no annotation needed).

### 2. Embed an interactive widget
Import the island at the top of the MDX (after frontmatter) and place it inline:

```mdx
import MinHashPlayground from '../../components/widgets/MinHashPlayground.tsx';
import ContainmentHeatmap from '../../components/widgets/ContainmentHeatmap.tsx';

<MinHashPlayground client:visible />
```

`client:visible` loads the widget's JS only when it scrolls into view, and only on posts that
import one. Available widgets in `src/components/widgets/`:
- `MinHashPlayground` — live bottom-K MinHash estimator.
- `ContainmentHeatmap` — 7×7 containment matrix with threshold collapse + floating tooltip.
- `MinimalCoverExplorer` — greedy minimal-cover explorer; built but not embedded anywhere yet.

Widgets are **Preact** (`@astrojs/preact`), written as `.tsx` with `/** @jsxImportSource preact */`
and `preact/hooks`. They were ported from standalone HTML demos and re-skinned to the monochrome
palette; the math/data is verbatim and should not be "corrected."

### 3. Drafts (work-in-progress, local-only)
A post is a **draft** if its file is named `*.draft.mdx` **or** it sets `draft: true`.
- `*.draft.mdx` files are **gitignored** — they live only on Felix's machine and never reach the repo or the published site.
- In `astro dev`, drafts are visible and listed with an italic **`[draft]`** tag so Felix can preview them; their preview URL uses the clean slug (the `.draft` suffix is stripped).
- In production builds, drafts are excluded entirely.
- To publish a draft: rename `foo.draft.mdx` → `foo.mdx` and commit it.

Draft detection lives in `src/lib/posts.ts` (`isDraft`). **Important:** it checks the entry's
`filePath`, not its `id` — the glob loader slugifies ids and strips the dot (`foo.draft` → `foodraft`),
so id-based suffix checks silently fail. If you touch this, keep using `filePath`.

### 4. Featured vs Recent vs Archive
- Homepage **Featured** = posts with `featured: true`, ordered by `featured_order` ascending.
- Homepage **Recent** = all visible posts by date desc, first 7.
- `/writing/` archive = all visible posts grouped by year.
All driven from the collection in `src/lib/posts.ts`; no manual lists to maintain.

### 5. Resume
The About page button links to a Google Drive PDF (hardcoded in `src/pages/about.astro`).
To change it, edit that `href`. (To self-host instead, drop a file in `public/` and point
the button at its path.)

### 6. Editing the About / Career / contact info
- Bio, Recent Reads, **Career** (date column + logo + "Name · role"), Projects: `src/pages/about.astro`.
- Career org logos: `public/logos/` (referenced by path in `about.astro`). Logos are full-color.
- Contact email / GitHub / LinkedIn / tagline / homepage bio: `src/consts.ts`.

## Run & build

```bash
npm install
npm run dev        # http://localhost:4321 (shows drafts)
npm run build      # static output → dist/ (excludes drafts)
npm run preview    # serve built dist/ locally
```

## Deployment (GitHub Pages)

- Repo: **felix-hh/personal-site**, default branch **`master`**.
- Pages is a **legacy branch deploy**: source = branch **`gh-pages`**, path **`/docs`**, custom
  domain **www.felixhaba.com** (kept alive by `public/CNAME`, which the build copies into `dist/`).
- `.github/workflows/deploy.yml` runs on push to `master`: `npm ci && npm run build`, then
  publishes `dist/` to `gh-pages/docs` via `peaceiris/actions-gh-pages`. **So: push to `master`
  and the live site updates automatically** — do not hand-edit `gh-pages`.
- `astro.config.mjs` `site` is `https://www.felixhaba.com`. No `base` (root custom domain).
- The original Hugo site that previously lived here was archived to a separate branch before
  this Astro site replaced `master`.

## Design tokens (don't drift)

Defined as CSS custom properties in `src/styles/global.css :root`:
`--bg #faf8f3`, `--bg-subtle #f3f0e8`, `--ink #1c1916`, `--ink-soft #3a352e`,
`--ink-mute #6b6457`, `--ink-faint #a39c8e`, `--rule #e6e1d4`. No accent color.
Fonts via `@fontsource` (Spectral 300/400, Source Serif 4 Variable, JetBrains Mono).
Body 18px/1.7; h1 56px / h2 34px / h3 22px, all Spectral weight 300.

## Gotchas learned the hard way

- **Dates**: frontmatter `date: YYYY-MM-DD` parses as UTC midnight. Always format with
  `timeZone: 'UTC'` (see `lib/posts.ts`) or dates show a day early in US timezones. Group the
  archive by `getUTCFullYear()`.
- **Drafts**: detect via `filePath`, not `id` (see §3).
- **`client:visible` islands** render their SSR HTML immediately but only hydrate (become
  interactive) once scrolled into view. When testing in a browser, scroll the widget into the
  viewport before interacting; an island still showing `ssr` attribute hasn't hydrated yet.
- **Preact controlled inputs**: setting `input.value` in a script doesn't update component state —
  dispatch a real `input` event (with the native value setter) to drive them programmatically.
- **No client JS on text pages** is a feature. Don't add global scripts/analytics that load on
  every page unless asked.
