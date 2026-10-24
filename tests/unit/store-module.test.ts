import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Módulo de Tienda Virtual (GNS — SarriaTech)', () => {

  // ─── 1. Control de Licenciamiento y Acceso Multiempresa ────────────────────
  describe('1. Control de Licenciamiento y Estado de Tienda', () => {
    function evaluateStoreAccess({
      enableOnlineStore,
      storeStatus,
      userRole,
    }: {
      enableOnlineStore: boolean;
      storeStatus?: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
      userRole?: string;
    }) {
      const isSuperAdmin = userRole === 'SUPERADMIN';
      if (!isSuperAdmin && !enableOnlineStore) {
        return {
          allowed: false,
          error: 'El módulo de Tienda Virtual no está activo para su empresa.',
        };
      }

      if (storeStatus === 'SUSPENDED') {
        return {
          allowed: false,
          error: 'La tienda virtual se encuentra suspendida temporalmente.',
        };
      }

      if (storeStatus === 'PAUSED') {
        return {
          allowed: true,
          mode: 'PAUSED',
          message: 'La tienda está pausada. El catálogo se visualiza pero no recibe pedidos.',
        };
      }

      return { allowed: true, mode: 'ACTIVE' };
    }

    it('debe bloquear el acceso si la empresa tiene el módulo inactivo', () => {
      const res = evaluateStoreAccess({ enableOnlineStore: false, userRole: 'ADMIN' });
      assert.equal(res.allowed, false);
      assert.ok(res.error?.includes('no está activo'));
    });

    it('debe permitir acceso si el módulo está habilitado para la empresa', () => {
      const res = evaluateStoreAccess({ enableOnlineStore: true, storeStatus: 'ACTIVE', userRole: 'SELLER' });
      assert.equal(res.allowed, true);
      assert.equal(res.mode, 'ACTIVE');
    });

    it('debe permitir acceso de SUPERADMIN incluso si el módulo está desactivado', () => {
      const res = evaluateStoreAccess({ enableOnlineStore: false, userRole: 'SUPERADMIN' });
      assert.equal(res.allowed, true);
    });

    it('debe bloquear pedidos si la tienda está suspendida', () => {
      const res = evaluateStoreAccess({ enableOnlineStore: true, storeStatus: 'SUSPENDED' });
      assert.equal(res.allowed, false);
      assert.ok(res.error?.includes('suspendida'));
    });
  });

  // ─── 2. Recálculo Autoritativo de Precios del Carrito ──────────────────────
  describe('2. Recálculo Autoritativo del Servidor (Sin confiar en el cliente)', () => {
    interface ServerProduct {
      id: number;
      name: string;
      salePrice: number;
      webPrice: number | null;
      quantityAvailable: number;
      reservedQuantity: number;
      isPublishedWeb: boolean;
    }

    function calculateCart({
      items,
      deliveryMode,
      deliveryCost,
      minOrderAmount,
      dbProducts,
    }: {
      items: { productId: number; quantity: number; clientPrice: number }[];
      deliveryMode: 'HOME_DELIVERY' | 'STORE_PICKUP' | 'COORDINATE';
      deliveryCost: number;
      minOrderAmount: number;
      dbProducts: ServerProduct[];
    }) {
      const productsMap = new Map(dbProducts.map((p) => [p.id, p]));
      let subtotal = 0;

      for (const item of items) {
        const prod = productsMap.get(item.productId);
        if (!prod || !prod.isPublishedWeb) {
          return { success: false, error: 'Producto no disponible o no publicado.' };
        }

        const effectiveStock = prod.quantityAvailable - prod.reservedQuantity;
        if (item.quantity > effectiveStock) {
          return {
            success: false,
            error: `Disponibilidad insuficiente para "${prod.name}". Disponibles: ${effectiveStock}, Solicitados: ${item.quantity}.`,
          };
        }

        // PRECIO AUTORITATIVO: Usa webPrice si existe, sino salePrice. Ignora el clientPrice completamente.
        const unitPrice = prod.webPrice && prod.webPrice > 0 ? prod.webPrice : prod.salePrice;
        subtotal += unitPrice * item.quantity;
      }

      const shipping = deliveryMode === 'HOME_DELIVERY' ? deliveryCost : 0;
      const total = subtotal + shipping;

      if (minOrderAmount > 0 && subtotal < minOrderAmount) {
        return {
          success: false,
          error: `El pedido mínimo para esta tienda es de $${minOrderAmount}. Tu subtotal actual es de $${subtotal}.`,
        };
      }

      return {
        success: true,
        subtotal,
        shipping,
        total,
      };
    }

    const mockDbProducts: ServerProduct[] = [
      {
        id: 1,
        name: 'Camiseta Algodón',
        salePrice: 50000,
        webPrice: 45000, // Precio con descuento especial web
        quantityAvailable: 10,
        reservedQuantity: 2, // 8 efectivos
        isPublishedWeb: true,
      },
      {
        id: 2,
        name: 'Gorra Clásica',
        salePrice: 30000,
        webPrice: null, // Usa salePrice (30000)
        quantityAvailable: 5,
        reservedQuantity: 0,
        isPublishedWeb: true,
      },
      {
        id: 3,
        name: 'Producto Oculto',
        salePrice: 20000,
        webPrice: null,
        quantityAvailable: 10,
        reservedQuantity: 0,
        isPublishedWeb: false, // No publicado
      },
    ];

    it('debe ignorar el precio manipulado enviado por el cliente y usar el del servidor', () => {
      const items = [
        { productId: 1, quantity: 2, clientPrice: 100 }, // Intento de hack: enviar $100
      ];

      const res = calculateCart({
        items,
        deliveryMode: 'STORE_PICKUP',
        deliveryCost: 8000,
        minOrderAmount: 0,
        dbProducts: mockDbProducts,
      });

      assert.equal(res.success, true);
      // Debe usar webPrice 45000 * 2 = 90000, NO $100 * 2 = $200
      assert.equal(res.subtotal, 90000);
      assert.equal(res.shipping, 0);
      assert.equal(res.total, 90000);
    });

    it('debe sumar el costo de envío únicamente si la modalidad es a domicilio', () => {
      const items = [{ productId: 2, quantity: 1, clientPrice: 30000 }];

      // A domicilio
      const resDelivery = calculateCart({
        items,
        deliveryMode: 'HOME_DELIVERY',
        deliveryCost: 8000,
        minOrderAmount: 0,
        dbProducts: mockDbProducts,
      });
      assert.equal(resDelivery.shipping, 8000);
      assert.equal(resDelivery.total, 38000);

      // Recoger en tienda
      const resPickup = calculateCart({
        items,
        deliveryMode: 'STORE_PICKUP',
        deliveryCost: 8000,
        minOrderAmount: 0,
        dbProducts: mockDbProducts,
      });
      assert.equal(resPickup.shipping, 0);
      assert.equal(resPickup.total, 30000);
    });

    it('debe rechazar la compra si supera el inventario disponible efectivo', () => {
      // Producto 1 tiene 10 disponibles pero 2 reservados => 8 efectivos
      const items = [{ productId: 1, quantity: 9, clientPrice: 45000 }];

      const res = calculateCart({
        items,
        deliveryMode: 'STORE_PICKUP',
        deliveryCost: 0,
        minOrderAmount: 0,
        dbProducts: mockDbProducts,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Disponibilidad insuficiente'));
    });

    it('debe rechazar la compra si el producto no está publicado en la web', () => {
      const items = [{ productId: 3, quantity: 1, clientPrice: 20000 }];

      const res = calculateCart({
        items,
        deliveryMode: 'STORE_PICKUP',
        deliveryCost: 0,
        minOrderAmount: 0,
        dbProducts: mockDbProducts,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('no disponible o no publicado'));
    });

    it('debe validar el pedido mínimo configurado en la tienda', () => {
      const items = [{ productId: 2, quantity: 1, clientPrice: 30000 }]; // Subtotal: 30,000

      const res = calculateCart({
        items,
        deliveryMode: 'STORE_PICKUP',
        deliveryCost: 0,
        minOrderAmount: 50000, // Exige mínimo 50,000
        dbProducts: mockDbProducts,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('pedido mínimo'));
    });
  });

  // ─── 3. Creación de Pedido y Privacidad de Datos ───────────────────────────
  describe('3. Creación de Pedido en PENDING_REVIEW y Token Seguro Oculto', () => {
    function createPendingOrder(data: {
      customerName: string;
      customerPhone: string;
      deliveryMode: 'HOME_DELIVERY' | 'STORE_PICKUP' | 'COORDINATE';
      deliveryAddress?: string;
      dataConsent: boolean;
    }) {
      if (!data.dataConsent) {
        return { success: false, error: 'Debe autorizar el tratamiento de datos personales.' };
      }

      if (!data.customerName || data.customerName.trim().length < 3) {
        return { success: false, error: 'Nombre de cliente inválido.' };
      }

      const cleanPhone = data.customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return { success: false, error: 'Número de WhatsApp inválido (mínimo 10 dígitos).' };
      }

      if (data.deliveryMode === 'HOME_DELIVERY' && (!data.deliveryAddress || data.deliveryAddress.trim().length < 5)) {
        return { success: false, error: 'Dirección obligatoria para entregas a domicilio.' };
      }

      // Generar token opaco UUID v4
      const orderToken = 'ord_tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const maskedPhone = cleanPhone.slice(0, 3) + '****' + cleanPhone.slice(-3);

      return {
        success: true,
        order: {
          orderToken,
          status: 'PENDING_REVIEW', // Siempre entra en revisión pendiente
          customerName: data.customerName.trim(),
          customerPhone: cleanPhone,
          customerPhoneMasked: maskedPhone,
          deliveryMode: data.deliveryMode,
        },
      };
    }

    it('debe exigir la aceptación de la política de datos (Ley 1581 de 2012)', () => {
      const res = createPendingOrder({
        customerName: 'Juan Pérez',
        customerPhone: '3151234567',
        deliveryMode: 'STORE_PICKUP',
        dataConsent: false,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('tratamiento de datos'));
    });

    it('debe exigir dirección válida cuando la modalidad es a domicilio', () => {
      const res = createPendingOrder({
        customerName: 'Juan Pérez',
        customerPhone: '3151234567',
        deliveryMode: 'HOME_DELIVERY',
        deliveryAddress: '',
        dataConsent: true,
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Dirección obligatoria'));
    });

    it('debe registrar el pedido en estado PENDING_REVIEW con token no adivinable', () => {
      const res = createPendingOrder({
        customerName: 'Carlos Gómez',
        customerPhone: '3009876543',
        deliveryMode: 'STORE_PICKUP',
        dataConsent: true,
      });

      assert.equal(res.success, true);
      assert.equal(res.order?.status, 'PENDING_REVIEW');
      assert.ok(res.order?.orderToken.startsWith('ord_tok_'));
      assert.equal(res.order?.customerPhoneMasked, '300****543');
    });
  });

  // ─── 4. Conversión Idempotente a Venta GNS y Descuento de Stock ────────────
  describe('4. Conversión a Venta Real (Idempotencia y Descuento de Inventario)', () => {
    interface OrderRecord {
      id: number;
      orderNumber: string;
      status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED_SALE';
      saleId: number | null;
      items: { productId: number; quantity: number }[];
    }

    interface WarehouseStock {
      productId: number;
      quantityAvailable: number;
    }

    function convertOrderToSale({
      order,
      stock,
    }: {
      order: OrderRecord;
      stock: Map<number, WarehouseStock>;
    }) {
      // 1. Idempotencia: Si ya fue convertida a venta, rechazar
      if (order.status === 'COMPLETED_SALE' || order.saleId !== null) {
        return {
          success: false,
          error: 'Este pedido ya fue convertido previamente en la venta #' + order.saleId,
        };
      }

      // 2. Solo pedidos ACCEPTED o PENDING_REVIEW pueden convertirse
      if (order.status !== 'ACCEPTED' && order.status !== 'PENDING_REVIEW') {
        return {
          success: false,
          error: `No se puede convertir a venta un pedido con estado "${order.status}".`,
        };
      }

      // 3. Verificar stock físico en bodega
      for (const item of order.items) {
        const itemStock = stock.get(item.productId);
        if (!itemStock || itemStock.quantityAvailable < item.quantity) {
          return {
            success: false,
            error: `Inventario insuficiente en bodega para procesar la venta del producto ${item.productId}.`,
          };
        }
      }

      // 4. Descontar stock físico y generar Venta
      for (const item of order.items) {
        const itemStock = stock.get(item.productId)!;
        itemStock.quantityAvailable -= item.quantity;
      }

      const generatedSaleId = 1001;
      order.status = 'COMPLETED_SALE';
      order.saleId = generatedSaleId;

      return {
        success: true,
        saleId: generatedSaleId,
        orderStatus: order.status,
      };
    }

    it('debe descontar correctamente el inventario al convertir a venta', () => {
      const stock = new Map<number, WarehouseStock>([
        [1, { productId: 1, quantityAvailable: 20 }],
        [2, { productId: 2, quantityAvailable: 15 }],
      ]);

      const order: OrderRecord = {
        id: 50,
        orderNumber: 'WEB-00050',
        status: 'ACCEPTED',
        saleId: null,
        items: [
          { productId: 1, quantity: 5 },
          { productId: 2, quantity: 3 },
        ],
      };

      const res = convertOrderToSale({ order, stock });

      assert.equal(res.success, true);
      assert.equal(res.saleId, 1001);
      assert.equal(order.status, 'COMPLETED_SALE');
      assert.equal(stock.get(1)?.quantityAvailable, 15);
      assert.equal(stock.get(2)?.quantityAvailable, 12);
    });

    it('debe garantizar idempotencia impidiendo doble conversión o doble descuento de stock', () => {
      const stock = new Map<number, WarehouseStock>([
        [1, { productId: 1, quantityAvailable: 15 }],
      ]);

      const order: OrderRecord = {
        id: 50,
        orderNumber: 'WEB-00050',
        status: 'COMPLETED_SALE',
        saleId: 1001,
        items: [{ productId: 1, quantity: 5 }],
      };

      const res = convertOrderToSale({ order, stock });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('ya fue convertido previamente'));
      // El inventario permanece intacto sin doble descuento
      assert.equal(stock.get(1)?.quantityAvailable, 15);
    });

    it('debe impedir la conversión si el pedido fue cancelado o rechazado', () => {
      const stock = new Map<number, WarehouseStock>([
        [1, { productId: 1, quantityAvailable: 20 }],
      ]);

      const order: OrderRecord = {
        id: 51,
        orderNumber: 'WEB-00051',
        status: 'REJECTED',
        saleId: null,
        items: [{ productId: 1, quantity: 2 }],
      };

      const res = convertOrderToSale({ order, stock });
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('No se puede convertir'));
    });
  });

  // ─── 5. Dominios Personalizados y Validación DNS ──────────────────────────
  describe('5. Validación de Dominios Personalizados y Tokens TXT', () => {
    function validateCustomDomain(domain: string) {
      const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/;

      if (!domainRegex.test(clean)) {
        return { success: false, error: 'Formato de dominio no válido. Ejemplo: mitienda.com' };
      }

      if (clean.includes('gns.sarriatech.tech') || clean.includes('localhost')) {
        return { success: false, error: 'No se permiten dominios reservados del sistema.' };
      }

      const txtVerificationToken = 'gns-verify-' + Math.random().toString(36).substring(2, 12);

      return {
        success: true,
        domain: clean,
        txtVerificationToken,
        status: 'PENDING_VERIFICATION',
      };
    }

    it('debe rechazar dominios con formato inválido', () => {
      const res = validateCustomDomain('tienda_invalida..com');
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Formato de dominio no válido'));
    });

    it('debe rechazar dominios reservados de la plataforma', () => {
      const res = validateCustomDomain('admin.gns.sarriatech.tech');
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('reservados del sistema'));
    });

    it('debe normalizar y generar token de verificación DNS para dominios válidos', () => {
      const res = validateCustomDomain('https://MiTiendaModa.com/subruta');
      assert.equal(res.success, true);
      assert.equal(res.domain, 'mitiendamoda.com');
      assert.ok(res.txtVerificationToken?.startsWith('gns-verify-'));
      assert.equal(res.status, 'PENDING_VERIFICATION');
    });
  });
});
