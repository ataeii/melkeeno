import connectDB from '@/config/database';
import UserListing from '@/models/UserListing';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

const REQUIRED_FIELDS = ['sellerType', 'listingType', 'district', 'title', 'priceType'];

// GET /api/user-listings — the current user's own submissions (any status)
export const GET = async () => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: 'ابتدا وارد شوید' }), { status: 401 });
    }

    const listings = await UserListing.find({ userId: sessionUser.userId }).sort({ createdAt: -1 });
    return new Response(JSON.stringify(listings), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};

export const POST = async (request) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: 'ابتدا وارد شوید' }), { status: 401 });
    }

    const body = await request.json();

    for (const field of REQUIRED_FIELDS) {
      if (!body[field]) {
        return new Response(JSON.stringify({ message: `فیلد ${field} الزامی است` }), { status: 400 });
      }
    }
    if (body.listingType === 'buy' && !body.price) {
      return new Response(JSON.stringify({ message: 'قیمت فروش الزامی است' }), { status: 400 });
    }
    if (body.listingType === 'rent' && !body.rent && !body.deposit) {
      return new Response(JSON.stringify({ message: 'اجاره یا ودیعه الزامی است' }), { status: 400 });
    }

    const listing = await UserListing.create({
      ...body,
      userId: sessionUser.userId,
      phone: sessionUser.user.phone,
      status: 'pending',
    });

    return new Response(JSON.stringify({ id: listing._id, status: listing.status }), { status: 201 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};
