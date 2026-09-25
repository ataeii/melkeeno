import { pageMeta } from '@/lib/seo';

// page.jsx is a client component and can't export metadata itself, so it
// used to inherit the root layout's generic homepage title with no canonical.
export const metadata = pageMeta({
  title: 'دفاتر املاک تهران روی نقشه | خانه‌داده',
  description:
    'فهرست و نقشه‌ی دفاتر مشاور املاک تهران با آدرس و اطلاعات تماس — پیدا کردن بنگاه املاک در محله‌ی موردنظر.',
  path: '/offices',
});

const OfficesLayout = ({ children }) => children;

export default OfficesLayout;
