import { fetchAllSchools, fetchPlaceContext } from '@/lib/api';
import SchoolDetailClient from './SchoolDetailClient';
import { pageMeta } from '@/lib/seo';
import PlaceContext from '@/components/PlaceContext';
import SchoolProfile from '@/components/SchoolProfile';
import { profileForSchool } from '@/lib/schoolProfiles';
import { cleanText, placeIntro, schoolDisplayName, schoolStreet, schoolTitle } from '@/lib/place';

const DOMAIN = 'https://khanedade.ir';

// No single-school backend endpoint exists, so this fetches the full list
// server-side and finds the match by id -- 147 rows is cheap. The school's
// surroundings (vicinity, local housing prices, nearby listings, metro...)
// come from /api/place-context, same as the hospital/library pages.
async function load(id) {
  const schools = await fetchAllSchools().catch(() => []);
  const school = (Array.isArray(schools) ? schools : []).find((s) => s.id === Number(id));
  if (!school) return null;
  const context =
    school.lat != null
      ? await fetchPlaceContext({ lat: school.lat, lng: school.lng, excludeKind: 'school', excludeId: school.id }).catch(
          () => null
        )
      : null;
  return { school, context, vicinity: context?.vicinity || null };
}

// "مدرسه‌ی غیر دولتی دخترانه در مقطع متوسطه دوره دوم" from the raw fields.
function schoolKindPhrase(school) {
  const level = cleanText(school.base_level)
    .replace(school.school_type || '§', '')
    .replace(school.gender || '§', '')
    .trim();
  return ['یک مدرسه‌ی', school.school_type, school.gender, level ? `در مقطع ${level}` : null]
    .filter(Boolean)
    .join(' ');
}

export async function generateMetadata({ params }) {
  const data = await load(params.id);
  if (!data) return { title: 'مدرسه یافت نشد | خانه‌داده' };
  const { school, vicinity } = data;

  const title = `${schoolTitle(school, vicinity)} | خانه‌داده`;
  // Same search-shaped wording as the title (level + gender + name + street).
  const descriptionParts = [schoolDisplayName(school)];
  const street = schoolStreet(school);
  if (street) descriptionParts.push(street);
  if (vicinity) descriptionParts.push(`محدوده‌ی ${vicinity}`);
  if (school.district_num != null) descriptionParts.push(`منطقه ${Number(school.district_num).toLocaleString('fa-IR')} تهران`);
  const profile = profileForSchool(school.id);
  if (profile?.orientation) descriptionParts.push(`تمرکز: ${profile.orientation}`);
  else if (school.address) descriptionParts.push(cleanText(school.address));
  const description = (
    descriptionParts.join('، ') +
    (profile?.highlights?.length ? ' — دستاوردها، ' : ' — ') +
    'نظرات والدین، قیمت مسکن و آگهی‌های اطراف مدرسه در خانه‌داده.'
  ).slice(0, 300);

  return pageMeta({ title, description, path: `/schools/${params.id}` });
}

const SchoolDetailPage = async ({ params }) => {
  const data = await load(params.id);
  if (!data) return <SchoolDetailClient initialSchool={null} />;
  const { school, context, vicinity } = data;
  const name = cleanText(school.name);

  const intro = placeIntro({
    name,
    kindPhrase: schoolKindPhrase(school),
    vicinity,
    districtNum: school.district_num,
    address: cleanText(school.address),
    context,
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'School',
    name,
    alternateName: schoolDisplayName(school),
    url: `${DOMAIN}/schools/${school.id}`,
    address: {
      '@type': 'PostalAddress',
      ...(school.address ? { streetAddress: cleanText(school.address) } : {}),
      addressLocality: 'تهران',
      addressCountry: 'IR',
    },
    ...(school.lat != null ? { geo: { '@type': 'GeoCoordinates', latitude: school.lat, longitude: school.lng } } : {}),
  };

  return (
    <SchoolDetailClient initialSchool={school} displayName={schoolDisplayName(school)}>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SchoolProfile profile={profileForSchool(school.id)} name={name} />
      <div className='bg-white rounded-xl shadow-md p-5 mb-6 text-sm text-gray-700 leading-7 flex flex-col gap-2'>
        {intro.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <div className='mb-6'>
        <PlaceContext context={context} placeLabel={name} />
      </div>
    </SchoolDetailClient>
  );
};

export default SchoolDetailPage;
