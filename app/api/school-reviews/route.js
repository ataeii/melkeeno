import connectDB from '@/config/database';
import SchoolReview from '@/models/SchoolReview';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// GET /api/school-reviews?schoolId=123 — a school's approved reviews +
// average rating, newest first.
export const GET = async (request) => {
  try {
    await connectDB();
    const schoolId = Number(request.nextUrl.searchParams.get('schoolId'));
    if (!schoolId) {
      return Response.json({ message: 'schoolId الزامی است' }, { status: 400 });
    }

    const reviews = await SchoolReview.find({ schoolId, status: 'approved' }).sort({ createdAt: -1 });
    const average = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

    return Response.json({ reviews, average, count: reviews.length });
  } catch (error) {
    console.log(error);
    return Response.json({ message: 'خطایی رخ داد' }, { status: 500 });
  }
};

export const POST = async (request) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return Response.json({ message: 'برای ثبت نظر ابتدا وارد شوید' }, { status: 401 });
    }

    const body = await request.json();
    const schoolId = Number(body.schoolId);
    const schoolName = (body.schoolName || '').trim();
    const rating = Number(body.rating);
    const comment = (body.comment || '').trim();

    if (!schoolId || !schoolName || !comment || !rating || rating < 1 || rating > 5) {
      return Response.json({ message: 'نام مدرسه، امتیاز (۱ تا ۵) و متن نظر الزامی است' }, { status: 400 });
    }

    const { user } = sessionUser;
    const authorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.phone;

    const review = await SchoolReview.create({
      schoolId,
      schoolName,
      userId: sessionUser.userId,
      authorName,
      rating,
      comment,
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    console.log(error);
    return Response.json({ message: 'خطایی رخ داد' }, { status: 500 });
  }
};
