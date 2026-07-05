import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/** Simple JWT verification helper */
function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  try {
    return jwt.verify(token, secret) as { userId: string; role: string };
  } catch {
    throw new Error('Invalid token');
  }
}

/**
 * POST /api/sales/review
 * Body: { saleId: string }
 * Transitions a sale from PENDING to REVIEWED.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const { userId } = verifyJwt(token);

  const { saleId } = await request.json();
  if (!saleId) {
    return NextResponse.json({ error: 'saleId is required' }, { status: 400 });
  }

  const updatedSale = await prisma.$transaction(async (tx: any) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      throw new Error('Sale not found');
    }
    if (sale.status !== 'PENDING') {
      throw new Error(`Sale is not in PENDING status (current: ${sale.status})`);
    }
    const result = await tx.sale.update({
      where: { id: saleId },
      data: { status: 'REVIEWED' },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: 'SALE_REVIEWED',
        entity: 'Sale',
        details: JSON.stringify({ saleId, newStatus: 'REVIEWED' }),
      },
    });
    return result;
  });

  return NextResponse.json({ message: 'Sale reviewed', sale: updatedSale });
}
