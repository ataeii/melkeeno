import { pageMeta } from '@/lib/seo';

// Deliberately no robots override here -- this used to blanket
// noindex/nofollow over the whole /properties/* tree (including
// /properties/listing/[token], the ~2200 indexable listing pages),
// silently overriding every per-page generateMetadata's robots default.
// Private subpages (add/sell/saved/[id]/edit) set their own noindex.
// Applies to /properties itself (a client page that can't export metadata);
// listing/district/[id] pages override with their own generateMetadata.
export const metadata = pageMeta({
  title: 'آگهی‌های خرید، فروش و اجاره آپارتمان در تهران | خانه‌داده',
  description:
    'جست‌وجوی آگهی‌های خرید و اجاره‌ی آپارتمان در تهران روی نقشه، با فیلتر محله، قیمت و متراژ و تحلیل قیمت منصفانه‌ی هر آگهی.',
  path: '/properties',
});

const PropertiesLayout = ({ children }) => children;

export default PropertiesLayout;
