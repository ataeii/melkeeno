import connectDB from '@/config/database';
import Office from '@/models/Office';
import { getSessionUser } from '@/utils/getSessionUser';
import { notifyAdmin } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

const SPECIALTIES = ['buy', 'rent', 'commercial', 'residential'];

function parseOfficeBody(body) {
  const name = (body.name || '').trim();
  const address = (body.address || '').trim();
  const phone = (body.phone || '').trim();
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  const description = (body.description || '').trim();
  const workingHours = (body.workingHours || '').trim();
  const specialties = Array.isArray(body.specialties)
    ? body.specialties.filter((s) => SPECIALTIES.includes(s))
    : [];

  if (!name || !address || !phone || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { error: 'نام، آدرس، شماره تماس و موقعیت روی نقشه الزامی است' };
  }

  return { data: { name, address, phone, lat, lng, description, workingHours, specialties } };
}

// GET -- the logged-in user's own office, or null.
export const GET = async () => {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return Response.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }
  await connectDB();
  const office = await Office.findOne({ userId: sessionUser.userId });
  return Response.json(office);
};

// POST -- create a new office for the logged-in user (one per account).
export const POST = async (request) => {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return Response.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }
  await connectDB();

  const existing = await Office.findOne({ userId: sessionUser.userId });
  if (existing) {
    return Response.json({ message: 'شما قبلاً یک دفتر ثبت کرده‌اید' }, { status: 409 });
  }

  const body = await request.json();
  const { data, error } = parseOfficeBody(body);
  if (error) return Response.json({ message: error }, { status: 400 });

  let logoUrl;
  if (body.logoBase64) {
    const cloudinary = (await import('@/config/cloudinary')).default;
    const result = await cloudinary.uploader.upload(body.logoBase64, { folder: 'melkeeno-offices' });
    logoUrl = result.secure_url;
  }

  const office = await Office.create({ ...data, logoUrl, userId: sessionUser.userId, status: 'pending' });

  await notifyAdmin(
    `🏢 دفتر املاک جدید برای بررسی\nنام: ${office.name}\nآدرس: ${office.address}\nتلفن: ${office.phone}\nhttps://melkeeno.ir/admin/offices`
  );

  return Response.json(office, { status: 201 });
};

// PUT -- update the logged-in user's own office. Editing an already-approved
// office sends it back to pending, since the content changed and hasn't
// been re-reviewed.
export const PUT = async (request) => {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.userId) {
    return Response.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
  }
  await connectDB();

  const office = await Office.findOne({ userId: sessionUser.userId });
  if (!office) {
    return Response.json({ message: 'دفتری برای ویرایش یافت نشد' }, { status: 404 });
  }

  const body = await request.json();
  const { data, error } = parseOfficeBody(body);
  if (error) return Response.json({ message: error }, { status: 400 });

  if (body.logoBase64) {
    const cloudinary = (await import('@/config/cloudinary')).default;
    const result = await cloudinary.uploader.upload(body.logoBase64, { folder: 'melkeeno-offices' });
    office.logoUrl = result.secure_url;
  }

  Object.assign(office, data);
  const wasApproved = office.status === 'approved';
  if (wasApproved) office.status = 'pending';
  await office.save();

  if (wasApproved) {
    await notifyAdmin(
      `✏️ دفتر ملکی ویرایش شد و نیاز به بررسی مجدد دارد\nنام: ${office.name}\nhttps://melkeeno.ir/admin/offices`
    );
  }

  return Response.json(office);
};
