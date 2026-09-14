// Was missing entirely -- this page (a client component, so it can't
// export metadata itself) inherited the root layout's generic homepage
// title/description. Confirmed in Search Console: ranking at a strong
// position ~6 for its query but 0% CTR, exactly what a mismatched
// title/snippet produces regardless of position.
export const metadata = {
  title: 'خانه‌یاب خانواده — پیدا کردن خانه نزدیک محل کار و مدرسه | ملکینو',
  description:
    'به‌جای جست‌وجوی محله به محله، محل کار و مدرسه‌ی فرزندتان را وارد کنید تا ملکینو خانه‌هایی را نشان دهد که واقعاً کمترین زمان رفت‌وآمد روزانه را برای کل خانواده دارند.',
};

const FamilyFinderLayout = ({ children }) => children;

export default FamilyFinderLayout;
