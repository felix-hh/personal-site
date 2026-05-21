import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'writing'>;

// All published (non-draft) posts, newest first.
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Featured posts: featured === true, ordered by featured_order ascending.
export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getCollection('writing', ({ data }) => !data.draft && data.featured);
  return posts.sort(
    (a, b) =>
      (a.data.featured_order ?? Infinity) - (b.data.featured_order ?? Infinity),
  );
}

export function postHref(post: Post): string {
  return `/writing/${post.id}/`;
}

// Dates are authored as YYYY-MM-DD (parsed as UTC midnight); format in UTC so
// they don't shift a day in timezones behind UTC.

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
