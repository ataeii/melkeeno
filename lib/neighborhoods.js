// Canonical registry of Tehran neighborhoods melkeeno has real content for
// (a published guide article), used by both the listing detail page's
// "learn about this neighborhood" cross-link and the /properties/district
// landing pages. Kept in one place so the two features can't drift apart.
//
// `test` matches raw scraper district strings, which are inconsistent --
// e.g. "سنگلج (شاپور)", "جماران (نیاوران)", "امام زاده قاسم (نیاوران)" --
// so entries are ordered most-specific-first and checked in order. Only
// "کن" needs an exact match since as a substring it would false-match
// unrelated district names.
// `dbName` is the exact district string to query listings by (the API's
// /api/listings?district= does an exact match, not a substring one) --
// checked against real data on 2026-09-08. A few neighborhoods (Tirdoghlu,
// Khavarshahr, Boroujerdi, Homayounshahr, Kan) had zero scraped listings
// under any spelling as of that check; their district pages still render
// (guide content + an honest "no listings yet" state) rather than 404ing,
// since the guide alone still has standalone SEO value.
export const NEIGHBORHOODS = [
  { slug: 'tirdoghlu', label: 'تیردوقلو', dbName: 'تیردوقلو', test: (d) => d.includes('تیردوقلو'), guideSlug: 'mahalle-tirdoghlu-tehran' },
  { slug: 'khavarshahr', label: 'خاورشهر', dbName: 'خاورشهر', test: (d) => d.includes('خاورشهر'), guideSlug: 'mahalle-khavarshahr-tehran' },
  { slug: 'boroujerdi', label: 'شهرک بروجردی', dbName: 'شهرک بروجردی', test: (d) => d.includes('بروجردی'), guideSlug: 'mahalle-boroujerdi-tehran' },
  { slug: 'homayounshahr', label: 'همایون‌شهر', dbName: 'همایون‌شهر', test: (d) => d.includes('همایون'), guideSlug: 'mahalle-homayounshahr-tehran' },
  { slug: 'sanglaj', label: 'سنگلج', dbName: 'سنگلج (شاپور)', test: (d) => d.includes('سنگلج'), guideSlug: 'mahalle-sanglaj-tehran' },
  { slug: 'masoudieh', label: 'مسعودیه', dbName: 'مسعودیه', test: (d) => d.includes('مسعودیه'), guideSlug: 'mahalle-masoudieh-tehran' },
  { slug: 'abouzar', label: 'بلوار ابوذر', dbName: 'ابوذر', test: (d) => d.includes('ابوذر'), guideSlug: 'bolvar-abouzar-tehran' },
  { slug: 'dehghan', label: 'دهقان', dbName: 'دهقان', test: (d) => d.includes('دهقان'), guideSlug: 'mahalle-dehghan-tehran' },
  {
    slug: 'tehranpars-sharghi',
    label: 'تهرانپارس شرقی',
    dbName: 'تهرانپارس شرقی',
    test: (d) => d.includes('تهرانپارس شرقی'),
    guideSlug: 'mahalle-tehranpars-sharghi',
  },
  { slug: 'gisha', label: 'گیشا', dbName: 'گیشا', test: (d) => d.includes('گیشا'), guideSlug: 'mahalle-gisha-tehran' },
  { slug: 'jamaran', label: 'جماران', dbName: 'جماران', test: (d) => d.includes('جماران'), guideSlug: 'mahalle-jamaran-tehran' },
  { slug: 'niavaran', label: 'نیاوران', dbName: 'نیاوران', test: (d) => d.includes('نیاوران'), guideSlug: 'mahalle-niavaran-tehran' },
  { slug: 'mahmoudieh', label: 'محمودیه', dbName: 'محمودیه', test: (d) => d.includes('محمودیه'), guideSlug: 'mahalle-mahmoudieh-tehran' },
  { slug: 'kan', label: 'کن', dbName: 'کن', test: (d) => d.trim() === 'کن', guideSlug: 'mahalle-kan-tehran' },
];

export function findNeighborhood(district) {
  if (!district) return null;
  return NEIGHBORHOODS.find(({ test }) => test(district)) || null;
}

export function findNeighborhoodBySlug(slug) {
  return NEIGHBORHOODS.find((n) => n.slug === slug) || null;
}
