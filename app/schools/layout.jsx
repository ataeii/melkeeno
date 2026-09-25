import { pageMeta } from '@/lib/seo';

// page.jsx is a client component and can't export metadata itself, so it
// used to inherit the root layout's generic homepage title with no canonical.
export const metadata = pageMeta({
  title: 'مدارس تهران — نقشه، مشخصات و نظرات والدین | خانه‌داده',
  description:
    'فهرست مدارس تهران به تفکیک منطقه و مقطع، روی نقشه، همراه با نظرات و امتیاز والدین — برای انتخاب محل زندگی نزدیک مدرسه‌ی مناسب.',
  path: '/schools',
});

const SchoolsLayout = ({ children }) => children;

export default SchoolsLayout;
