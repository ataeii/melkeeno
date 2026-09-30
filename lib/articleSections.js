// The four top-level sections of /articles (set by the user 2026-09-30).
// Articles are assigned by rule rather than by a stored field, so every
// existing article and every future one -- including the daily-article
// robot's, whose categories are راهنمای خرید / اجاره / حقوقی / دکوراسیون --
// lands in a section with no DB migration. An article can still be placed
// explicitly by setting `section` on it; the old `category` stays as a finer
// tag inside the section (e.g. «اجاره» within بازار مسکن).
export const SECTIONS = [
  {
    key: 'housing-market',
    label: 'بازار مسکن',
    emoji: '🏠',
    description: 'خرید و اجاره‌ی خانه: راهنماهای عملی، مسائل حقوقی، رهن و اجاره، و اخبار بازار مسکن.',
    href: '/articles/section/housing-market',
  },
  {
    key: 'neighborhoods',
    label: 'محله‌های تهران',
    emoji: '📍',
    description: 'راهنمای محله‌ها: تاریخچه، امکانات، دسترسی و بازار مسکن هر محله، برای انتخاب جای زندگی.',
    href: '/articles/section/neighborhoods',
  },
  {
    key: 'pattern-language',
    label: 'زبان الگو',
    emoji: '🗺️',
    description: 'مرور الگو به الگوی کتاب کریستوفر الکساندر با نگاهی به ایران و تهران — نوشته‌ی هادی عطایی.',
    // The series has its own hub page (book-order list + introduction).
    href: '/articles/zaban-olgo',
  },
  {
    key: 'architecture',
    label: 'معماری و شهرسازی',
    emoji: '🏛️',
    description: 'معماری ایرانی، اصول شهرسازی، زندگی آپارتمانی و تجربه‌ی شهرهای دیگر دنیا.',
    href: '/articles/section/architecture',
  },
];

const ARCHITECTURE_CATEGORIES = new Set(['معماری و شهرسازی', 'زندگی شهری', 'دکوراسیون']);
// A few architecture-category pieces are really neighborhood-choice guides.
const NEIGHBORHOOD_SLUGS = new Set(['bolvar-abouzar-tehran', 'entekhab-mahalle-monaseb']);

export function sectionOf(article) {
  if (article.section && SECTIONS.some((s) => s.key === article.section)) return article.section;
  const slug = article.slug || '';
  if (slug.startsWith('zaban-olgo')) return 'pattern-language';
  if (slug.startsWith('mahalle-') || NEIGHBORHOOD_SLUGS.has(slug)) return 'neighborhoods';
  if (ARCHITECTURE_CATEGORIES.has(article.category)) return 'architecture';
  // راهنمای خرید, اجاره, بازار مسکن, حقوقی and anything new: buying/renting.
  return 'housing-market';
}

// Display names for the finer `category` tags where the raw value would
// read oddly inside its section (news is tagged «بازار مسکن», which is also
// the section's own name).
const TAG_LABELS = { 'بازار مسکن': 'اخبار بازار مسکن' };
export const tagLabel = (category) => TAG_LABELS[category] || category;

export const sectionByKey = (key) => SECTIONS.find((s) => s.key === key) || null;
