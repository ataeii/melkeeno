import connectDB from '@/config/database';
import User from '@/models/User';
import OtpCode from '@/models/OtpCode';

import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'OTP',
      credentials: {
        phone: { label: 'شماره موبایل', type: 'text' },
        code: { label: 'کد تایید', type: 'text' },
      },
      async authorize(credentials) {
        const { phone, code } = credentials || {};
        if (!phone || !code) {
          console.log('[otp-auth] missing phone or code in credentials');
          return null;
        }

        await connectDB();

        const otp = await OtpCode.findOne({ phone });
        if (!otp) {
          console.log(`[otp-auth] no OTP record found for ${phone}`);
          return null;
        }

        console.log(
          `[otp-auth] phone=${phone} now=${new Date().toISOString()} expiresAt=${otp.expiresAt.toISOString()} attempts=${otp.attempts} codeMatches=${otp.code === code}`
        );

        if (otp.expiresAt < new Date()) {
          console.log(`[otp-auth] rejecting: expired`);
          await otp.deleteOne();
          return null;
        }

        if (otp.attempts >= 5) {
          console.log(`[otp-auth] rejecting: too many attempts`);
          await otp.deleteOne();
          return null;
        }

        if (otp.code !== code) {
          console.log(`[otp-auth] rejecting: code mismatch`);
          otp.attempts += 1;
          await otp.save();
          return null;
        }

        await otp.deleteOne();

        try {
          let user = await User.findOne({ phone });
          if (!user) {
            user = await User.create({ phone });
          }
          console.log(`[otp-auth] success, returning user id=${user._id}`);
          return { id: user._id.toString(), phone: user.phone };
        } catch (err) {
          console.log(`[otp-auth] error creating/finding user: ${err.message}`);
          throw err;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.phone = token.phone;
      return session;
    },
  },
};
