// Next.js replaces (not merges) a nested `openGraph` object when a page
// sets its own, so every page that customised its OG title silently lost
// the root layout's siteName/locale/default image -- and none set og:url.
// Build per-page metadata through this helper so those always survive.
export const SITE_NAME = 'خانه‌داده';
export const DEFAULT_OG_IMAGE = '/images/screen.jpg';

export function pageMeta({ title, description, path, type = 'website', images, ...rest }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: 'fa_IR',
      images: images && images.length ? images : [DEFAULT_OG_IMAGE],
    },
    ...rest,
  };
}
