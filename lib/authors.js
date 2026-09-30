// Named authors of site articles. An article whose `author` field matches a
// key here gets an author box and a full schema.org Person (with the
// credential) instead of a bare name -- Google weighs visible, verifiable
// authorship for articles, and Discover in particular.
export const AUTHORS = {
  'هادی عطایی': {
    bio: 'کارشناسی ارشد معماری (M.Arch) از دانشگاه کانزاس؛ نویسنده‌ی مجموعه‌ی «زبان الگو» در خانه‌داده.',
    alumniOf: 'University of Kansas',
    credential: 'Master of Architecture (M.Arch)',
    url: '/articles/zaban-olgo',
  },
};

export function authorPerson(name, domain) {
  const a = AUTHORS[name];
  if (!a) return { '@type': 'Person', name };
  return {
    '@type': 'Person',
    name,
    description: a.bio,
    url: `${domain}${a.url}`,
    alumniOf: { '@type': 'CollegeOrUniversity', name: a.alumniOf },
    hasCredential: { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: a.credential },
  };
}
