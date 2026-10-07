// One-line description of a listing for hover bubbles, e.g.
//   «۱۳۵ متر در نیاوران»  /  «۷۵ میلیارد تومان»
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const fa = (v) => String(v).replace(/\d/g, (d) => FA_DIGITS[d]).replace(/\./g, '٫').replace(/,/g, '٬');

// 75_000_000_000 -> «۷۵ میلیارد», 7_500_000_000 -> «۷٫۵ میلیارد», 250_000_000 -> «۲۵۰ میلیون»
function amount(n) {
  if (!n || n <= 0) return null;
  if (n >= 1e9) {
    const b = n / 1e9;
    return `${fa(b >= 10 ? Math.round(b) : Math.round(b * 10) / 10)} میلیارد`;
  }
  if (n >= 1e6) return `${fa(Math.round(n / 1e6))} میلیون`;
  return fa(n.toLocaleString('en-US'));
}

export function houseSummary(h) {
  const area = h.area_m2 ? `${fa(h.area_m2)} متر` : null;
  const where = h.district ? `در ${h.district}` : null;
  const label = [area, where].filter(Boolean).join(' ') || (h.title ? String(h.title).slice(0, 40) : 'ملک');

  let price;
  if (h.listing_type === 'rent') {
    const rent = h.rent >= 1_000_000 ? h.rent : 0; // under 1M is a placeholder on full-deposit (رهن کامل) ads
    const dep = h.deposit > 0 ? h.deposit : 0;
    if (rent && dep) price = `رهن ${amount(dep)} + اجاره ${amount(rent)} تومان`;
    else if (rent) price = `اجاره ${amount(rent)} تومان در ماه`;
    else if (dep) price = `رهن کامل ${amount(dep)} تومان`;
  } else if (h.price > 0) {
    price = `${amount(h.price)} تومان`;
  }
  return { label, price: price || 'قیمت توافقی', kind: h.listing_type === 'rent' ? 'rent' : 'buy' };
}
