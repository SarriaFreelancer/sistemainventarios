import NextAuth from 'next-auth';
import type { AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { logLoginAttempt } from './lib/audit';
import { checkSessionLimits, createActiveSession, removeSessionByIdInternal } from './lib/session-core';

export const authOptions: AuthOptions = {
  useSecureCookies: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL?.includes('localhost'),
        maxAge: 900,
      }
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 4 * 60 * 60, // 4 horas de inactividad absoluta cierran la sesión
    updateAge: 15 * 60, // Refresca la sesión cada 15 minutos que haya actividad
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      checks: ['pkce', 'state'],
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
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

        // --- SESSION LIMITS LOGIC ---
        let sessionToken: string | null = null;
        if (user.companyId) {
          const limits = await checkSessionLimits(user.id, user.companyId);

          if (!limits.allowed) {
            throw new Error(`Límite de licencias alcanzado. Se han utilizado ${limits.activeCount} de ${limits.maxUsers} conexiones permitidas. Comunícate con un administrador.`);
          }

          if (limits.closeSessionId) {
            // User already has an active session, close it to allow this new one
            await removeSessionByIdInternal(limits.closeSessionId);
          }

          // Create new active session record
          sessionToken = await createActiveSession(user.id, user.companyId, {});
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role?.name,
          companyId: user.companyId ? String(user.companyId) : null,
          companyStatus: user.company?.status || null,
          companyPlan: user.company?.planId || null,
          isTrial: (user.company as any)?.isTrial ?? false,
          trialEndsAt: (user.company as any)?.trialEndsAt ? new Date((user.company as any).trialEndsAt).toISOString() : null,
          sessionToken // Add the token
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google' && user?.email) {
        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { company: true, role: true }
        });

        if (existingUser) {
          // Si el usuario existe pero su empresa fue eliminada o no tiene empresa y tampoco es SUPERADMIN, no permitir loguearse creando duplicados
          if (!existingUser.companyId && existingUser.role?.name !== 'SUPERADMIN') {
            console.warn(`Usuario Google ${user.email} intentó ingresar pero su cuenta/empresa fue eliminada.`);
            return false;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }: any) {
      if (account?.provider === 'google' && token.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { role: true, company: true }
        });

        if (!dbUser) {
          let adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
          if (!adminRole) {
            adminRole = await prisma.role.findFirst({ where: { name: 'USER' } });
          }
          if (!adminRole) {
            adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
          }

          // Crear empresa para usuario nuevo que ingresa por Google en estado SUSPENDED (sin plan hasta que pague)
          let baseCompanyName = `Empresa de ${token.name || token.email.split('@')[0]}`;
          let uniqueCompanyName = baseCompanyName;
          let counter = 1;
          while (await prisma.company.findUnique({ where: { name: uniqueCompanyName } })) {
            uniqueCompanyName = `${baseCompanyName} (${counter})`;
            counter++;
          }

          const newCompany = await prisma.company.create({
            data: {
              name: uniqueCompanyName,
              status: 'SUSPENDED',
              planId: null,
              maxUsers: 2,
              maxProducts: 100,
              maxSalesPerMonth: 50
            }
          });

          dbUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name || 'Usuario Google',
              password: '',
              image: token.picture || (user as any)?.image || null,
              roleId: adminRole.id,
              companyId: newCompany.id
            },
            include: { role: true, company: true }
          });
        }
        token.id = String(dbUser.id);
        token.role = dbUser.role?.name;
        token.companyId = dbUser.companyId ? String(dbUser.companyId) : null;
        token.companyStatus = dbUser.company?.status || null;
        token.companyPlan = dbUser.company?.planId || null;
        token.isTrial = (dbUser.company as any)?.isTrial ?? false;
        token.trialEndsAt = (dbUser.company as any)?.trialEndsAt ? new Date((dbUser.company as any).trialEndsAt).toISOString() : null;

        if (dbUser.companyId) {
          try {
            const sessionToken = await createActiveSession(dbUser.id, dbUser.companyId, {});
            token.sessionToken = sessionToken;
          } catch (e) {
            console.error("Error creating active session for Google user", e);
          }
        }

        try {
          await logLoginAttempt({
            userId: dbUser.id,
            companyId: dbUser.companyId,
            email: dbUser.email,
            status: "SUCCESS"
          });
        } catch (e) {
          console.error("Error logging Google login attempt", e);
        }
      } else if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyStatus = user.companyStatus;
        token.companyPlan = user.companyPlan;
        token.isTrial = user.isTrial ?? false;
        token.trialEndsAt = user.trialEndsAt ?? null;
        if (user.sessionToken) {
          token.sessionToken = user.sessionToken;
        }
      }

      // Si el token aún no tiene sessionToken pero el usuario tiene ID y Empresa (ej. token antiguo o refresh)
      if (!token.sessionToken && token.id && token.companyId) {
        try {
          token.sessionToken = await createActiveSession(Number(token.id), Number(token.companyId), {});
        } catch (e) {
          console.error("Error creating fallback sessionToken", e);
        }
      }

      if (trigger === 'update' && session) {
        if (session.companyStatus) token.companyStatus = session.companyStatus;
        if (session.companyPlan) token.companyPlan = session.companyPlan;
        if (session.isTrial !== undefined) token.isTrial = session.isTrial;
        if (session.trialEndsAt !== undefined) token.trialEndsAt = session.trialEndsAt;
      }


      // Auto-heal session: If token says SUSPENDED, check DB to see if they just paid or updated trial
      if (token.companyId) {
        try {
          const companyId = parseInt(token.companyId as string, 10);
          const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { status: true, planId: true }
          });
          if (company) {
            token.companyStatus = company.status;
            token.companyPlan = company.planId;
          }

          try {
            const trialRows: any[] = await prisma.$queryRawUnsafe(
              'SELECT isTrial, trialEndsAt FROM `Company` WHERE id = ? LIMIT 1',
              companyId
            );
            if (trialRows && trialRows[0]) {
              token.isTrial = Boolean(trialRows[0].isTrial);
              token.trialEndsAt = trialRows[0].trialEndsAt ? new Date(trialRows[0].trialEndsAt).toISOString() : null;
            }
          } catch {
            // Silently fallback if column doesn't exist
          }
        } catch (e: any) {
          console.error("Error auto-healing session:", e?.message || e);
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
        session.user.isTrial = token.isTrial ?? false;
        session.user.trialEndsAt = token.trialEndsAt ?? null;
        session.user.sessionToken = token.sessionToken;

        if (token.id) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: Number(token.id) },
              include: { company: true, role: true }
            });
            if (!dbUser || (dbUser.companyId && !dbUser.company && dbUser.role?.name !== 'SUPERADMIN')) {
              // El usuario o su empresa fue eliminada de la base de datos
              return null;
            }
            session.user.role = dbUser.role?.name;
            session.user.companyStatus = dbUser.company?.status || null;
            session.user.companyPlan = dbUser.company?.planId || null;
            session.user.isTrial = (dbUser.company as any)?.isTrial ?? false;
            session.user.trialEndsAt = (dbUser.company as any)?.trialEndsAt ? new Date((dbUser.company as any).trialEndsAt).toISOString() : null;
            if (dbUser.image) session.user.image = dbUser.image;
            if (dbUser.name) session.user.name = dbUser.name;
            if (dbUser.preferences) {
              const prefs = dbUser.preferences as any;
              session.user.cookieConsent = prefs.cookieConsent === true;
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
  const session = await getServerSession(authOptions);
  return session;
}
