import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// GET /api/bookmarks/scraped — the current user's bookmarked listing tokens
// and school ids (from the scraped SQLite data, not MongoDB Property docs).
export const GET = async () => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ listings: [], schools: [] }), { status: 200 });
    }

    const user = await User.findById(sessionUser.userId);

    return new Response(
      JSON.stringify({
        listings: user.bookmarkedListings || [],
        schools: user.bookmarkedSchools || [],
      }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};

// POST /api/bookmarks/scraped  { type: 'listing' | 'school', id }
// Toggles the bookmark and returns the new state.
export const POST = async (request) => {
  try {
    await connectDB();

    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: 'ابتدا وارد شوید' }), { status: 401 });
    }

    const { type, id } = await request.json();
    if (type !== 'listing' && type !== 'school') {
      return new Response(JSON.stringify({ message: 'نوع نامعتبر است' }), { status: 400 });
    }
    if (id === undefined || id === null || id === '') {
      return new Response(JSON.stringify({ message: 'شناسه نامعتبر است' }), { status: 400 });
    }

    const user = await User.findById(sessionUser.userId);
    const field = type === 'listing' ? 'bookmarkedListings' : 'bookmarkedSchools';
    const value = type === 'listing' ? String(id) : Number(id);

    const idx = user[field].findIndex((v) => v === value);
    let isBookmarked;
    if (idx === -1) {
      user[field].push(value);
      isBookmarked = true;
    } else {
      user[field].splice(idx, 1);
      isBookmarked = false;
    }
    await user.save();

    return new Response(JSON.stringify({ isBookmarked }), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};
