import { fetchAllSchools } from '@/lib/api';
import SchoolDetailClient from './SchoolDetailClient';

// Was a client component with zero generateMetadata -- all 147 school
// pages served the exact same generic site-wide title/description to
// Google regardless of which school it was, same root cause already fixed
// for listing/district pages (see app/properties/listing/[token]/page.jsx).
// No single-school backend endpoint exists, so this fetches the full list
// server-side (same helper the client component already used) and finds
// the match by id -- an extra request per page load, but 147 rows is cheap.
export async function generateMetadata({ params }) {
  const schoolId = Number(params.id);
  const schools = await fetchAllSchools().catch(() => []);
  const school = (Array.isArray(schools) ? schools : []).find((s) => s.id === schoolId);

  if (!school) return { title: 'مدرسه یافت نشد | خانه‌داده' };

  const titleParts = [school.name];
  if (school.district_num != null) titleParts.push(`منطقه ${school.district_num}`);
  const title = `${titleParts.join(' — ')} | خانه‌داده`;

  const descriptionParts = [school.name];
  if (school.base_level) descriptionParts.push(school.base_level);
  if (school.school_type) descriptionParts.push(school.school_type);
  if (school.address) descriptionParts.push(school.address);
  const description = descriptionParts.join('، ') + ' — نظرات و امتیاز والدین، در خانه‌داده.';

  return {
    title,
    description,
    alternates: { canonical: `/schools/${params.id}` },
    openGraph: { title, description, type: 'website' },
  };
}

const SchoolDetailPage = () => <SchoolDetailClient />;

export default SchoolDetailPage;
