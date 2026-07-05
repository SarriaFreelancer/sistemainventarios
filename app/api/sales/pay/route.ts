import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/** Simple JWT verification */
function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  try {
    return jwt.verify(token, secret) as { userId: string; role: string };
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
  const { saleId, paymentMethod = 'EFECTIVO' } = await req.json();
  if (!saleId) {
    return NextResponse.json({ error: 'saleId required' }, { status: 400 });
  }

  try {
    const updatedSale = await prisma.$transaction(async (tx: any) => {
      // Verify sale is in REVIEWED state
      const sale = await tx.sale.findUnique({ where: { id: saleId } });
      if (!sale) {
        throw new Error('Sale not found');
      }
      if (sale.status !== 'REVIEWED') {
        throw new Error('Sale is not in REVIEWED status');
      }

      // Update status to PAID and record payment method
      const result = await tx.sale.update({
        where: { id: saleId },
        data: { status: 'PAID', paymentMethod },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SALE_PAID',
          entity: 'Sale',
          details: JSON.stringify({ saleId, newStatus: 'PAID', paymentMethod }),
        },
      });

      return result;
    });

    return NextResponse.json({ message: 'Sale marked as PAID', sale: updatedSale }, { status: 200 });
  } catch (err: any) {
    console.error('Pay sale error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
