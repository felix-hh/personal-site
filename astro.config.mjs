// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  // Custom domain served via GitHub Pages (see public/CNAME).
  site: 'https://www.felixhaba.com',
  integrations: [mdx(), preact(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
    // External links open in a new tab, safely.
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
    shikiConfig: {
      theme: 'github-light',
    },
    // Footnotes become the post's "Notes" endnotes section.
    remarkRehype: {
      footnoteLabel: 'Notes',
      footnoteLabelTagName: 'div',
      footnoteBackContent: '↩',
    },
  },
});
