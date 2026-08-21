// Inserts a lead image (as the 2nd content block, right after the intro
// paragraph) into specific already-published articles. Every image here is
// from Wikimedia Commons with a verified CC/public-license and a real
// photographer credited in the caption -- none are hotlinked from a random
// site or a copyrighted stock/news photo.
// Run with: MONGODB_URI="..." node scripts/add_article_images.js
const mongoose = require('mongoose');

const images = {
  'cuba-keshavarzi-shahri-tarikhcheh': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/SB081_Urban_agriculture_Havana.JPG',
    caption: 'کشاورزی شهری در هاوانا، کوبا — عکس: Susanne Bollinger (CC BY-SA 4.0), ویکی‌مدیا کامانز',
  },
  'keshavarzi-fazaye-koochak-shahri-kuba': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/Container_garden_on_front_porch.jpg',
    caption: 'کشاورزی گلدانی در فضای کوچک — عکس: Shakespeare/ویکی‌پدیای انگلیسی (CC BY-SA 3.0), ویکی‌مدیا کامانز',
  },
  'osul-1-harim-khosoosi-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/%D8%AE%D8%A7%D9%86%D9%87_%D8%A8%D8%B1%D9%88%D8%AC%D8%B1%D8%AF%DB%8C_%DA%A9%D8%A7%D8%B4%D8%A7%D9%86_%D8%A7%DB%8C%D8%B1%D8%A7%D9%86-The_Borujerdi_House_kashan_iran_19.jpg',
    caption: 'حیاط مرکزی خانه‌ی بروجردی‌ها، کاشان — عکس: Mahdikarimi70 (CC BY-SA 4.0), ویکی‌مدیا کامانز',
  },
  'osul-2-masjed-bazar-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Grand_Bazaar%2C_Tehran_%2841723682865%29.jpg',
    caption: 'بازار بزرگ تهران — عکس: Ninara (CC BY 2.0), ویکی‌مدیا کامانز',
  },
  'osul-3-shabake-maaber-ensani-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Aerial_View_of_Central_Tehran.jpg',
    caption: 'نمای هوایی از مرکز تهران — عکس: Ensie & Matthias (CC BY-SA 2.0), ویکی‌مدیا کامانز',
  },
  'osul-4-meemari-eghlimi-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Windcatchers_in_Yazd.jpg',
    caption: 'بادگیرهای یزد، نمونه‌ای از معماری اقلیمی سنتی ایران — عکس: Ms96 (CC BY-SA 4.0), ویکی‌مدیا کامانز',
  },
  'osul-5-la-zarar-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Air_pollution_of_Tehran_-_17_December_2011_12.jpg',
    caption: 'آلودگی هوای تهران — عکس: Mohammad Hassanzadeh (CC BY 4.0), ویکی‌مدیا کامانز',
  },
  'osul-6-edalat-fazayi-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Park_Mellat_Tehran.JPG',
    caption: 'پارک ملت، از فضاهای سبز شمال تهران — عکس: Zereshk (CC BY 3.0), ویکی‌مدیا کامانز',
  },
  'osul-7-mahalle-fashorde-tehran': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Chamran_Highway%2C_Tehran.jpg',
    caption: 'بزرگراه چمران، تهران — عکس: Orijentolog (CC BY-SA 3.0), ویکی‌مدیا کامانز',
  },
};

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('articles');

  for (const [slug, img] of Object.entries(images)) {
    const doc = await col.findOne({ slug });
    if (!doc) {
      console.log('NOT FOUND:', slug);
      continue;
    }
    // Skip if an image block already exists (idempotent re-run).
    if (doc.content.some((b) => b.type === 'image')) {
      console.log('already has image, skipping:', slug);
      continue;
    }
    const content = [...doc.content];
    content.splice(1, 0, { type: 'image', url: img.url, caption: img.caption });
    await col.updateOne({ slug }, { $set: { content } });
    console.log('added image:', slug);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
