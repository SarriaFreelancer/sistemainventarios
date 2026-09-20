import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().optional(),
  planId: z.string().optional(),
  amount: z.number().optional(), // Amount in COP (e.g. 100000)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: parsed.error.format() }, { status: 400 });
    }

    const { name, email, password, companyName, planId, amount } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // MODO SAAS (Crear cuenta desde Pricing con nueva Empresa y Pago)
    if (companyName && planId && amount !== undefined) {
      const trimmedCompanyName = companyName.trim();
      const existingCompany = await prisma.company.findUnique({ where: { name: trimmedCompanyName } });
      if (existingCompany) {
        return NextResponse.json({ message: 'El nombre de empresa ya está registrado' }, { status: 409 });
      }

      const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await prisma.$transaction(async (tx) => {
        // Asegurar que el rol ADMIN exista
        let adminRole = await tx.role.findFirst({ where: { name: 'ADMIN' } });
        if (!adminRole) {
          adminRole = await tx.role.create({ data: { name: 'ADMIN' } });
        }

        // Obtener configuración de límites de planes
        const rawPlanId = planId ? planId.toLowerCase() : 'basico';
        const settingsKeys = [
          `plan_${rawPlanId}_max_users`,
          `plan_${rawPlanId}_max_products`,
          `plan_${rawPlanId}_max_sales_per_month`,
          `plan_${rawPlanId}_modules`
        ];

        const settings = await tx.setting.findMany({
          where: { key: { in: settingsKeys } }
        });

        const settingsMap = settings.reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>);

        const maxUsers = settingsMap[`plan_${rawPlanId}_max_users`] ? parseInt(settingsMap[`plan_${rawPlanId}_max_users`]) : (rawPlanId === 'premium' ? 999 : rawPlanId === 'intermedio' ? 5 : 2);
        const maxProducts = settingsMap[`plan_${rawPlanId}_max_products`] ? parseInt(settingsMap[`plan_${rawPlanId}_max_products`]) : (rawPlanId === 'premium' ? 999999 : rawPlanId === 'intermedio' ? 1000 : 100);
        const maxSalesPerMonth = settingsMap[`plan_${rawPlanId}_max_sales_per_month`] ? parseInt(settingsMap[`plan_${rawPlanId}_max_sales_per_month`]) : (rawPlanId === 'premium' ? 999999 : rawPlanId === 'intermedio' ? 999999 : 50);

        const company = await tx.company.create({
          data: {
            name: trimmedCompanyName,
            planId: planId,
            status: 'SUSPENDED',
            maxUsers: maxUsers,
            maxProducts: maxProducts,
            maxSalesPerMonth: maxSalesPerMonth
          }
        });

        const modulesKey = `plan_${rawPlanId}_modules`;
        let moduleIdsToAssign: number[] = [];

        if (settingsMap[modulesKey]) {
          try {
            const parsedMods = JSON.parse(settingsMap[modulesKey]);
            if (Array.isArray(parsedMods)) {
              moduleIdsToAssign = parsedMods;
            }
          } catch (e) {
            console.error("Error parsing plan modules:", e);
          }
        }

        if (moduleIdsToAssign.length === 0) {
          const allModules = await tx.module.findMany({ where: { isActive: true }, select: { id: true } });
          moduleIdsToAssign = allModules.map(m => m.id);
        }

        if (moduleIdsToAssign.length > 0) {
          await tx.companyModule.createMany({
            data: moduleIdsToAssign.map((mId: number) => ({
              companyId: company.id,
              moduleId: mId
            })),
            skipDuplicates: true
          });
        }

        const user = await tx.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            companyId: company.id,
            roleId: adminRole.id
          }
        });

        const payment = await tx.subscriptionPayment.create({
          data: {
            companyId: company.id,
            planId,
            amount,
            currency: 'COP',
            boldReference: orderReference,
            status: 'PENDING'
          }
        });

        return { company, user, payment };
      });

      // Llave de integridad para Bold
      const integrityKey = process.env.BOLD_INTEGRITY_KEY || "PqnitYB0OzVsxRVJMPs7sg";
      const amountStr = amount.toString();
      const hashString = `${orderReference}${amountStr}COP${integrityKey}`;
      const hash = crypto.createHash('sha256').update(hashString).digest('hex');

      return NextResponse.json({
        ok: true,
        orderId: orderReference,
        hash,
        amountStr
      });

    } else if (companyName) {
      // MODO REGISTRO CON EMPRESA EN PERÍODO DE PRUEBA (15 días gratis)
      const trimmedCompanyName = companyName.trim();
      const existingCompany = await prisma.company.findUnique({ where: { name: trimmedCompanyName } });
      if (existingCompany) {
        return NextResponse.json({ message: 'El nombre de empresa ya está registrado' }, { status: 409 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Asegurar que el rol ADMIN exista
        let adminRole = await tx.role.findFirst({ where: { name: 'ADMIN' } });
        if (!adminRole) {
          adminRole = await tx.role.create({ data: { name: 'ADMIN' } });
        }

        const settingsKeys = [
          `plan_basico_max_users`,
          `plan_basico_max_products`,
          `plan_basico_max_sales_per_month`,
          `plan_basico_modules`
        ];

        const settings = await tx.setting.findMany({
          where: { key: { in: settingsKeys } }
        });

        const settingsMap = settings.reduce((acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {} as Record<string, string>);

        const maxUsers = settingsMap[`plan_basico_max_users`] ? parseInt(settingsMap[`plan_basico_max_users`]) : 5;
        const maxProducts = settingsMap[`plan_basico_max_products`] ? parseInt(settingsMap[`plan_basico_max_products`]) : 1000;
        const maxSalesPerMonth = settingsMap[`plan_basico_max_sales_per_month`] ? parseInt(settingsMap[`plan_basico_max_sales_per_month`]) : 500;

        const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

        const company = await tx.company.create({
          data: {
            name: trimmedCompanyName,
            status: 'ACTIVE',
            isTrial: true,
            trialStartedAt: new Date(),
            trialEndsAt: trialEndsAt,
            planId: 'trial',
            maxUsers: maxUsers,
            maxProducts: maxProducts,
            maxSalesPerMonth: maxSalesPerMonth
          }
        });

        // En período de prueba habilitamos todos los módulos activos
        let moduleIdsToAssign: number[] = [];
        const allModules = await tx.module.findMany({ where: { isActive: true }, select: { id: true } });
        moduleIdsToAssign = allModules.map(m => m.id);

        if (moduleIdsToAssign.length > 0) {
          await tx.companyModule.createMany({
            data: moduleIdsToAssign.map((mId: number) => ({
              companyId: company.id,
              moduleId: mId
            })),
            skipDuplicates: true
          });
        }

        const user = await tx.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            companyId: company.id,
            roleId: adminRole.id
          }
        });

        return { company, user };
      });

      return NextResponse.json({ ok: true, user: result.user, company: result.company });

    } else {
      // MODO ESTÁNDAR (Crear Usuario individual sin empresa)
      let userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
      if (!userRole) {
        userRole = await prisma.role.create({ data: { name: 'USER' } });
      }

      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          roleId: userRole.id
        }
      });
      return NextResponse.json({ ok: true, user });
    }

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json({
      message: error?.message || 'Error interno del servidor al procesar el registro'
    }, { status: 500 });
  }
}
