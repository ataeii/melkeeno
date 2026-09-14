import connectDB from '@/config/database';
import SupplierPrice from '@/models/SupplierPrice';

export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = category ? { category } : {};
    const items = await SupplierPrice.find(query).sort({ price: 1 }).lean();
    const updatedAt = items.length ? items[0].fetchedAt : null;
    return Response.json({ items, updatedAt });
  } catch (error) {
    console.log(error);
    return Response.json({ error: 'خطا در دریافت قیمت فروشندگان' }, { status: 500 });
  }
};
