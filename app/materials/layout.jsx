import { pageMeta } from '@/lib/seo';

// page.jsx is a client component and can't export metadata itself, so it
// used to inherit the root layout's generic homepage title with no canonical.
export const metadata = pageMeta({
  title: 'قیمت روز مصالح ساختمانی — سیمان، میلگرد، آجر، بلوک و گچ | خانه‌داده',
  description:
    'قیمت به‌روز مصالح ساختمانی در تهران: سیمان، میلگرد، آجر، بلوک و گچ، همراه با مقایسه‌ی قیمت فروشندگان آنلاین.',
  path: '/materials',
});

const MaterialsLayout = ({ children }) => children;

export default MaterialsLayout;
