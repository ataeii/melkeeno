// Next.js replaces (not merges) a nested `openGraph` object when a page
// sets its own, so every page that customised its OG title silently lost
// the root layout's siteName/locale/default image -- and none set og:url.
// Build per-page metadata through this helper so those always survive.
export const SITE_NAME = 'خانه‌داده';
export const DEFAULT_OG_IMAGE = '/images/screen.jpg';
export const RSS_ALTERNATE = { 'application/rss+xml': [{ url: '/feed.xml', title: 'مقالات خانه‌داده' }] };

// Google Discover only shows large image cards for pages that allow
// max-image-preview:large. The root layout sets it, but any page that sets
// its own `robots` replaces the whole object and silently drops it -- so
// every page built through pageMeta carries it explicitly.
export const indexableRobots = (indexable = true) => ({
  index: indexable,
  follow: indexable,
  googleBot: { index: indexable, follow: indexable, 'max-image-preview': 'large' },
});

export function pageMeta({ title, description, path, type = 'website', images, ...rest }) {
  return {
    title,
    description,
    // `alternates` replaces the root layout's, so the RSS link is repeated here.
    alternates: { canonical: path, types: RSS_ALTERNATE },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: 'fa_IR',
      images: images && images.length ? images : [DEFAULT_OG_IMAGE],
    },
    robots: indexableRobots(),
    ...rest,
  };
}
