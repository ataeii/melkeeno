// Shared helpers for the per-place pages (/schools/[id],
// /places/hospital/[id], /places/library/[id]). All text is assembled from
// real data only -- nothing here invents facts about a place.

export const PLACE_PAGE_CATEGORIES = {
  hospital: { noun: 'بیمارستان', schemaType: 'Hospital' },
  library: { noun: 'کتابخانه', schemaType: 'Library' },
};

// Nearby things further than this are not "nearby" enough to mention.
export const NEARBY_MAX_KM = 3;

export const toFa = (n, digits = 0) =>
  n == null ? '' : Number(n).toLocaleString('fa-IR', { maximumFractionDigits: digits });

export function cleanText(s) {
  return (s || '')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/\s+/g, ' ')
    .replace(/^[\s|،,-]+|[\s|،,-]+$/g, '')
    .trim();
}

// OSM leaves some libraries unnamed ("library") -- those get a generic
// Persian name built from their vicinity instead. Source hospital names
// often end in "تهران" (and one has an unclosed "(ع"), which would double
// up with the ", تهران" the titles add.
export function placeName(category, place) {
  let name = cleanText(place.name);
  if (!name || /^library$/i.test(name)) return null;
  name = name.replace(/\s*تهران$/, '').trim();
  if ((name.match(/\(/g) || []).length > (name.match(/\)/g) || []).length) name += ')';
  return name || null;
}

function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// The same place entered twice in the source data: same cleaned name within
// 300 m (e.g. Arash hospital under two ids), or an unnamed OSM library node
// sitting on a named one (building + library mapped separately). Returns the
// place that should own the page, or null if this place is the original.
export function canonicalTwin(category, place, all) {
  const name = placeName(category, place);
  let twin = null;
  for (const other of all) {
    if (other.id === place.id || other.lat == null || place.lat == null) continue;
    const otherName = placeName(category, other);
    const km = distanceKm(place, other);
    const sameName = name && otherName === name && km < 0.3 && other.id < place.id;
    const unnamedOnNamed = !name && otherName && km < 0.06;
    if ((sameName || unnamedOnNamed) && (!twin || other.id < twin.id)) twin = other;
  }
  return twin;
}

// Nearest metro/park, used to tell apart unnamed places with no vicinity.
export function landmarkOf(context) {
  const metro = (context?.metro || []).find((m) => m.distance_km <= 1.5);
  if (metro) return `ایستگاه مترو ${metro.name}`;
  const park = namedParks(context?.park, 1)[0];
  return park ? cleanText(park.name) : null;
}

export function displayName(category, place, vicinity, landmark) {
  const name = placeName(category, place);
  if (name) return name;
  const noun = PLACE_PAGE_CATEGORIES[category]?.noun || 'مکان';
  if (vicinity) return `${noun} ${vicinity}`;
  if (landmark) return `${noun} نزدیک ${landmark}`;
  return `${noun} در تهران`;
}

// Hospitals/libraries are titled by vicinity (their names rarely say where
// they are); schools by municipal district (منطقه), which the data has.
export function placeTitle(category, place, vicinity, landmark) {
  const name = displayName(category, place, vicinity, landmark);
  if (vicinity && !name.includes(vicinity)) return `${name} — ${vicinity}، تهران`;
  return name.endsWith('تهران') ? name : `${name}، تهران`;
}

// Search Console shows how people look for schools: level + name + area
// («دبستان سیمای فرهنگ», «متوسطه دوم سلام سبز», «دبستان نشانه رستا ولیعصر»).
// Titles follow that shape, which also makes them unique -- the old
// «مدرسه X — منطقه N» gave 67 pages (same-name schools, different levels)
// identical titles.
export function schoolLevel(school) {
  const b = cleanText(school.base_level);
  if (/هر دو مقطع متوسطه/.test(b)) return 'متوسطه اول و دوم';
  if (/متوسطه دوره دوم|دبیرستان/.test(b) && !/ابتدای/.test(b)) return 'متوسطه دوم';
  if (/متوسطه دوره اول/.test(b)) return 'متوسطه اول';
  if (/^پیش دبستان/.test(b)) return 'پیش‌دبستان';
  // "…پیش دبستان هم دارد" is how the source marks an elementary school with
  // an attached preschool.
  if (/این دبستان|دبستان \(ابتدایی\)|ابتدایی دوره|دوره دوم ابتد|پیش ?دبستان(ی)? (هم )?دارد|دوره اول است/.test(b)) {
    // Some elementary schools run separate campuses per cycle (e.g. نیکا).
    const a = `${b} ${cleanText(school.address)}`;
    if (/دوره اول است|دوره اول دبستان/.test(a)) return 'دبستان دوره اول';
    if (/دوره دوم دبستان|دوره دوم ابتد/.test(a)) return 'دبستان دوره دوم';
    return 'دبستان';
  }
  return 'مدرسه';
}

export function schoolDisplayName(school) {
  const base = cleanText(school.name).replace(/^مدرسه\s*/, '') || cleanText(school.name);
  // Names that already carry their kind («هنرستان …») keep it.
  if (/^(هنرستان|دبستان|دبیرستان)/.test(base)) return [base, school.gender].filter(Boolean).join(' ');
  return [schoolLevel(school), school.gender, base].filter(Boolean).join(' ');
}

// First address segment naming a خیابان / بلوار / میدان (people search
// schools by street: «… ولیعصر»).
export function schoolStreet(school) {
  for (const seg of cleanText(school.address).split(/[،,-]/)) {
    const m = seg.trim().match(/^(?:انتهای |ابتدای |ضلع \S+ )?(خیابان|بلوار|میدان)\s+(.+)$/);
    if (m) {
      const name = m[2]
        .replace(/\s*\(.*$/, '')
        .replace(/\s+(نرسیده|بعد از|قبل از|بالاتر از|پایین‌?تر از|روبروی|روبه‌روی|جنب|نبش|به طرف|به سمت).*$/, '')
        .trim();
      if (name) return `${m[1]} ${name}`;
    }
  }
  return null;
}

export function schoolTitle(school, vicinity) {
  const street = schoolStreet(school);
  const where = street || (vicinity ? `محدوده‌ی ${vicinity}` : null);
  const head = [schoolDisplayName(school), where].filter(Boolean).join('، ');
  const tail = school.district_num != null ? `منطقه ${toFa(school.district_num)} تهران` : 'تهران';
  return `${head} — ${tail}`;
}

export function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `حدود ${toFa(Math.round((km * 1000) / 10) * 10)} متر`;
  return `حدود ${toFa(km, 1)} کیلومتر`;
}

export function formatToman(n) {
  if (!n) return null;
  if (n >= 1e9) return `${toFa(n / 1e9, 1)} میلیارد تومان`;
  if (n >= 1e6) return `${toFa(n / 1e6, 0)} میلیون تومان`;
  return `${toFa(n)} تومان`;
}

const within = (items, km = NEARBY_MAX_KM) => (items || []).filter((x) => x.distance_km <= km);

// OSM leaves some parks named with an English placeholder ("park") --
// only mention parks that have a real (Persian-script) name.
const hasPersianName = (x) => /[\u0600-\u06FF]/.test(x?.name || '');
export const namedParks = (items, km) => within(items, km).filter(hasPersianName);

// A few factual sentences about where the place is and what's around it.
export function placeIntro({ name, kindPhrase, vicinity, districtNum, address, context }) {
  const s = [];
  const where = [
    districtNum != null ? `منطقه‌ی ${toFa(districtNum)} تهران` : null,
    vicinity ? `محدوده‌ی ${vicinity}` : null,
  ].filter(Boolean);
  s.push(`${name} ${kindPhrase}${where.length ? ` در ${where.join('، ')}` : ' در تهران'} است.`);
  if (address) s.push(`نشانی: ${address}.`);

  const metro = within(context?.metro)[0];
  const park = namedParks(context?.park, 1.5)[0];
  if (metro) s.push(`نزدیک‌ترین ایستگاه مترو، ${metro.name}، در فاصله‌ی ${formatDistance(metro.distance_km)} (خط مستقیم) قرار دارد.`);
  if (park) s.push(`بوستان ${cleanText(park.name).replace(/^(بوستان|پارک)\s*/, '')} ${formatDistance(park.distance_km)} با آن فاصله دارد.`);

  const p = context?.prices || {};
  const radius = toFa(context?.radius_km, 1);
  if (p.buy_ppm2_median) {
    s.push(
      `در شعاع ${radius} کیلومتری، میانه‌ی قیمت هر متر مربع آپارتمان برای خرید حدود ${formatToman(p.buy_ppm2_median)} است (بر پایه‌ی ${toFa(p.buy_n)} آگهی فعال در خانه‌داده).`
    );
  }
  if (p.rent_median || p.deposit_median) {
    const bits = [
      p.deposit_median ? `ودیعه‌ی حدود ${formatToman(p.deposit_median)}` : null,
      p.rent_median ? `اجاره‌ی ماهانه‌ی حدود ${formatToman(p.rent_median)}` : null,
    ].filter(Boolean);
    s.push(`آپارتمان‌های اجاره‌ای همین محدوده معمولاً با ${bits.join(' و ')} عرضه می‌شوند.`);
  }
  return s;
}

export { within };
