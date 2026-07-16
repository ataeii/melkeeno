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
        if (!phone || !code) return null;

        await connectDB();

        const otp = await OtpCode.findOne({ phone });
        if (!otp) return null;

        if (otp.expiresAt < new Date()) {
          await otp.deleteOne();
          return null;
        }

        if (otp.attempts >= 5) {
          await otp.deleteOne();
          return null;
        }

        if (otp.code !== code) {
          otp.attempts += 1;
          await otp.save();
          return null;
        }

        await otp.deleteOne();

        let user = await User.findOne({ phone });
        if (!user) {
          user = await User.create({ phone });
        }

        return { id: user._id.toString(), phone: user.phone };
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
