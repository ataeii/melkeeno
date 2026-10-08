// Who posted a listing. Only first-party listings know this (from the poster's account);
// scraped ones are labelled by source only -- we never claim owner/office for them.
const SOURCE_LABEL = { divar: 'دیوار', kilid: 'کیلید' };

export function advertiserBadge(h) {
  if (h.advertiser_type === 'office') {
    return { kind: 'office', text: `آژانس املاک ${h.advertiser_name || ''} ✓`.replace('  ', ' '), href: '/offices' };
  }
  if (h.advertiser_type === 'owner') return { kind: 'owner', text: 'مالک' };
  const src = SOURCE_LABEL[h.source];
  return src ? { kind: 'source', text: `منبع: ${src}` } : null;
}

export const BADGE_CLASS = {
  office: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  owner: 'bg-sky-50 text-sky-700 border border-sky-200',
  source: 'bg-gray-50 text-gray-500 border border-gray-200',
};
export const BADGE_COLOR = {
  office: ['#ecfdf5', '#047857'],
  owner: ['#f0f9ff', '#0369a1'],
  source: ['#f9fafb', '#6b7280'],
};
