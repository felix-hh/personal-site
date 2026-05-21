# Felix Haba — personal site

A minimal, text-first personal site built with [Astro](https://astro.build/) + MDX.
Statically generated, no CSS framework, zero client-side JS on text-only pages. Posts that
embed an interactive widget hydrate only that widget (`client:visible`); everything else stays
plain static HTML.

```
src/
├── content/writing/          # your posts (.mdx) — this is what you edit day-to-day
├── components/widgets/        # interactive islands (MinHash, heatmap, …)
├── layouts/                   # BaseLayout, PostLayout
├── pages/                     # home, /writing, /writing/<slug>, /about, rss.xml
├── styles/global.css          # the entire design system (palette + type tokens)
└── consts.ts                  # contact links, tagline, nav
public/                        # static assets served at the site root (résumé PDF, etc.)
```

## Authoring workflow

### 1. Add a post

Drop an `.mdx` file into `src/content/writing/`. The filename becomes the URL slug
(`my-post.mdx` → `/writing/my-post/`). Start it with this frontmatter:

```yaml
---
title: "Simplifying healthcare price-transparency files with MinHashing"
date: 2026-01-14
description: "How a 19-billion-row payer file becomes searchable on a laptop."
featured: true          # show on homepage Featured list (optional, default false)
featured_order: 2       # 1 = top of featured list (optional)
tags: [data, healthcare, algorithms]   # optional, default []
draft: false            # optional, default false — drafts are excluded from the build
---

Your prose goes here. Standard Markdown plus inline HTML works. The first paragraph
automatically gets the drop cap.
```

Markdown niceties that are wired up out of the box:

- **Footnotes** — write `[^1]` in the text and `[^1]: the note.` anywhere below. They render
  as the post's **Notes** section at the bottom, with `↩` back-references.
- **Code blocks** — fenced blocks (```` ```python ````) get syntax highlighting (Shiki).
- **Tables**, blockquotes, lists — all styled to match the site.

### 2. Embed a chart

Import the widget island at the top of the MDX file (after the frontmatter), then place it
inline in the prose where the figure should appear:

```mdx
import MinHashPlayground from '../../components/widgets/MinHashPlayground.tsx';
import ContainmentHeatmap from '../../components/widgets/ContainmentHeatmap.tsx';

… prose …

<MinHashPlayground client:visible />

… more prose …

<ContainmentHeatmap client:visible />
```

`client:visible` means the widget's JavaScript loads only when it scrolls into view — and
only on posts that import one. A post with no widgets ships no JavaScript at all.

Available widgets in `src/components/widgets/`:

| Component               | What it is                                                        |
| ----------------------- | ----------------------------------------------------------------- |
| `MinHashPlayground`     | Live bottom-K MinHash estimator (Figure 1 in the MinHash post).   |
| `ContainmentHeatmap`    | 7×7 containment matrix with threshold collapse (Figure 2).        |
| `MinimalCoverExplorer`  | Greedy minimal-cover explorer — ready for a future post; not yet embedded. |

### 3. Feature a post on the homepage

Set `featured: true` in the post's frontmatter. Order the Featured list with
`featured_order` (ascending — `1` is first). The homepage **Featured** list is every
`featured: true` post sorted by `featured_order`; the **Recent** list is every post sorted by
date (newest first), capped at 7. The `/writing/` archive shows everything, grouped by year.

### 4. Résumé PDF

The About page's "Download résumé (PDF)" button links to `/felix-haba-resume.pdf`. Drop the
file at `public/felix-haba-resume.pdf` and it's served at that path — replacing the file ships
a new résumé with no code change. (Until you add it, the button 404s.)

To change the email, GitHub, or LinkedIn links, edit `src/consts.ts`.

### 5. Build & run

```bash
npm install        # once
npm run dev        # local dev server at http://localhost:4321
npm run build      # static output → dist/
npm run preview    # serve the built dist/ locally to spot-check
```

`npm run build` produces a fully static `dist/` (HTML, `rss.xml`, sitemap). Deploy `dist/`
anywhere — GitHub Pages, Netlify, etc. Before deploying, set the real `site` URL in
`astro.config.mjs` (it feeds canonical URLs, the RSS feed, and the sitemap).
