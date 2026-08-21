import connectDB from '@/config/database';
import ContactMessage from '@/models/ContactMessage';
import { notifyAdmin } from '@/lib/telegram';

export const POST = async (request) => {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const phone = (body.phone || '').trim();
    const email = (body.email || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();

    if (!name || !message || (!phone && !email)) {
      return Response.json(
        { error: 'نام، پیام، و حداقل یک راه ارتباطی (تلفن یا ایمیل) الزامی است' },
        { status: 400 }
      );
    }

    await connectDB();
    const contactMessage = await ContactMessage.create({ name, phone, email, subject, message });

    // Best-effort -- notifyAdmin never throws, so a Telegram/relay hiccup
    // never turns a successfully-saved message into a failed request.
    await notifyAdmin(
      `📩 پیام جدید از فرم تماس\n` +
        `نام: ${name}\n` +
        (phone ? `تلفن: ${phone}\n` : '') +
        (email ? `ایمیل: ${email}\n` : '') +
        (subject ? `موضوع: ${subject}\n` : '') +
        `پیام: ${message}`
    );

    return Response.json({ id: contactMessage._id }, { status: 201 });
  } catch (error) {
    console.log(error);
    return Response.json({ error: 'خطا در ارسال پیام' }, { status: 500 });
  }
};
