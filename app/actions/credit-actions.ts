"use server";

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCreditAuthContext } from '@/lib/credit-auth';
import { logActivity } from '@/lib/audit';
import { createNotification } from '@/app/actions/notification-actions';

// Sincronizar stock físico en WMS o Bodega
async function syncWarehouseStock(
  tx: any,
  productId: number,
  companyId: number,
  branchId: number | null,
  deltaQty: number
) {
  try {
    const warehouse = branchId
      ? await tx.warehouse.findFirst({
          where: { branchId, companyId, status: 'ACTIVE' },
          orderBy: { isDefault: 'desc' }
        })
      : await tx.warehouse.findFirst({
          where: { companyId, isDefault: true, status: 'ACTIVE' }
        }) || await tx.warehouse.findFirst({
          where: { companyId, status: 'ACTIVE' }
        });

    if (warehouse) {
      const stockRecord = await tx.warehouseStock.findFirst({
        where: { productId, warehouseId: warehouse.id }
      });
      if (stockRecord) {
        const updatedPhysical = Math.max(0, stockRecord.physical + deltaQty);
        await tx.warehouseStock.update({
          where: { id: stockRecord.id },
          data: { physical: updatedPhysical }
        });
      } else if (deltaQty > 0) {
        await tx.warehouseStock.create({
          data: {
            productId,
            warehouseId: warehouse.id,
            physical: deltaQty,
            companyId
          }
        });
      }
    }
  } catch (err) {
    console.warn('[SYNC_WAREHOUSE_STOCK_WARN]', err);
  }
}

// ─── Schemas de Validación ──────────────────────────────────────────────────

const creditItemSchema = z.object({
  productId: z.coerce.number().optional().nullable(),
  comboId: z.coerce.number().optional().nullable(),
  comboName: z.string().optional().nullable(),
  isCombo: z.boolean().default(false),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

const creditInstallmentInputSchema = z.object({
  installmentNumber: z.coerce.number().min(1),
  amount: z.coerce.number().min(1, 'El valor de la cuota debe ser positivo'),
  dueDate: z.string().min(1, 'Fecha de vencimiento requerida'),
  notes: z.string().optional().nullable(),
});

const createCreditOperationSchema = z.object({
  customerId: z.coerce.number().min(1, 'Debe seleccionar un cliente'),
  branchId: z.coerce.number().optional().nullable(),
  deliveryMode: z.enum(['IMMEDIATE', 'UPON_PAYMENT']).default('IMMEDIATE'),
  downPayment: z.coerce.number().min(0).default(0),
  downPaymentMethod: z.string().default('EFECTIVO'),
  downPaymentReference: z.string().optional().nullable(),
  items: z.array(creditItemSchema).min(1, 'Debe incluir al menos un producto o combo'),
  installments: z.array(creditInstallmentInputSchema).default([]),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── 1. Crear Operación a Crédito ───────────────────────────────────────────

export async function createCreditOperation(data: any) {
  try {
    const { companyId, userId, setting } = await getCreditAuthContext();

    const parsed = createCreditOperationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
    }

    const {
      customerId,
      branchId,
      deliveryMode,
      downPayment,
      downPaymentMethod,
      downPaymentReference,
      items,
      installments,
      dueDate,
      notes
    } = parsed.data;

    // Verificar cliente
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId }
    });
    if (!customer) {
      return { success: false, error: 'Cliente no encontrado o no pertenece a la empresa' };
    }

    // Calcular subtotales y total
    const computedItems = items.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      const total = Math.max(0, subtotal - item.discount);
      return {
        ...item,
        subtotal,
        total
      };
    });

    const totalAmount = computedItems.reduce((acc, curr) => acc + curr.total, 0);
    if (totalAmount <= 0) {
      return { success: false, error: 'El total de la operación debe ser mayor a 0' };
    }

    if (downPayment > totalAmount) {
      return { success: false, error: 'El anticipo inicial no puede ser mayor al valor total de la venta' };
    }

    const initialBalance = Math.max(0, totalAmount - downPayment);

    // Validar suma de cuotas si hay saldo pendiente y se definieron cuotas
    if (installments.length > 0 && initialBalance > 0) {
      const sumInstallments = installments.reduce((acc, cur) => acc + cur.amount, 0);
      const diff = Math.abs(sumInstallments - initialBalance);
      if (diff > 1) { // margen de tolerancia mínimo por redondeos
        return {
          success: false,
          error: `La suma de las cuotas ($${sumInstallments.toLocaleString()}) no coincide con el saldo a financiar ($${initialBalance.toLocaleString()})`
        };
      }
    }

    // Configuración de reservas y días
    const enableReservation = setting?.creditEnableStockReservation ?? true;
    const reservationDays = setting?.creditReservationDays ?? 30;
    const reservationExpiresAt = deliveryMode === 'UPON_PAYMENT' && enableReservation
      ? new Date(Date.now() + reservationDays * 24 * 60 * 60 * 1000)
      : null;

    // Validar disponibilidad antes de la transacción
    for (const item of computedItems) {
      if (item.productId) {
        const prod = await prisma.product.findFirst({
          where: { id: Number(item.productId), companyId }
        });
        if (!prod) return { success: false, error: `Producto ID ${item.productId} no encontrado` };

        if (deliveryMode === 'IMMEDIATE') {
          if (!setting?.allowNegativeStock && prod.quantityAvailable < item.quantity) {
            return {
              success: false,
              error: `Stock físico insuficiente para "${prod.name}". Disponible: ${prod.quantityAvailable} u., Solicitado: ${item.quantity} u.`
            };
          }
        } else if (deliveryMode === 'UPON_PAYMENT' && enableReservation) {
          const availableToReserve = prod.quantityAvailable - prod.reservedQuantity;
          if (!setting?.allowNegativeStock && availableToReserve < item.quantity) {
            return {
              success: false,
              error: `Disponibilidad insuficiente para reservar "${prod.name}". Libre para reserva: ${availableToReserve} u., Solicitado: ${item.quantity} u.`
            };
          }
        }
      }
    }

    // Ejecución atómica y consistente
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generar código consecutivo seguro para el crédito
      const prefix = setting?.creditPrefix || 'CRE';
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

      const counter = await tx.invoiceCounter.upsert({
        where: {
          companyId_date: {
            companyId,
            date: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          }
        },
        update: { lastSeq: { increment: 1 } },
        create: {
          companyId,
          date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lastSeq: 1
        }
      });

      const code = `${prefix}-${dateStr}-${String(counter.lastSeq).padStart(4, '0')}`;

      // 2. Determinar estados iniciales
      const isPaid = initialBalance === 0;
      const initialStatus = isPaid ? 'PAID' : 'ACTIVE';
      const initialDeliveryStatus = deliveryMode === 'IMMEDIATE' ? 'DELIVERED' : 'PENDING';

      // 3. Crear registro de Crédito
      const operation = await tx.creditOperation.create({
        data: {
          code,
          companyId,
          customerId,
          userId,
          branchId: branchId || null,
          deliveryMode,
          status: initialStatus,
          deliveryStatus: initialDeliveryStatus,
          totalAmount,
          downPayment,
          paidAmount: downPayment,
          balance: initialBalance,
          isStockReserved: deliveryMode === 'UPON_PAYMENT' && enableReservation,
          reservationExpiresAt,
          startDate: now,
          dueDate: dueDate ? new Date(dueDate) : (installments[installments.length - 1]?.dueDate ? new Date(installments[installments.length - 1].dueDate) : null),
          lastPaymentDate: downPayment > 0 ? now : null,
          notes: notes || null,
          items: {
            create: computedItems.map((item) => ({
              productId: item.productId ? Number(item.productId) : null,
              comboId: item.comboId ? Number(item.comboId) : null,
              comboName: item.comboName || null,
              isCombo: Boolean(item.isCombo || item.comboId),
              quantity: item.quantity,
              deliveredQuantity: deliveryMode === 'IMMEDIATE' ? item.quantity : 0,
              reservedQuantity: (deliveryMode === 'UPON_PAYMENT' && enableReservation) ? item.quantity : 0,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              discount: item.discount,
              total: item.total,
              companyId
            }))
          }
        },
        include: { items: true }
      });

      // 4. Crear Plan de Cuotas si existen
      if (installments.length > 0) {
        for (const inst of installments) {
          await tx.creditInstallment.create({
            data: {
              creditOperationId: operation.id,
              installmentNumber: inst.installmentNumber,
              amount: inst.amount,
              paidAmount: 0,
              dueDate: new Date(inst.dueDate),
              status: 'PENDING',
              notes: inst.notes || null,
              companyId
            }
          });
        }
      }

      // 5. Manejo del Anticipo Inicial si > 0
      let createdPayment: any = null;
      if (downPayment > 0) {
        const receiptNumber = `REC-${code}-01`;
        createdPayment = await tx.creditPayment.create({
          data: {
            receiptNumber,
            creditOperationId: operation.id,
            customerId,
            amount: downPayment,
            paymentDate: now,
            paymentMethod: downPaymentMethod || 'EFECTIVO',
            reference: downPaymentReference || 'Anticipo inicial de apertura',
            notes: 'Pago inicial registrado al momento de crear el crédito',
            status: 'CONFIRMED',
            registeredByUserId: userId,
            companyId
          }
        });
      }

      // 6. Impacto en Inventario según la Modalidad de Entrega
      if (deliveryMode === 'IMMEDIATE') {
        // MODALIDAD A: Entrega física inmediata -> descuento de stock y creación de Venta
        for (const item of computedItems) {
          if (item.productId) {
            await tx.product.update({
              where: { id: Number(item.productId) },
              data: {
                quantityAvailable: { decrement: item.quantity },
                soldQuantity: { increment: item.quantity }
              }
            });
            await syncWarehouseStock(tx, Number(item.productId), companyId, branchId ?? null, -item.quantity);
          }
        }

        // Crear registro de Entrega formal
        const deliveryNumber = `ENT-${code}-01`;
        await tx.creditDelivery.create({
          data: {
            deliveryNumber,
            creditOperationId: operation.id,
            deliveryDate: now,
            deliveredByUserId: userId,
            notes: 'Entrega inmediata efectuada en la creación del crédito',
            companyId,
            items: {
              create: operation.items.map((opItem: any) => ({
                operationItemId: opItem.id,
                quantity: opItem.quantity,
                companyId
              }))
            }
          }
        });

        // Crear Venta asociada para trazabilidad comercial y POS
        const saleNumber = `VEN-${code}`;
        const saleRecord = await tx.sale.create({
          data: {
            saleNumber,
            userId,
            branchId: branchId || null,
            client: customer.name,
            customerId: customer.id,
            discount: 0,
            total: totalAmount,
            paymentMethod: 'CRÉDITO',
            status: 'COMPLETED',
            remarks: `Venta a crédito generada desde Cartera (Operación ${code})`,
            companyId,
            details: {
              create: computedItems.map((item) => ({
                productId: item.productId ? Number(item.productId) : null,
                comboId: item.comboId ? Number(item.comboId) : null,
                comboName: item.comboName || null,
                isCombo: Boolean(item.isCombo || item.comboId),
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                discount: item.discount,
                total: item.total,
                companyId
              }))
            }
          }
        });

        // Vincular saleId a la operación
        await tx.creditOperation.update({
          where: { id: operation.id },
          data: { saleId: saleRecord.id }
        });
      } else {
        // MODALIDAD B: Entrega después del pago -> NO descuenta stock físico
        // Si hay reservas activadas, se bloquea la cantidad comercial
        if (enableReservation) {
          for (const item of computedItems) {
            if (item.productId) {
              await tx.product.update({
                where: { id: Number(item.productId) },
                data: {
                  reservedQuantity: { increment: item.quantity }
                }
              });
            }
          }
        }
      }

      return {
        operation,
        code,
        payment: createdPayment
      };
    });

    await logActivity({
      module: 'CARTERA',
      action: 'CREATE',
      entity: 'CreditOperation',
      entityId: result.operation.id,
      description: `Registró la operación de crédito "${result.code}" por $${totalAmount.toLocaleString()} a nombre de ${customer.name} (Modo: ${deliveryMode === 'IMMEDIATE' ? 'Entrega Inmediata' : 'Entrega Posterior'})`,
      newValues: result.operation
    });

    revalidatePath('/dashboard/cartera');
    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/crm');

    return {
      success: true,
      data: result.operation
    };
  } catch (error: any) {
    console.error('[CREATE_CREDIT_OPERATION_ERROR]', error);
    return { success: false, error: error.message || 'Error al crear la operación a crédito' };
  }
}

// ─── 2. Registrar Abono o Pago Parcial ───────────────────────────────────────

export async function registerCreditPayment(data: {
  creditOperationId: number;
  amount: number;
  paymentMethod?: string;
  reference?: string | null;
  notes?: string | null;
}) {
  try {
    const { companyId, userId, setting } = await getCreditAuthContext();

    const { creditOperationId, amount, paymentMethod = 'EFECTIVO', reference, notes } = data;

    if (!amount || amount <= 0) {
      return { success: false, error: 'El valor del pago debe ser mayor a 0' };
    }

    const operation = await prisma.creditOperation.findFirst({
      where: { id: creditOperationId, companyId },
      include: {
        customer: true,
        installments: {
          where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!operation) {
      return { success: false, error: 'Operación no encontrada o no pertenece a la empresa' };
    }

    if (operation.status === 'CANCELLED') {
      return { success: false, error: 'No se pueden registrar pagos en una operación cancelada' };
    }

    if (operation.balance <= 0) {
      return { success: false, error: 'Esta operación ya se encuentra pagada en su totalidad' };
    }

    if (amount > operation.balance + 0.01) {
      return {
        success: false,
        error: `El abono ($${amount.toLocaleString()}) supera el saldo pendiente ($${operation.balance.toLocaleString()})`
      };
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Consecutivo del recibo
      const paymentsCount = await tx.creditPayment.count({
        where: { creditOperationId: operation.id }
      });
      const receiptNumber = `REC-${operation.code}-${String(paymentsCount + 1).padStart(2, '0')}`;

      // 2. Crear Pago
      const payment = await tx.creditPayment.create({
        data: {
          receiptNumber,
          creditOperationId: operation.id,
          customerId: operation.customerId,
          amount,
          paymentDate: now,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          status: 'CONFIRMED',
          registeredByUserId: userId,
          companyId
        }
      });

      // 3. Distribuir el abono entre las cuotas pendientes
      let remainingToApply = amount;
      for (const inst of operation.installments) {
        if (remainingToApply <= 0) break;

        const unpaidOnInst = inst.amount - inst.paidAmount;
        if (unpaidOnInst <= 0) continue;

        const allocateAmount = Math.min(remainingToApply, unpaidOnInst);

        await tx.creditPaymentInstallment.create({
          data: {
            creditPaymentId: payment.id,
            creditInstallmentId: inst.id,
            amount: allocateAmount,
            companyId
          }
        });

        const newPaidOnInst = inst.paidAmount + allocateAmount;
        const newStatus = newPaidOnInst >= inst.amount - 0.01 ? 'PAID' : 'PARTIAL';

        await tx.creditInstallment.update({
          where: { id: inst.id },
          data: {
            paidAmount: newPaidOnInst,
            status: newStatus
          }
        });

        remainingToApply -= allocateAmount;
      }

      // 4. Actualizar saldo y estado de la operación
      const newPaidAmount = operation.paidAmount + amount;
      const newBalance = Math.max(0, operation.totalAmount - newPaidAmount);
      const isNowFullyPaid = newBalance <= 0.01;

      const updatedOperation = await tx.creditOperation.update({
        where: { id: operation.id },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          lastPaymentDate: now,
          status: isNowFullyPaid ? 'PAID' : operation.status,
          completedAt: isNowFullyPaid ? now : null
        }
      });

      return { payment, updatedOperation, isNowFullyPaid };
    });

    await logActivity({
      module: 'CARTERA',
      action: 'UPDATE',
      entity: 'CreditPayment',
      entityId: result.payment.id,
      description: `Registró abono de $${amount.toLocaleString()} a la operación "${operation.code}" (${operation.customer.name}). Saldo restante: $${result.updatedOperation.balance.toLocaleString()}`,
      newValues: result.payment
    });

    // Si la operación era de Entrega Posterior y quedó 100% pagada, notificar
    if (result.isNowFullyPaid && operation.deliveryMode === 'UPON_PAYMENT' && operation.deliveryStatus !== 'DELIVERED') {
      try {
        const admins = await prisma.user.findMany({
          where: {
            companyId,
            role: { name: { in: ['SUPERADMIN', 'ADMIN'] } }
          }
        });
        for (const admin of admins) {
          await createNotification(
            admin.id,
            companyId,
            '¡Pedido a Crédito Pagado!',
            `El pedido ${operation.code} de ${operation.customer.name} ha sido pagado en su totalidad. Ya está disponible para confirmar y realizar la entrega física.`,
            'SUCCESS'
          );
        }
      } catch (notifErr) {
        console.warn('[NOTIFY_CREDIT_FULLY_PAID_WARN]', notifErr);
      }
    }

    revalidatePath('/dashboard/cartera');
    revalidatePath(`/dashboard/cartera/${operation.id}`);

    return {
      success: true,
      data: result.payment,
      operation: result.updatedOperation
    };
  } catch (error: any) {
    console.error('[REGISTER_CREDIT_PAYMENT_ERROR]', error);
    return { success: false, error: error.message || 'Error al registrar el pago' };
  }
}

// ─── 3. Confirmar Entrega Física (Modalidad B o Entregas Pendientes) ─────────

export async function confirmCreditDelivery(data: {
  creditOperationId: number;
  notes?: string | null;
}) {
  try {
    const { companyId, userId, setting } = await getCreditAuthContext();
    const { creditOperationId, notes } = data;

    const operation = await prisma.creditOperation.findFirst({
      where: { id: creditOperationId, companyId },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!operation) {
      return { success: false, error: 'Operación no encontrada' };
    }

    if (operation.deliveryStatus === 'DELIVERED') {
      return { success: false, error: 'Esta mercancía ya fue entregada previamente' };
    }

    if (operation.status === 'CANCELLED') {
      return { success: false, error: 'No se puede entregar un pedido cancelado' };
    }

    // Regla de Modalidad B: si es entrega posterior, exigir pago completo salvo autorización explícita
    if (operation.deliveryMode === 'UPON_PAYMENT' && operation.balance > 0.01) {
      return {
        success: false,
        error: `La modalidad de esta operación es "Entrega posterior al pago completo". El cliente aún presenta un saldo pendiente de $${operation.balance.toLocaleString()}.`
      };
    }

    // Validar existencias físicas en bodega
    for (const item of operation.items) {
      if (item.productId && item.product) {
        const remainingToDeliver = item.quantity - item.deliveredQuantity;
        if (remainingToDeliver > 0) {
          if (!setting?.allowNegativeStock && item.product.quantityAvailable < remainingToDeliver) {
            return {
              success: false,
              error: `Stock insuficiente en almacén para entregar "${item.product.name}". Disponible: ${item.product.quantityAvailable} u., Necesario: ${remainingToDeliver} u.`
            };
          }
        }
      }
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Descontar físicamente del inventario y liberar reservas si las había
      for (const item of operation.items) {
        const remainingToDeliver = item.quantity - item.deliveredQuantity;
        if (remainingToDeliver > 0 && item.productId) {
          const updateData: any = {
            quantityAvailable: { decrement: remainingToDeliver },
            soldQuantity: { increment: remainingToDeliver }
          };

          if (operation.isStockReserved && item.reservedQuantity > 0) {
            updateData.reservedQuantity = { decrement: item.reservedQuantity };
          }

          await tx.product.update({
            where: { id: item.productId },
            data: updateData
          });

          await syncWarehouseStock(tx, item.productId, companyId, operation.branchId, -remainingToDeliver);

          await tx.creditOperationItem.update({
            where: { id: item.id },
            data: {
              deliveredQuantity: item.quantity,
              reservedQuantity: 0
            }
          });
        }
      }

      // 2. Registrar comprobante de entrega
      const deliveryCount = await tx.creditDelivery.count({
        where: { creditOperationId: operation.id }
      });
      const deliveryNumber = `ENT-${operation.code}-${String(deliveryCount + 1).padStart(2, '0')}`;

      const delivery = await tx.creditDelivery.create({
        data: {
          deliveryNumber,
          creditOperationId: operation.id,
          deliveryDate: now,
          deliveredByUserId: userId,
          notes: notes || 'Entrega física confirmada tras verificación de pago',
          companyId,
          items: {
            create: operation.items.map((item) => ({
              operationItemId: item.id,
              quantity: item.quantity - item.deliveredQuantity,
              companyId
            }))
          }
        }
      });

      // 3. Crear Venta asociada si aún no existía
      if (!operation.saleId) {
        const saleNumber = `VEN-${operation.code}`;
        const saleRecord = await tx.sale.create({
          data: {
            saleNumber,
            userId,
            branchId: operation.branchId,
            client: operation.customer.name,
            customerId: operation.customer.id,
            discount: 0,
            total: operation.totalAmount,
            paymentMethod: 'CRÉDITO',
            status: 'COMPLETED',
            remarks: `Venta formalizada por entrega física de Cartera (Operación ${operation.code})`,
            companyId,
            details: {
              create: operation.items.map((item) => ({
                productId: item.productId,
                comboId: item.comboId,
                comboName: item.comboName,
                isCombo: item.isCombo,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
                discount: item.discount,
                total: item.total,
                companyId
              }))
            }
          }
        });

        await tx.creditOperation.update({
          where: { id: operation.id },
          data: { saleId: saleRecord.id }
        });
      }

      // 4. Actualizar estado de entrega en la operación
      const updatedOp = await tx.creditOperation.update({
        where: { id: operation.id },
        data: {
          deliveryStatus: 'DELIVERED',
          isStockReserved: false,
          status: operation.balance <= 0.01 ? 'DELIVERED' : operation.status
        }
      });

      return { delivery, updatedOp };
    });

    await logActivity({
      module: 'CARTERA',
      action: 'UPDATE',
      entity: 'CreditDelivery',
      entityId: result.delivery.id,
      description: `Confirmó entrega física total de mercancía para la operación "${operation.code}" (${operation.customer.name})`,
      newValues: result.delivery
    });

    revalidatePath('/dashboard/cartera');
    revalidatePath(`/dashboard/cartera/${operation.id}`);
    revalidatePath('/dashboard/products');

    return { success: true, data: result.delivery };
  } catch (error: any) {
    console.error('[CONFIRM_CREDIT_DELIVERY_ERROR]', error);
    return { success: false, error: error.message || 'Error al confirmar la entrega' };
  }
}

// ─── 4. Anular Pago con Trazabilidad Compensatoria ─────────────────────────

export async function voidCreditPayment(data: {
  paymentId: number;
  reason: string;
}) {
  try {
    const { companyId, userId, userRole } = await getCreditAuthContext();
    const { paymentId, reason } = data;

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Debe especificar un motivo detallado para anular el pago (mínimo 5 caracteres)' };
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes. Solo administradores pueden anular pagos' };
    }

    const payment = await prisma.creditPayment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        creditOperation: true,
        allocations: { include: { creditInstallment: true } }
      }
    });

    if (!payment) {
      return { success: false, error: 'Pago no encontrado o no pertenece a la empresa' };
    }

    if (payment.status === 'VOIDED') {
      return { success: false, error: 'Este pago ya se encuentra anulado' };
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Revertir impacto en las cuotas asociadas
      for (const alloc of payment.allocations) {
        const inst = alloc.creditInstallment;
        const restoredPaid = Math.max(0, inst.paidAmount - alloc.amount);
        const restoredStatus = restoredPaid <= 0 ? 'PENDING' : 'PARTIAL';

        await tx.creditInstallment.update({
          where: { id: inst.id },
          data: {
            paidAmount: restoredPaid,
            status: restoredStatus
          }
        });
      }

      // 2. Marcar el pago como anulado (sin borrado físico)
      const voidedPayment = await tx.creditPayment.update({
        where: { id: payment.id },
        data: {
          status: 'VOIDED',
          voidedAt: now,
          voidedReason: reason.trim(),
          voidedByUserId: userId
        }
      });

      // 3. Restaurar saldo de la operación
      const op = payment.creditOperation;
      const restoredPaidAmount = Math.max(0, op.paidAmount - payment.amount);
      const restoredBalance = Math.min(op.totalAmount, op.balance + payment.amount);

      const updatedOp = await tx.creditOperation.update({
        where: { id: op.id },
        data: {
          paidAmount: restoredPaidAmount,
          balance: restoredBalance,
          status: 'ACTIVE',
          completedAt: null
        }
      });

      return { voidedPayment, updatedOp };
    });

    await logActivity({
      module: 'CARTERA',
      action: 'UPDATE',
      entity: 'CreditPayment',
      entityId: payment.id,
      description: `Anuló el comprobante de pago "${payment.receiptNumber}" de $${payment.amount.toLocaleString()} (Operación ${payment.creditOperation.code}). Motivo: ${reason}`,
      newValues: result.voidedPayment
    });

    revalidatePath('/dashboard/cartera');
    revalidatePath(`/dashboard/cartera/${payment.creditOperationId}`);

    return { success: true, data: result.voidedPayment };
  } catch (error: any) {
    console.error('[VOID_CREDIT_PAYMENT_ERROR]', error);
    return { success: false, error: error.message || 'Error al anular el pago' };
  }
}

// ─── 5. Cancelar Operación a Crédito ────────────────────────────────────────

export async function cancelCreditOperation(data: {
  creditOperationId: number;
  reason: string;
}) {
  try {
    const { companyId, userId, userRole } = await getCreditAuthContext();
    const { creditOperationId, reason } = data;

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'Debe especificar el motivo de cancelación' };
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return { success: false, error: 'Permisos insuficientes para cancelar operaciones' };
    }

    const operation = await prisma.creditOperation.findFirst({
      where: { id: creditOperationId, companyId },
      include: {
        items: true,
        payments: { where: { status: 'CONFIRMED' } }
      }
    });

    if (!operation) {
      return { success: false, error: 'Operación no encontrada' };
    }

    if (operation.status === 'CANCELLED') {
      return { success: false, error: 'Esta operación ya está cancelada' };
    }

    if (operation.deliveryStatus === 'DELIVERED') {
      return {
        success: false,
        error: 'No se puede cancelar una operación con mercancía ya entregada. Debe registrar una devolución formal.'
      };
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Si tenía inventario reservado (Modalidad B), liberarlo de inmediato
      if (operation.isStockReserved) {
        for (const item of operation.items) {
          if (item.productId && item.reservedQuantity > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reservedQuantity: { decrement: item.reservedQuantity }
              }
            });
            await tx.creditOperationItem.update({
              where: { id: item.id },
              data: { reservedQuantity: 0 }
            });
          }
        }
      }

      // 2. Actualizar estado de la operación a CANCELLED
      const updatedOp = await tx.creditOperation.update({
        where: { id: operation.id },
        data: {
          status: 'CANCELLED',
          deliveryStatus: 'CANCELLED',
          isStockReserved: false,
          cancelledAt: now,
          cancellationReason: reason.trim()
        }
      });

      return updatedOp;
    });

    await logActivity({
      module: 'CARTERA',
      action: 'UPDATE',
      entity: 'CreditOperation',
      entityId: operation.id,
      description: `Canceló la operación a crédito "${operation.code}". Motivo: ${reason}. ${operation.payments.length > 0 ? `Atención: cuenta con ${operation.payments.length} abonos por regularizar.` : ''}`,
      newValues: result
    });

    revalidatePath('/dashboard/cartera');
    revalidatePath(`/dashboard/cartera/${operation.id}`);
    revalidatePath('/dashboard/products');

    return { success: true, data: result };
  } catch (error: any) {
    console.error('[CANCEL_CREDIT_OPERATION_ERROR]', error);
    return { success: false, error: error.message || 'Error al cancelar la operación' };
  }
}

// ─── 6. Bitácora de Gestión de Cobranza ─────────────────────────────────────

export async function registerCreditCollectionActivity(data: {
  creditOperationId: number;
  channel: string;
  result: string;
  notes: string;
  commitmentDate?: string | null;
  commitmentAmount?: number | null;
}) {
  try {
    const { companyId, userId } = await getCreditAuthContext();
    const { creditOperationId, channel, result, notes, commitmentDate, commitmentAmount } = data;

    if (!notes || notes.trim().length < 3) {
      return { success: false, error: 'Debe incluir notas sobre la gestión realizada' };
    }

    const operation = await prisma.creditOperation.findFirst({
      where: { id: creditOperationId, companyId }
    });

    if (!operation) {
      return { success: false, error: 'Operación no encontrada' };
    }

    const activity = await prisma.creditCollectionActivity.create({
      data: {
        creditOperationId: operation.id,
        customerId: operation.customerId,
        userId,
        channel,
        result,
        notes: notes.trim(),
        commitmentDate: commitmentDate ? new Date(commitmentDate) : null,
        commitmentAmount: commitmentAmount ? Number(commitmentAmount) : null,
        companyId
      }
    });

    await logActivity({
      module: 'CARTERA',
      action: 'CREATE',
      entity: 'CreditCollectionActivity',
      entityId: activity.id,
      description: `Registró gestión de cobro para "${operation.code}" vía ${channel} (${result})`,
      newValues: activity
    });

    revalidatePath(`/dashboard/cartera/${operation.id}`);
    revalidatePath('/dashboard/cartera');

    return { success: true, data: activity };
  } catch (error: any) {
    console.error('[REGISTER_COLLECTION_ACTIVITY_ERROR]', error);
    return { success: false, error: error.message || 'Error al registrar la gestión' };
  }
}

// ─── 7. Consultas y Estadísticas ────────────────────────────────────────────

export async function getCreditDashboardStats() {
  try {
    const { companyId } = await getCreditAuthContext();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
      totalOperations,
      activeOperations,
      paidPendingDelivery,
      reservedOperations,
      todayPayments,
      allActiveBalance
    ] = await Promise.all([
      prisma.creditOperation.count({ where: { companyId } }),
      prisma.creditOperation.findMany({
        where: { companyId, status: { in: ['ACTIVE', 'OVERDUE'] }, balance: { gt: 0 } },
        select: { balance: true, dueDate: true, id: true }
      }),
      prisma.creditOperation.count({
        where: {
          companyId,
          deliveryMode: 'UPON_PAYMENT',
          balance: { lte: 0.01 },
          deliveryStatus: { not: 'DELIVERED' },
          status: { not: 'CANCELLED' }
        }
      }),
      prisma.creditOperation.count({
        where: { companyId, isStockReserved: true, status: 'ACTIVE' }
      }),
      prisma.creditPayment.aggregate({
        where: {
          companyId,
          status: 'CONFIRMED',
          paymentDate: { gte: startOfToday, lte: endOfToday }
        },
        _sum: { amount: true }
      }),
      prisma.creditOperation.aggregate({
        where: { companyId, balance: { gt: 0 }, status: { in: ['ACTIVE', 'OVERDUE'] } },
        _sum: { balance: true }
      })
    ]);

    const totalPortfolio = allActiveBalance._sum.balance || 0;

    let overduePortfolio = 0;
    let overdueCount = 0;
    for (const op of activeOperations) {
      if (op.dueDate && new Date(op.dueDate).getTime() < now.getTime()) {
        overduePortfolio += op.balance;
        overdueCount++;
      }
    }

    return {
      success: true,
      stats: {
        totalPortfolio,
        overduePortfolio,
        overdueCount,
        totalOperations,
        activeCount: activeOperations.length,
        paidPendingDelivery,
        reservedOperations,
        todayCollections: todayPayments._sum.amount || 0
      }
    };
  } catch (error: any) {
    console.error('[GET_CREDIT_DASHBOARD_STATS_ERROR]', error);
    return { success: false, error: error.message };
  }
}

export async function getCreditOperations(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  deliveryMode?: string;
  deliveryStatus?: string;
}) {
  try {
    const { companyId } = await getCreditAuthContext();
    const page = Math.max(1, Number(params.page || 1));
    const pageSize = Math.max(5, Math.min(100, Number(params.pageSize || 15)));
    const skip = (page - 1) * pageSize;

    const where: any = { companyId };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.deliveryMode && params.deliveryMode !== 'ALL') {
      where.deliveryMode = params.deliveryMode;
    }
    if (params.deliveryStatus && params.deliveryStatus !== 'ALL') {
      where.deliveryStatus = params.deliveryStatus;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { code: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { documentNumber: { contains: q } } },
        { customer: { phone: { contains: q } } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.creditOperation.count({ where }),
      prisma.creditOperation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              documentType: true,
              documentNumber: true,
              phone: true,
              email: true,
              preferredContactMethod: true
            }
          },
          user: { select: { id: true, name: true } },
          _count: {
            select: { payments: true, installments: true, deliveries: true }
          }
        }
      })
    ]);

    return {
      success: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error: any) {
    console.error('[GET_CREDIT_OPERATIONS_ERROR]', error);
    return { success: false, error: error.message };
  }
}

export async function getCreditOperationById(id: number) {
  try {
    const { companyId } = await getCreditAuthContext();

    const operation = await prisma.creditOperation.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        sale: { select: { id: true, saleNumber: true, createdAt: true, status: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true, quantityAvailable: true, reservedQuantity: true } }
          }
        },
        installments: {
          orderBy: { installmentNumber: 'asc' },
          include: {
            paymentAllocations: {
              include: { creditPayment: { select: { receiptNumber: true, paymentDate: true } } }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            registeredByUser: { select: { id: true, name: true } }
          }
        },
        deliveries: {
          orderBy: { deliveryDate: 'desc' },
          include: {
            deliveredByUser: { select: { id: true, name: true } },
            items: { include: { operationItem: true } }
          }
        },
        collectionActivities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (!operation) {
      return { success: false, error: 'Operación no encontrada' };
    }

    return { success: true, data: operation };
  } catch (error: any) {
    console.error('[GET_CREDIT_OPERATION_BY_ID_ERROR]', error);
    return { success: false, error: error.message };
  }
}
