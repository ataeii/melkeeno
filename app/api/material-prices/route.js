import connectDB from '@/config/database';
import MaterialPrice from '@/models/MaterialPrice';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    await connectDB();
    const items = await MaterialPrice.find({}).sort({ category: 1, price: -1 }).lean();
    const updatedAt = items.length ? items[0].fetchedAt : null;
    return Response.json({ items, updatedAt });
  } catch (error) {
    console.log(error);
    return Response.json({ error: 'خطا در دریافت قیمت مصالح' }, { status: 500 });
  }
};
