// Shared bits for the building-materials comparison pages.
export const MATERIAL_LABELS = {
  cement: 'سیمان',
  rebar: 'میلگرد',
  brick: 'آجر',
  block: 'بلوک',
  gypsum: 'گچ',
};

export const toman = (n) => (n > 0 ? `${Number(n).toLocaleString('fa-IR')} تومان` : '—');

export const faDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

export const PRICE_KIND = { retail: 'خرده', wholesale: 'عمده', factory: 'درب کارخانه' };

export const itemPath = (category, key) => `/materials/${category}/${encodeURIComponent(key)}`;

export const decodeParam = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};
