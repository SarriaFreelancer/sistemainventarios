import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, amount } = body;

    let companyId = session.user.companyId ? parseInt(session.user.companyId, 10) : null;
    let company: any = null;

    if (companyId) {
      company = await prisma.company.findUnique({ where: { id: companyId } });
    }

    // Si el usuario está registrado pero no tiene empresa asociada aún, la creamos automáticamente
    if (!company) {
      const userId = session.user.id ? parseInt(session.user.id, 10) : null;
      let user: any = null;

      if (userId && !isNaN(userId)) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      } else if (session.user.email) {
        user = await prisma.user.findUnique({ where: { email: session.user.email } });
      }

      if (!user) {
        return NextResponse.json({ message: 'Usuario no encontrado. Por favor inicia sesión de nuevo.' }, { status: 404 });
      }

      const baseCompanyName = user.name ? `Empresa de ${user.name}` : `Empresa ${user.email}`;
      let uniqueCompanyName = baseCompanyName;
      let counter = 1;
      while (await prisma.company.findUnique({ where: { name: uniqueCompanyName } })) {
        uniqueCompanyName = `${baseCompanyName} (${counter})`;
        counter++;
      }

      const rawPlanId = planId ? planId.toLowerCase() : 'basico';

      const maxUsers = rawPlanId === 'premium' ? 999 : rawPlanId === 'intermedio' ? 5 : 2;
      const maxProducts = rawPlanId === 'premium' ? 999999 : rawPlanId === 'intermedio' ? 1000 : 100;
      const maxSalesPerMonth = rawPlanId === 'premium' ? 999999 : rawPlanId === 'intermedio' ? 999999 : 50;

      company = await prisma.company.create({
        data: {
          name: uniqueCompanyName,
          planId: planId,
          status: 'SUSPENDED',
          maxUsers,
          maxProducts,
          maxSalesPerMonth
        } as any
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          companyId: company.id,
          role: { connect: { name: 'ADMIN' } }
        }
      });
    }

    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = await prisma.subscriptionPayment.create({
      data: {
        companyId: company.id,
        planId,
        amount,
        currency: 'COP',
        boldReference: orderReference,
        status: 'PENDING'
      }
    });

    // Forzamos la llave nueva por si el servidor no fue reiniciado y tiene la vieja en memoria
    const integrityKey = "PqnitYB0OzVsxRVJMPs7sg";
    const amountStr = amount.toString();
    const hashString = `${orderReference}${amountStr}COP${integrityKey}`;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

    console.log("==== BOLD DEBUG ====");
    console.log("orderReference:", orderReference);
    console.log("amountStr:", amountStr);
    console.log("integrityKey:", integrityKey);
    console.log("hashString:", hashString);
    console.log("Generated hash:", hash);
    console.log("====================");

    return NextResponse.json({
      ok: true,
      orderId: orderReference,
      hash,
      amountStr
    });

  } catch (error: any) {
    console.error('Error generando orden:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
