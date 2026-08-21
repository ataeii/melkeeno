// Second entry in the "زبان الگو" series -- Pattern #106, "Positive
// Outdoor Space", verified via search. Continues the same theme: a real
// pattern from the book, embodied in traditional Iranian courtyard
// architecture, largely absent from typical modern apartment surroundings,
// with real consequences for children and adults. This time the author
// signature is placed at the END of the article body (not just the
// top-level `author` field), per explicit request -- kept both, since the
// top field is what a future article-list byline would read from.
// Run with: MONGODB_URI="..." node scripts/seed_positive_outdoor_space.js
const mongoose = require('mongoose');

const h = (text) => ({ type: 'heading', text });
const p = (text) => ({ type: 'paragraph', text });
const l = (items) => ({ type: 'list', items });
const img = (url, caption) => ({ type: 'image', url, caption });

const article = {
  title: 'زبان الگو (۲): «فضای باز مثبت» — حیاطی که شکل دارد، در برابر فضای بلاتکلیف میان برج‌ها',
  slug: 'zaban-olgo-2-fazaye-baz-mosbat',
  excerpt: 'الگوی شماره‌ی ۱۰۶ کتاب «زبان الگو» می‌گوید: فضای باز بی‌شکل، فضایی است که کسی از آن استفاده نمی‌کند. حیاط خانه‌ی سنتی ایرانی، نمونه‌ی کامل فضای باز «مثبت» بود؛ فضای رهاشده‌ی میان برج‌های آپارتمانی امروز، نمونه‌ی دقیق نقطه‌ی مقابل آن.',
  category: 'معماری و شهرسازی',
  coverEmoji: '🌳',
  author: 'هادی عطایی',
  status: 'published',
  content: [
    p('در الگوی شماره‌ی ۱۰۶ کتاب «زبان الگو»، با عنوان «فضای باز مثبت» (Positive Outdoor Space)، کریستوفر الکساندر مسئله‌ای را مطرح می‌کند که در نگاه اول ساده به نظر می‌رسد، اما پیامدهای عمیقی دارد: فضاهای بازی که صرفاً «باقیمانده»‌ی میان ساختمان‌ها هستند — بدون شکل، بدون مرز مشخص، بدون هدف — عملاً هرگز مورد استفاده قرار نمی‌گیرند.'),
    h('فضای «مثبت» در برابر فضای «منفی»'),
    p('الکساندر بین دو نوع فضای باز تمایز قائل می‌شود. فضای باز «منفی»، فضایی بی‌شکل است — باقیمانده‌ای که وقتی ساختمان‌ها روی زمین قرار می‌گیرند، پشت سر خود به‌جا می‌گذارند. در مقابل، فضای باز «مثبت» شکلی مشخص و قطعی دارد — به همان اندازه که یک اتاق شکل مشخصی دارد — و این شکل، به همان اندازه‌ی شکل ساختمان‌های اطرافش اهمیت دارد. به بیان دیگر، فضای مثبت چیزی است که آگاهانه طراحی شده، نه چیزی که تصادفاً باقی مانده است.'),
    img(
      'https://upload.wikimedia.org/wikipedia/commons/d/d5/%C4%80meri_House_In_K%C4%81sh%C4%81n_4.jpg',
      'حیاط خانه‌ی عامری‌ها، کاشان — نمونه‌ای از فضای باز «مثبت» — عکس: Arpourabedin (CC BY-SA 4.0), ویکی‌مدیا کامانز'
    ),
    h('حیاط ایرانی: مصداق کامل این الگو'),
    p('حیاط مرکزی در خانه‌ی سنتی ایرانی، دقیقاً همان چیزی است که الکساندر توصیف می‌کند: فضایی با مرز کاملاً مشخص (دیوارهای اتاق‌ها و ایوان‌های اطراف آن)، با عملکردی روشن (نشستن، بازی، گردهمایی خانواده)، و با کیفیتی که هیچ‌کس آن را «فضای خالی باقیمانده» نمی‌نامد — بلکه آن را به‌عنوان یکی از مهم‌ترین «اتاق‌های» خانه، حتی بدون سقف، به‌حساب می‌آورد.'),
    h('فضای رهاشده‌ی میان برج‌ها'),
    p('در مقابل، بسیاری از مجتمع‌های آپارتمانی امروزی، دقیقاً همان الگوی «فضای منفی» را بازتولید می‌کنند که الکساندر هشدار داده بود: باریکه‌های چمن بی‌هدف، پارکینگ‌های گسترده، یا فاصله‌های خالی و بی‌شکل میان برج‌ها — فضاهایی که نه مرز روشنی دارند، نه عملکرد مشخصی، و در نتیجه، تقریباً هیچ‌کس در آن‌ها زمان نمی‌گذراند.'),
    img(
      'https://upload.wikimedia.org/wikipedia/commons/2/2d/Aseman_Tehran_Residential_Complex.jpg',
      'یکی از مجتمع‌های مسکونی برج‌مانند در تهران — عکس: Parsa 2au (CC BY-SA 4.0), ویکی‌مدیا کامانز'
    ),
    h('پیامد برای زندگی کودکان'),
    p('برای کودکان، این تفاوت به‌شدت ملموس است. حیاط، فضایی امن، تعریف‌شده و قابل‌نظارت بود — جایی که کودک می‌توانست بازی کند، در حالی‌که همچنان کاملاً «در خانه» محسوب می‌شد. فضای رهاشده‌ی میان برج‌ها، برعکس، نه واقعاً خصوصی است و نه واقعاً عمومی‌ای که برایش برنامه‌ریزی شده باشد؛ نتیجه، فضایی است که والدین آن را برای بازی مستقل کودک چندان امن یا مناسب نمی‌دانند، و کودک عملاً از یک فضای باز معنادار برای بازی محروم می‌ماند.'),
    h('پیامد برای زندگی بزرگ‌سالان'),
    p('برای بزرگ‌سالان نیز، فضای باز مثبت به معنای وجود مکانی واقعی برای نشستن، گفت‌وگو با همسایه، یا صرفاً حضور در فضای باز بدون نیاز به ترک کامل محدوده‌ی خانه بود. فضای منفی و بی‌شکل میان برج‌ها، این امکان را نیز از میان می‌برد — نتیجه آن می‌شود که «فضای باز» مجتمع، در عمل، فقط مسیری برای عبور از پارکینگ به درِ ورودی است، نه مکانی برای واقعاً بودن.'),
    h('نتیجه'),
    p('درسی که از این الگو می‌توان گرفت، لزوماً بازگشت به حیاط مرکزی سنتی نیست، بلکه توجه به همان اصل بنیادین است: فضای باز اطراف هر ساختمان، باید آگاهانه و با مرز، عملکرد و شکلی مشخص طراحی شود — نه اینکه صرفاً فاصله‌ی خالی‌ای باشد که از قرار گرفتن ساختمان‌ها در کنار هم باقی مانده است. هر مجتمع مسکونی‌ای که حتی یک فضای باز کوچک اما با شکل و هدف روشن داشته باشد، فرصت واقعی بیشتری برای زندگی جمعی و بازی کودکان فراهم می‌کند، در مقایسه با فضایی وسیع اما بی‌شکل و بی‌هدف.'),
    p('———'),
    p('هادی عطایی — ۲۶ مرداد ۱۴۰۵'),
  ],
};

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.collection('articles');
  const createdAt = new Date(); // real "now" -- always later than the fixed-timestamp earlier articles
  await col.updateOne(
    { slug: article.slug },
    { $set: { ...article, createdAt, updatedAt: createdAt } },
    { upsert: true }
  );
  console.log('upserted:', article.slug, '-', createdAt.toISOString());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
