import Hero from '@/components/Hero';
import FeaturedProperties from '@/components/FeaturedProperties';
import HomeProperties from '@/components/HomeProperties';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'خانه‌داده | اطلاعات املاک برای هر خانواده — خرید و اجاره ملک در تهران',
  description:
    'آگهی‌های خرید، فروش و اجاره آپارتمان در تهران با تحلیل قیمت منصفانه، راهنمای محله‌ها و امکانات اطراف هر خانه — در خانه‌داده.',
  path: '/',
});

// Was fully dynamic: every visit waited on two uncached fetches of the whole
// listings set (~2.8s TTFB). The shuffled picks only need to change every
// few minutes, so regenerate the page at most every 5 minutes instead.
export const revalidate = 300;

const HomePage = () => {
  return (
    <>
      <Hero />
      <FeaturedProperties />
      <HomeProperties />
    </>
  );
};

export default HomePage;
