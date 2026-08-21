import connectDB from '@/config/database';
import ArticleComment from '@/models/ArticleComment';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

const MAX_COMMENT_LENGTH = 2000;
const MAX_NAME_LENGTH = 60;

// GET /api/article-comments?slug=... -- an article's approved comments, newest first.
export const GET = async (request) => {
  try {
    await connectDB();
    const articleSlug = request.nextUrl.searchParams.get('slug');
    if (!articleSlug) {
      return Response.json({ message: 'slug الزامی است' }, { status: 400 });
    }

    const comments = await ArticleComment.find({ articleSlug, status: 'approved' }).sort({ createdAt: -1 });
    return Response.json({ comments, count: comments.length });
  } catch (error) {
    console.log(error);
    return Response.json({ message: 'خطایی رخ داد' }, { status: 500 });
  }
};

// POST -- no login required. If a session exists, the comment is attributed
// to that account's real name; otherwise the commenter's own typed name is
// used (or "ناشناس" if left blank).
export const POST = async (request) => {
  try {
    await connectDB();
    const body = await request.json();
    const articleSlug = (body.articleSlug || '').trim();
    const comment = (body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH);

    if (!articleSlug || !comment) {
      return Response.json({ message: 'متن نظر الزامی است' }, { status: 400 });
    }

    const sessionUser = await getSessionUser();
    let authorName;
    let userId;
    if (sessionUser?.userId) {
      const { user } = sessionUser;
      authorName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.phone;
      userId = sessionUser.userId;
    } else {
      const typedName = (body.authorName || '').trim().slice(0, MAX_NAME_LENGTH);
      authorName = typedName || 'ناشناس';
    }

    const created = await ArticleComment.create({ articleSlug, comment, authorName, userId });
    return Response.json(created, { status: 201 });
  } catch (error) {
    console.log(error);
    return Response.json({ message: 'خطایی رخ داد' }, { status: 500 });
  }
};
