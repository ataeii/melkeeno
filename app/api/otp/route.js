import crypto from 'crypto';
import connectDB from '@/config/database';
import OtpCode from '@/models/OtpCode';
import { sendOtpSms } from '@/lib/sms';

const PHONE_REGEX = /^09\d{9}$/;
const RESEND_COOLDOWN_MS = 60 * 1000;
const CODE_TTL_MS = 5 * 60 * 1000;

export const POST = async (request) => {
  try {
    await connectDB();

    const { phone } = await request.json();

    if (!phone || !PHONE_REGEX.test(phone)) {
      return new Response(JSON.stringify({ message: 'شماره موبایل نامعتبر است' }), {
        status: 400,
      });
    }

    const existing = await OtpCode.findOne({ phone });

    if (existing) {
      const elapsed = Date.now() - existing.createdAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        return new Response(
          JSON.stringify({
            message: 'لطفا کمی صبر کنید',
            secondsRemaining: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
          }),
          { status: 429 }
        );
      }
      await existing.deleteOne();
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    const otp = await OtpCode.create({ phone, code, expiresAt });
    console.log(`[otp-send] phone=${phone} createdAt=${otp.createdAt.toISOString()} expiresAt=${expiresAt.toISOString()}`);

    try {
      await sendOtpSms(phone, code);
    } catch (error) {
      console.log(error);
      await otp.deleteOne();
      return new Response(JSON.stringify({ message: 'ارسال پیامک ناموفق بود' }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'کد تایید ارسال شد' }), {
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: 'خطایی رخ داد' }), { status: 500 });
  }
};
