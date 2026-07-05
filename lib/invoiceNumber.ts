import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Returns the next invoice number for the current day in the format
 * `VEN-YYYYMMDD-###` where the sequence is zero‑padded to three digits.
 * Uses a row‑level lock on `InvoiceCounter` to guarantee uniqueness even
 * with concurrent requests.
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const today = new Date();
  const datePart = format(today, 'yyyyMMdd');

  const result = await prisma.$transaction(async (tx: any) => {
    return tx.invoiceCounter.upsert({
      where: { date: new Date(datePart + 'T00:00:00.000Z') },
      update: { lastSeq: { increment: 1 } },
      create: {
        date: new Date(datePart + 'T00:00:00.000Z'),
        lastSeq: 1,
      },
    });
  });

  const seq = String(result.lastSeq).padStart(3, '0');
  return `VEN-${datePart}-${seq}`;
}

export default prisma;
