import NextAuth from 'next-auth';
import type { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { logLoginAttempt } from './lib/audit';

export const authOptions: AuthOptions = {
  session: { 
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 horas de inactividad absoluta cierran la sesión
    updateAge: 60 * 60, // Refresca la sesión cada hora que haya actividad
  },
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

        const user = await prisma.user.findUnique({ 
          where: { email: parsed.data.email }, 
          include: { role: true, company: true } 
        });
        console.log('authorize: found user', !!user, parsed.data.email);
        if (!user) {
          await logLoginAttempt({
            email: parsed.data.email,
            status: "FAILED",
            reason: "USER_NOT_FOUND"
          });
          return null;
        }

        if (user.isLocked) {
          throw new Error("Tu cuenta ha sido bloqueada por seguridad. Comunícate con tu administrador (o con el administrador global si eres admin).");
        }

        // We no longer throw an error here, so suspended users can login to pay.
        // But we still log the state.
        if (user.company && user.company.status === "SUSPENDED") {
          console.log('authorize: company suspended but allowing login for payment', user.company.name);
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
          
          let maxAttempts = 5;
          if (user.companyId) {
            const settings = await prisma.companySetting.findUnique({ where: { companyId: user.companyId } });
            if (settings) {
              maxAttempts = settings.maxLoginAttempts;
            }
          }
          
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          
          if (newFailedAttempts >= maxAttempts) {
            await prisma.user.update({
              where: { id: user.id },
              data: { isLocked: true, failedLoginAttempts: newFailedAttempts }
            });
            throw new Error(`Cuenta bloqueada tras ${maxAttempts} intentos fallidos. Comunícate con el administrador.`);
          } else {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginAttempts: newFailedAttempts }
            });
            throw new Error(`Contraseña incorrecta (Intento ${newFailedAttempts} de ${maxAttempts}). Al último intento tu cuenta será bloqueada.`);
          }
        }

        if (user.failedLoginAttempts > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0 }
          });
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
          companyId: user.companyId ? String(user.companyId) : null,
          companyStatus: user.company?.status || null,
          companyPlan: user.company?.planId || null
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyStatus = user.companyStatus;
        token.companyPlan = user.companyPlan;
      }

      if (trigger === 'update' && session) {
        if (session.companyStatus) token.companyStatus = session.companyStatus;
        if (session.companyPlan) token.companyPlan = session.companyPlan;
      }

      // Auto-heal session: If token says SUSPENDED, check DB to see if they just paid
      if (token.companyStatus === 'SUSPENDED' && token.companyId) {
        try {
          const company = await prisma.company.findUnique({
            where: { id: parseInt(token.companyId as string, 10) },
            select: { status: true, planId: true }
          });
          if (company) {
            token.companyStatus = company.status;
            token.companyPlan = company.planId;
          }
        } catch (e) {
          console.error("Error auto-healing session", e);
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.companyStatus = token.companyStatus;
        session.user.companyPlan = token.companyPlan;

        if (token.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: Number(token.id) },
              select: { image: true, name: true, preferences: true }
            });
            if (dbUser) {
              if (dbUser.image) session.user.image = dbUser.image;
              if (dbUser.name) session.user.name = dbUser.name;
              if (dbUser.preferences) {
                const prefs = dbUser.preferences as any;
                session.user.cookieConsent = prefs.cookieConsent === true;
              }
            }
          } catch (e) {
            console.error("Error fetching dbUser in session callback", e);
          }
        }
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
