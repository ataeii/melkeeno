import connectDB from '@/config/database';
import Office from '@/models/Office';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone || !sessionUser?.user?.phone || sessionUser.user.phone !== adminPhone) {
    return null;
  }
  return sessionUser;
}

// GET -- all offices (pending first), admin only.
export const GET = async () => {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });

  await connectDB();
  const offices = await Office.find({}).sort({ status: 1, createdAt: -1 }).populate('userId', 'phone firstName lastName');
  return Response.json(offices);
};

// PATCH -- approve or reject a single office. Body: { officeId, status }.
export const PATCH = async (request) => {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ message: 'دسترسی غیرمجاز' }, { status: 403 });

  const { officeId, status } = await request.json();
  if (!officeId || !['approved', 'rejected'].includes(status)) {
    return Response.json({ message: 'ورودی نامعتبر' }, { status: 400 });
  }

  await connectDB();
  const office = await Office.findByIdAndUpdate(officeId, { status }, { new: true });
  if (!office) return Response.json({ message: 'دفتر یافت نشد' }, { status: 404 });

  return Response.json(office);
};
