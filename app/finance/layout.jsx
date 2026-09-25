import { pageMeta } from '@/lib/seo';

// page.jsx is a client component and can't export metadata itself, so it
// used to inherit the root layout's generic homepage title with no canonical.
export const metadata = pageMeta({
  title: 'برنامه‌ریز مالی خانه — محاسبه وام، رهن و اقساط | خانه‌داده',
  description:
    'با برنامه‌ریز مالی خانه‌داده بودجه، پس‌انداز، وام مسکن و اقساط خرید یا اجاره‌ی خانه را حساب کنید.',
  path: '/finance',
});

const FinanceLayout = ({ children }) => children;

export default FinanceLayout;
