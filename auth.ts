import NextAuth from 'next-auth';
import type { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { logLoginAttempt } from './lib/audit';

export const authOptions: AuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(credentials);
        if (!parsed.success) {
          console.log('authorize: invalid payload', credentials);
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { role: true } });
        console.log('authorize: found user', !!user, parsed.data.email);
        if (!user) {
          await logLoginAttempt({
            email: parsed.data.email,
            status: "FAILED",
            reason: "USER_NOT_FOUND"
          });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        console.log('authorize: password valid?', valid);
        if (!valid) {
          await logLoginAttempt({
            userId: user.id,
            email: parsed.data.email,
            status: "FAILED",
            reason: "WRONG_PASSWORD"
          });
          return null;
        }

        await logLoginAttempt({
          userId: user.id,
          email: parsed.data.email,
          status: "SUCCESS"
        });

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role?.name,
          companyId: user.companyId ? String(user.companyId) : null
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };

export async function getAuthSession() {
  return getServerSession(authOptions);
}
