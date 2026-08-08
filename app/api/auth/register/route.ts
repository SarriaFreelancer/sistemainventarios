import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { platformDb } from '@/lib/db-manager';
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
      return NextResponse.json({ message: 'Datos inválidos' }, { status: 400 });
    }

    const { name, email, password, companyName, planId, amount } = parsed.data;

    // Verificar si el correo ya existe
    const existingUser = await platformDb.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'El correo ya está registrado' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // MODO SAAS (Crear cuenta desde Pricing con nueva Empresa y Pago)
    if (companyName && planId && amount !== undefined) {
      const existingCompany = await platformDb.company.findUnique({ where: { name: companyName } });
      if (existingCompany) {
        return NextResponse.json({ message: 'El nombre de empresa ya está registrado' }, { status: 409 });
      }

      const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await platformDb.$transaction(async (tx) => {
        // Get plan configuration defaults
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
            name: companyName,
            planId: planId,
            status: 'SUSPENDED',
            maxUsers: maxUsers,
            maxProducts: maxProducts,
            maxSalesPerMonth: maxSalesPerMonth
          } as any
        });

        const modulesKey = `plan_${rawPlanId}_modules`;
        let moduleIdsToAssign: number[] = [];

        if (settingsMap[modulesKey]) {
          try {
            const parsed = JSON.parse(settingsMap[modulesKey]);
            if (Array.isArray(parsed)) {
              moduleIdsToAssign = parsed;
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
            }))
          });
        }

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            company: { connect: { id: company.id } },
            role: { connect: { name: 'ADMIN' as const } }
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

      // Forzamos la llave nueva por si el servidor no fue reiniciado
      const integrityKey = "PqnitYB0OzVsxRVJMPs7sg";
      const amountStr = amount.toString(); 
      const hashString = `${orderReference}${amountStr}COP${integrityKey}`;
      const hash = crypto.createHash('sha256').update(hashString).digest('hex');

      console.log("==== BOLD DEBUG (REGISTER) ====");
      console.log("orderReference:", orderReference);
      console.log("amountStr:", amountStr);
      console.log("integrityKey:", integrityKey);
      console.log("hashString:", hashString);
      console.log("Generated hash:", hash);
      console.log("===============================");

      return NextResponse.json({ 
        ok: true, 
        orderId: orderReference, 
        hash, 
        amountStr 
      });

    } else if (companyName) {
      // MODO REGISTRO CON EMPRESA PERO SIN PAGO AÚN
      const existingCompany = await platformDb.company.findUnique({ where: { name: companyName } });
      if (existingCompany) {
        return NextResponse.json({ message: 'El nombre de empresa ya está registrado' }, { status: 409 });
      }
      
      const result = await platformDb.$transaction(async (tx) => {
        // Get plan configuration defaults (basico by default here)
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

        const maxUsers = settingsMap[`plan_basico_max_users`] ? parseInt(settingsMap[`plan_basico_max_users`]) : 2;
        const maxProducts = settingsMap[`plan_basico_max_products`] ? parseInt(settingsMap[`plan_basico_max_products`]) : 100;
        const maxSalesPerMonth = settingsMap[`plan_basico_max_sales_per_month`] ? parseInt(settingsMap[`plan_basico_max_sales_per_month`]) : 50;

        const company = await tx.company.create({
          data: {
            name: companyName,
            status: 'SUSPENDED',
            maxUsers: maxUsers,
            maxProducts: maxProducts,
            maxSalesPerMonth: maxSalesPerMonth
          } as any
        });

        const modulesKey = `plan_basico_modules`;
        let moduleIdsToAssign: number[] = [];

        if (settingsMap[modulesKey]) {
          try {
            const parsed = JSON.parse(settingsMap[modulesKey]);
            if (Array.isArray(parsed)) {
              moduleIdsToAssign = parsed;
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
            }))
          });
        }

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            company: { connect: { id: company.id } },
            role: { connect: { name: 'ADMIN' as const } }
          }
        });

        return { company, user };
      });
      return NextResponse.json({ ok: true, user: result.user, company: result.company });

    } else {
      // MODO ESTÁNDAR (Crear Usuario sin empresa asociada)
      const user = await platformDb.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: { connect: { name: 'USER' as const } }
        }
      });
      return NextResponse.json({ ok: true, user });
    }

  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
