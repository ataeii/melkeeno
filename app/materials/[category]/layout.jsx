import { pageMeta } from '@/lib/seo';

// Keep in sync with page.jsx's CATEGORY_LABELS.
const CATEGORY_LABELS = {
  cement: 'سیمان',
  rebar: 'میلگرد',
  brick: 'آجر',
  block: 'بلوک',
  gypsum: 'گچ',
};

export function generateMetadata({ params }) {
  const label = CATEGORY_LABELS[params.category];
  if (!label) return { title: 'دسته‌بندی یافت نشد | خانه‌داده' };
  return pageMeta({
    title: `قیمت روز ${label} در تهران — مقایسه فروشندگان | خانه‌داده`,
    description: `قیمت به‌روز ${label} از فروشندگان مختلف مصالح ساختمانی در تهران، کنار هم برای مقایسه — در خانه‌داده.`,
    path: `/materials/${params.category}`,
  });
}

const MaterialCategoryLayout = ({ children }) => children;

export default MaterialCategoryLayout;
