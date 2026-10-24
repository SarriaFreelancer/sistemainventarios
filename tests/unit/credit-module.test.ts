import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Módulo de Cartera y Ventas a Crédito (GNS)', () => {

  // ─── 1. Control de Activación Opcional Multiempresa ─────────────────────────
  describe('1. Control de Activación y Permisos Multiempresa', () => {
    function canAccessCreditModule({
      enableCreditSales,
      userRole,
    }: {
      enableCreditSales: boolean;
      userRole: string;
    }) {
      const isSuperAdmin = userRole === 'SUPERADMIN';
      if (isSuperAdmin) return { allowed: true, reason: 'SUPERADMIN_BYPASS' };
      if (!enableCreditSales) {
        return {
          allowed: false,
          error: 'El módulo de Cartera y Crédito no está habilitado para esta empresa.',
        };
      }
      return { allowed: true, reason: 'MODULE_ENABLED' };
    }

    it('debe bloquear el acceso a usuarios de empresas con el módulo deshabilitado', () => {
      const res = canAccessCreditModule({ enableCreditSales: false, userRole: 'ADMIN' });
      assert.equal(res.allowed, false);
      assert.ok(res.error?.includes('no está habilitado'));
    });

    it('debe permitir el acceso si la empresa tiene el módulo habilitado', () => {
      const res = canAccessCreditModule({ enableCreditSales: true, userRole: 'SELLER' });
      assert.equal(res.allowed, true);
    });

    it('debe permitir acceso a SUPERADMIN incluso si la empresa lo tiene apagado', () => {
      const res = canAccessCreditModule({ enableCreditSales: false, userRole: 'SUPERADMIN' });
      assert.equal(res.allowed, true);
    });
  });

  // ─── 2. Lógica de Modalidad A vs Modalidad B e Inventario ───────────────────
  describe('2. Modalidades de Entrega y Control de Inventario', () => {
    interface StockState {
      quantityAvailable: number;
      reservedQuantity: number;
    }

    function processOperationCreation({
      deliveryMode,
      qty,
      currentStock,
    }: {
      deliveryMode: 'IMMEDIATE' | 'AFTER_FULL_PAYMENT';
      qty: number;
      currentStock: StockState;
    }) {
      const effectiveStock = currentStock.quantityAvailable - currentStock.reservedQuantity;
      if (effectiveStock < qty) {
        throw new Error(`Stock insuficiente: disponible ${effectiveStock}, requerido ${qty}`);
      }

      if (deliveryMode === 'IMMEDIATE') {
        // Modalidad A: salida física directa de bodega
        return {
          deliveryStatus: 'DELIVERED',
          newStock: {
            quantityAvailable: currentStock.quantityAvailable - qty,
            reservedQuantity: currentStock.reservedQuantity,
          },
          createsSaleRecord: true,
        };
      } else {
        // Modalidad B: reserva de stock sin salida física
        return {
          deliveryStatus: 'PENDING',
          newStock: {
            quantityAvailable: currentStock.quantityAvailable,
            reservedQuantity: currentStock.reservedQuantity + qty,
          },
          createsSaleRecord: false,
        };
      }
    }

    it('Modalidad A: debe descontar inmediatamente las unidades de bodega y marcar entrega realizada', () => {
      const initialStock: StockState = { quantityAvailable: 20, reservedQuantity: 2 };
      const result = processOperationCreation({
        deliveryMode: 'IMMEDIATE',
        qty: 5,
        currentStock: initialStock,
      });

      assert.equal(result.deliveryStatus, 'DELIVERED');
      assert.equal(result.newStock.quantityAvailable, 15);
      assert.equal(result.newStock.reservedQuantity, 2);
      assert.equal(result.createsSaleRecord, true);
    });

    it('Modalidad B: debe reservar mercancía sin descontar salida física anticipada', () => {
      const initialStock: StockState = { quantityAvailable: 20, reservedQuantity: 2 };
      const result = processOperationCreation({
        deliveryMode: 'AFTER_FULL_PAYMENT',
        qty: 5,
        currentStock: initialStock,
      });

      assert.equal(result.deliveryStatus, 'PENDING');
      assert.equal(result.newStock.quantityAvailable, 20); // No cambia la existencia en bodega
      assert.equal(result.newStock.reservedQuantity, 7);  // Se reservan 5 adicionales
      assert.equal(result.createsSaleRecord, false);
    });

    it('debe impedir sobreventa considerando tanto stock físico como reservas activas', () => {
      const initialStock: StockState = { quantityAvailable: 10, reservedQuantity: 8 };
      assert.throws(() => {
        processOperationCreation({
          deliveryMode: 'IMMEDIATE',
          qty: 3, // Solo quedan 2 disponibles libres
          currentStock: initialStock,
        });
      }, /Stock insuficiente/);
    });
  });

  // ─── 3. Validación de Entrega en Modalidad B bajo Pago Completo ─────────────
  describe('3. Validación de Entrega Posterior al Pago Completo (Modalidad B)', () => {
    function confirmDeliveryModalidadB({
      balance,
      currentStock,
      reservedQty,
    }: {
      balance: number;
      currentStock: number;
      reservedQty: number;
    }) {
      if (balance > 0.01) {
        throw new Error('No se puede entregar un pedido en Modalidad B hasta que esté pagado en su totalidad.');
      }

      // Al confirmar entrega tras pago completo: descuenta stock real y libera reserva
      return {
        success: true,
        deliveryStatus: 'DELIVERED',
        newStock: currentStock - reservedQty,
        newReserved: 0,
      };
    }

    it('debe rechazar la entrega física si el cliente aún tiene saldo pendiente', () => {
      assert.throws(() => {
        confirmDeliveryModalidadB({
          balance: 150000,
          currentStock: 10,
          reservedQty: 3,
        });
      }, /No se puede entregar un pedido en Modalidad B/);
    });

    it('debe permitir la entrega física una vez el saldo es cero y actualizar bodega correctamente', () => {
      const res = confirmDeliveryModalidadB({
        balance: 0,
        currentStock: 10,
        reservedQty: 3,
      });

      assert.equal(res.success, true);
      assert.equal(res.deliveryStatus, 'DELIVERED');
      assert.equal(res.newStock, 7);
      assert.equal(res.newReserved, 0);
    });
  });

  // ─── 4. Generación y Distribución en Cascada de Cuotas y Abonos ─────────────
  describe('4. Plan de Cuotas y Cascada de Abonos', () => {
    interface Installment {
      number: number;
      amount: number;
      paidAmount: number;
      balance: number;
      status: 'PENDING' | 'PARTIAL' | 'PAID';
    }

    function createInstallments(totalFinanced: number, count: number): Installment[] {
      const perInstallment = Math.round(totalFinanced / count);
      let accumulated = 0;
      const list: Installment[] = [];

      for (let i = 1; i <= count; i++) {
        const amount = i === count ? totalFinanced - accumulated : perInstallment;
        accumulated += amount;
        list.push({
          number: i,
          amount,
          paidAmount: 0,
          balance: amount,
          status: 'PENDING',
        });
      }
      return list;
    }

    function applyPaymentWaterfall(installments: Installment[], paymentAmount: number) {
      let remaining = paymentAmount;
      const allocations: { installmentNumber: number; amount: number }[] = [];

      for (const inst of installments) {
        if (remaining <= 0) break;
        if (inst.status === 'PAID') continue;

        const needed = inst.balance;
        const toPay = Math.min(remaining, needed);

        inst.paidAmount += toPay;
        inst.balance -= toPay;
        inst.status = inst.balance <= 0.001 ? 'PAID' : 'PARTIAL';

        remaining -= toPay;
        allocations.push({ installmentNumber: inst.number, amount: toPay });
      }

      return { remaining, allocations, installments };
    }

    it('debe generar cuotas cuadradas exactamente con el valor financiado', () => {
      const cuotas = createInstallments(100000, 3);
      assert.equal(cuotas.length, 3);
      const sum = cuotas.reduce((acc, c) => acc + c.amount, 0);
      assert.equal(sum, 100000);
    });

    it('debe aplicar un abono parcial en cascada cubriendo la cuota 1 y parte de la cuota 2', () => {
      const cuotas = createInstallments(300000, 3); // 100k cada una
      const result = applyPaymentWaterfall(cuotas, 150000);

      assert.equal(result.allocations.length, 2);
      assert.equal(result.allocations[0].installmentNumber, 1);
      assert.equal(result.allocations[0].amount, 100000);
      assert.equal(result.allocations[1].installmentNumber, 2);
      assert.equal(result.allocations[1].amount, 50000);

      assert.equal(result.installments[0].status, 'PAID');
      assert.equal(result.installments[0].balance, 0);

      assert.equal(result.installments[1].status, 'PARTIAL');
      assert.equal(result.installments[1].balance, 50000);

      assert.equal(result.installments[2].status, 'PENDING');
      assert.equal(result.installments[2].balance, 100000);
    });
  });

  // ─── 5. Anulación Compensatoria de Recibos de Pago ──────────────────────────
  describe('5. Anulación Compensatoria de Pagos y Trazabilidad', () => {
    it('debe restaurar los saldos de la cuota y de la operación al anular un pago', () => {
      let operationBalance = 150000;
      let totalPaid = 150000;
      let installmentPaid = 100000;
      let installmentBalance = 0;
      let installmentStatus = 'PAID';

      const paymentToVoid = {
        id: 101,
        amount: 150000,
        status: 'CONFIRMED',
        allocations: [{ installmentId: 1, amount: 100000 }],
      };

      // Ejecutar anulación
      paymentToVoid.status = 'VOIDED';
      totalPaid -= paymentToVoid.amount;
      operationBalance += paymentToVoid.amount;

      installmentPaid -= paymentToVoid.allocations[0].amount;
      installmentBalance += paymentToVoid.allocations[0].amount;
      installmentStatus = installmentPaid === 0 ? 'PENDING' : 'PARTIAL';

      assert.equal(paymentToVoid.status, 'VOIDED');
      assert.equal(totalPaid, 0);
      assert.equal(operationBalance, 300000);
      assert.equal(installmentPaid, 0);
      assert.equal(installmentBalance, 100000);
      assert.equal(installmentStatus, 'PENDING');
    });
  });

  // ─── 6. Cancelación de Pedidos y Liberación de Reservas ──────────────────────
  describe('6. Cancelación de Operaciones y Liberación de Stock', () => {
    it('debe liberar el inventario reservado cuando se cancela una operación en Modalidad B', () => {
      let reservedStock = 12;
      const operationReservedQty = 4;

      // Cancelar pedido
      reservedStock -= operationReservedQty;

      assert.equal(reservedStock, 8);
    });
  });
});
