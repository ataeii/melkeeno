import connectDB from '@/config/database';
import UserListing from '@/models/UserListing';
import { getSessionUser } from '@/utils/getSessionUser';
import { syncUserListing, advertiserFor } from '@/lib/userListingSync';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone || !sessionUser?.user?.phone || sessionUser.user.phone !== adminPhone) return null;
  return sessionUser;
}

// GET -- all submitted listings (pending first), admin only.
export const GET = async () => {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });

  await connectDB();
  const listings = await UserListing.find({}).sort({ status: 1, createdAt: -1 }).limit(300).lean();
  const out = [];
  for (const l of listings) {
    const adv = await advertiserFor(l.userId);
    out.push({ ...l, advertiserType: adv.type, advertiserName: adv.name });
  }
  return Response.json(out);
};

// PATCH -- { id, status }. Approving publishes to /properties; rejecting retires it.
export const PATCH = async (request) => {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });

  const { id, status } = await request.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return Response.json({ message: 'ورودی نامعتبر' }, { status: 400 });
  }

  await connectDB();
  const listing = await UserListing.findById(id);
  if (!listing) return Response.json({ message: 'آگهی یافت نشد' }, { status: 404 });

  try {
    await syncUserListing(listing, status === 'approved' ? 'PUBLISHED' : 'RETIRED');
  } catch (e) {
    console.log(e);
    return Response.json({ message: 'انتشار در سامانه ناموفق بود' }, { status: 502 });
  }
  listing.status = status;
  await listing.save();
  return Response.json(listing);
};
