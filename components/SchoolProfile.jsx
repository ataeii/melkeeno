import { PROFILES_CHECKED_AT } from '@/lib/schoolProfiles';

// Extended, sourced write-up for well-known schools (see lib/schoolProfiles.js).
// Results are the schools' own published claims, so they're labelled that
// way and every page lists its sources and when they were checked.
const SchoolProfile = ({ profile, name }) => {
  if (!profile) return null;
  return (
    <div className='bg-white rounded-xl shadow-md p-5 mb-6'>
      <h2 className='font-bold text-gray-800 mb-3'>درباره‌ی {name}</h2>
      {profile.orientation && (
        <p className='text-xs mb-3'>
          <span className='bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full'>تمرکز: {profile.orientation}</span>
        </p>
      )}
      <div className='text-sm text-gray-700 leading-7 flex flex-col gap-2'>
        {profile.about.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {profile.highlights.length > 0 && (
        <>
          <h3 className='font-semibold text-gray-800 text-sm mt-4 mb-2'>دستاوردها، به گزارش مدرسه</h3>
          <ul className='list-disc pr-5 text-sm text-gray-700 leading-7'>
            {profile.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </>
      )}
      {profile.note && <p className='text-xs text-gray-500 mt-2'>{profile.note}</p>}

      <div className='border-t border-gray-100 mt-4 pt-3 text-xs text-gray-500'>
        <p className='mb-1'>
          منابع (آخرین بررسی: {PROFILES_CHECKED_AT}) — نرخ قبولی دانشگاه توسط این مدرسه به‌صورت عمومی منتشر نشده است:
        </p>
        <ul className='flex flex-col gap-0.5'>
          {profile.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target='_blank' rel='nofollow noopener noreferrer' className='text-blue-700 hover:underline'>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SchoolProfile;
