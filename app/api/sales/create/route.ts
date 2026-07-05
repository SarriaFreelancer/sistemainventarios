import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/** Simple JWT verification */
function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // ── Authenticate ──
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const userId = verifyJwt(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // ── Parse body ──
  const { client, discount = 0, paymentMethod = 'EFECTIVO', details } = await req.json();
  if (!details || !Array.isArray(details) || details.length === 0) {
    return NextResponse.json({ error: 'Sale details required' }, { status: 400 });
  }

  try {
    const newSale = await prisma.$transaction(async (tx: any) => {
      // Create sale with PENDING status and its details
      const createdSale = await tx.sale.create({
        data: {
          userId,
          client,
          discount: Number(discount),
          paymentMethod,
          status: 'PENDING',
          details: {
            create: details.map((d: any) => ({
              productId: d.productId,
              quantity: Number(d.quantity),
              unitPrice: Number(d.unitPrice),
              subtotal: Number(d.subtotal),
              discount: Number(d.discount ?? 0),
              total: Number(d.total),
            })),
          },
        },
        include: { details: true },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SALE_CREATED',
          entity: 'Sale',
          details: JSON.stringify({ saleId: createdSale.id }),
        },
      });

      return createdSale;
    });

    return NextResponse.json({ message: 'Sale created', sale: newSale }, { status: 201 });
  } catch (err: any) {
    console.error('Create sale error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
