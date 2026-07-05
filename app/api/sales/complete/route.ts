import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getNextInvoiceNumber } from '@/lib/invoiceNumber';
import jwt from 'jsonwebtoken';

/**
 * Simple JWT verification – in a real project you'd extract this to a helper.
 */
function verifyJwt(token: string) {
  // secret should be stored in env var JWT_SECRET
  const secret = process.env.JWT_SECRET || 'default_secret';
  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  // ---------------------------------------------------------
  // 1️⃣ Authenticate
  // ---------------------------------------------------------
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  const userId = verifyJwt(token);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // ---------------------------------------------------------
  // 2️⃣ Parse body (expects { saleId: string })
  // ---------------------------------------------------------
  const { saleId } = await req.json();
  if (!saleId) {
    return NextResponse.json({ error: 'saleId required' }, { status: 400 });
  }

  // ---------------------------------------------------------
  // 3️⃣ Transaction: generate invoice number, update sale, audit
  // ---------------------------------------------------------
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 3a – fetch sale with status PENDING
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { details: true },
      });
      if (!sale) {
        throw new Error('Sale not found');
      }
      if (sale.status !== 'PAID') {
        throw new Error('Sale is not in PAID status');
      }

      // 3b – generate next invoice number
      const invoiceNumber = await getNextInvoiceNumber();

      // 3c – update sale (set number & status)
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          saleNumber: invoiceNumber,
          status: 'COMPLETED',
        },
      });

      // 3d – audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'SALE_COMPLETED',
          entity: 'Sale',
          details: JSON.stringify({ saleId, invoiceNumber }),
        },
      });

      // 3e – Apply discounts (simple sum of applicable discounts)
      const discounts = await tx.discount.findMany({
        where: {
          OR: [
            { scope: 'GLOBAL' },
            { scope: 'PRODUCT', productId: { in: sale.details.map((d: any) => d.productId) } },
            { scope: 'PRODUCTS', productIds: { hasSome: sale.details.map((d: any) => d.productId) } },
          ],
        },
      });
      let totalDiscount = 0;
      for (const disc of discounts) {
        if (disc.type === 'PERCENTAGE') {
          totalDiscount += (disc.value / 100) * sale.total;
        } else {
          totalDiscount += disc.value;
        }
      }
      // Update sale total with discount
      await tx.sale.update({
        where: { id: saleId },
        data: { discount: totalDiscount, total: sale.total - totalDiscount },
      });

      // 3f – Decrement inventory for each product
      for (const detail of sale.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            quantityAvailable: { decrement: detail.quantity },
            soldQuantity: { increment: detail.quantity },
          },
        });
      }

      return { invoiceNumber, sale: updatedSale };
    });

    return NextResponse.json({
      message: 'Sale completed successfully',
      invoiceNumber: result.invoiceNumber,
      sale: result.sale,
    });
  } catch (err: any) {
    console.error('Complete sale error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
