import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'writing'>;

// A post is a draft if its file is named `*.draft.md(x)` (those files are
// gitignored — local-only) or it sets `draft: true` in frontmatter. We check
// `filePath` rather than `id` because the glob loader slugifies ids (it strips
// the dot, turning `foo.draft` into `foodraft`).
export function isDraft(post: Post): boolean {
  const fp = post.filePath ?? '';
  return /\.draft\.(md|mdx)$/.test(fp) || post.data.draft === true;
}

// Drafts are previewable in `astro dev` but excluded from production builds.
const SHOW_DRAFTS = import.meta.env.DEV;

// Clean slug from the filename, stripping any `.draft` suffix.
export function postSlug(post: Post): string {
  if (post.filePath) {
    return post.filePath
      .split('/')
      .pop()!
      .replace(/\.(md|mdx)$/, '')
      .replace(/\.draft$/, '');
  }
  return post.id;
}

export function postHref(post: Post): string {
  return `/writing/${postSlug(post)}/`;
}

// All visible posts (drafts included only in dev), newest first.
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('writing', (p) => SHOW_DRAFTS || !isDraft(p));
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Featured posts: featured === true, ordered by featured_order ascending.
export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getCollection(
    'writing',
    (p) => (SHOW_DRAFTS || !isDraft(p)) && p.data.featured,
  );
  return posts.sort(
    (a, b) =>
      (a.data.featured_order ?? Infinity) - (b.data.featured_order ?? Infinity),
  );
}

// "21 Mar 2026"
export function formatDay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "Mar 2026"
export function formatMonth(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "12 May" (no year — for year-grouped archive)
export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}
