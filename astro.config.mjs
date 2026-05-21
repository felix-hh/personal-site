// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  // Placeholder — change to the GitHub Pages URL (or custom domain) at deploy time.
  site: 'https://www.felixhaba.com',
  integrations: [mdx(), preact(), sitemap()],
  markdown: {
    remarkPlugins: [remarkGfm],
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
