import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: 'ابتدا وارد شوید' }), { status: 401 });
    }

    const user = await User.findById(sessionUser.userId);
    return new Response(
      JSON.stringify({ phone: user.phone, firstName: user.firstName || '', lastName: user.lastName || '' }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};

export const PATCH = async (request) => {
  try {
    await connectDB();
    const sessionUser = await getSessionUser();
    if (!sessionUser || !sessionUser.userId) {
      return new Response(JSON.stringify({ message: 'ابتدا وارد شوید' }), { status: 401 });
    }

    const { firstName, lastName } = await request.json();
    if (!firstName?.trim() || !lastName?.trim()) {
      return new Response(JSON.stringify({ message: 'نام و نام خانوادگی الزامی است' }), { status: 400 });
    }

    const user = await User.findByIdAndUpdate(
      sessionUser.userId,
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true }
    );

    return new Response(
      JSON.stringify({ phone: user.phone, firstName: user.firstName, lastName: user.lastName }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};
