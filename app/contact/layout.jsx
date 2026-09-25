import { pageMeta } from '@/lib/seo';

// page.jsx is a client component and can't export metadata itself, so it
// used to inherit the root layout's generic homepage title with no canonical.
export const metadata = pageMeta({
  title: 'تماس با ما | خانه‌داده',
  description:
    'راه‌های ارتباط با تیم خانه‌داده برای پرسش، پیشنهاد یا گزارش مشکل.',
  path: '/contact',
});

const ContactLayout = ({ children }) => children;

export default ContactLayout;
