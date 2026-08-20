"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { revalidatePath } from "next/cache";

// Helper para verificar permisos
async function getCompanyAndUser() {
  const session = await getAuthSession();
  if (!session?.user) throw new Error("No autenticado");
  return {
    userId: Number(session.user.id),
    companyId: Number(session.user.companyId || 1),
    role: session.user.role
  };
}

// 1. Obtener Bodegas de la Empresa (o crear la Principal por defecto)
export async function getWarehouses() {
  try {
    const { companyId } = await getCompanyAndUser();

    let warehouses = await prisma.warehouse.findMany({
      where: { companyId },
      include: {
        locations: true,
        _count: { select: { stocks: true } }
      },
      orderBy: { isDefault: "desc" }
    });

    // Si la empresa no tiene ninguna bodega, creamos la Bodega Principal por defecto
    if (warehouses.length === 0) {
      const defaultWarehouse = await prisma.warehouse.create({
        data: {
          code: "BOD-MAIN",
          name: "Bodega Principal",
          type: "GENERAL",
          address: "Sede Principal",
          city: "Principal",
          isDefault: true,
          status: "ACTIVE",
          companyId
        },
        include: {
          locations: true,
          _count: { select: { stocks: true } }
        }
      });
      warehouses = [defaultWarehouse];
    }

    return { success: true, warehouses };
  } catch (error: any) {
    console.error("[GET_WAREHOUSES]", error);
    return { success: false, error: error.message || "Error al obtener bodegas" };
  }
}

// 2. Crear Nueva Bodega
export async function createWarehouse(data: {
  name: string;
  code?: string;
  type?: string;
  address?: string;
  city?: string;
  responsible?: string;
}) {
  try {
    const { companyId } = await getCompanyAndUser();

    if (!data.name) {
      return { success: false, error: "El nombre de la bodega es obligatorio" };
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code || `BOD-${Date.now().toString().slice(-4)}`,
        type: data.type || "GENERAL",
        address: data.address || null,
        city: data.city || null,
        responsible: data.responsible || null,
        companyId
      }
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, warehouse };
  } catch (error: any) {
    console.error("[CREATE_WAREHOUSE]", error);
    return { success: false, error: error.message || "Error al crear la bodega" };
  }
}

// 3. Crear Ubicación Física (Zona, Pasillo, Estante, Nivel)
export async function createWarehouseLocation(data: {
  warehouseId: number;
  code: string;
  zone?: string;
  aisle?: string;
  shelf?: string;
  level?: string;
}) {
  try {
    if (!data.warehouseId || !data.code) {
      return { success: false, error: "Bodega y Código de ubicación son obligatorios" };
    }

    const location = await prisma.warehouseLocation.create({
      data: {
        warehouseId: Number(data.warehouseId),
        code: data.code.toUpperCase(),
        zone: data.zone || null,
        aisle: data.aisle || null,
        shelf: data.shelf || null,
        level: data.level || null
      }
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, location };
  } catch (error: any) {
    console.error("[CREATE_LOCATION]", error);
    return { success: false, error: error.message || "Error al crear la ubicación" };
  }
}

// 4. Registrar Traslado Inter-bodega Independiente (Sin necesidad de Venta)
export async function createWarehouseTransfer(data: {
  originWarehouseId: number;
  destinationWarehouseId: number;
  notes?: string;
  items: Array<{ productId: number; quantity: number }>;
}) {
  try {
    const { companyId, userId } = await getCompanyAndUser();

    if (data.originWarehouseId === data.destinationWarehouseId) {
      return { success: false, error: "La bodega de origen y destino deben ser diferentes" };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Debes incluir al menos un producto a trasladar" };
    }

    const transferNumber = `TRS-${Date.now().toString().slice(-6)}`;

    // Crear registro de traslado en estado EN TRÁNSITO
    const transfer = await prisma.warehouseTransfer.create({
      data: {
        transferNumber,
        originWarehouseId: Number(data.originWarehouseId),
        destinationWarehouseId: Number(data.destinationWarehouseId),
        notes: data.notes || "Traslado interno entre bodegas",
        status: "IN_TRANSIT",
        companyId,
        createdById: userId,
        items: {
          create: data.items.map(i => ({
            productId: Number(i.productId),
            quantity: Number(i.quantity)
          }))
        }
      },
      include: {
        items: true,
        originWarehouse: true,
        destinationWarehouse: true
      }
    });

    // Descontar stock físico en Origen y sumar a En Tránsito en Destino
    for (const item of data.items) {
      // Origen
      await prisma.warehouseStock.upsert({
        where: {
          productId_warehouseId_locationId: {
            productId: Number(item.productId),
            warehouseId: Number(data.originWarehouseId),
            locationId: 0
          }
        },
        create: {
          productId: Number(item.productId),
          warehouseId: Number(data.originWarehouseId),
          physical: 0,
          companyId
        },
        update: {
          physical: { decrement: Number(item.quantity) }
        }
      }).catch(async () => {
        // Fallback si no hay locationId compuesto
        const st = await prisma.warehouseStock.findFirst({
          where: { productId: Number(item.productId), warehouseId: Number(data.originWarehouseId) }
        });
        if (st) {
          await prisma.warehouseStock.update({
            where: { id: st.id },
            data: { physical: { decrement: Number(item.quantity) } }
          });
        }
      });

      // Destino: Marcar en tránsito
      const destStock = await prisma.warehouseStock.findFirst({
        where: { productId: Number(item.productId), warehouseId: Number(data.destinationWarehouseId) }
      });

      if (destStock) {
        await prisma.warehouseStock.update({
          where: { id: destStock.id },
          data: { inTransit: { increment: Number(item.quantity) } }
        });
      } else {
        await prisma.warehouseStock.create({
          data: {
            productId: Number(item.productId),
            warehouseId: Number(data.destinationWarehouseId),
            physical: 0,
            inTransit: Number(item.quantity),
            companyId
          }
        });
      }
    }

    // Registrar Evento en Timeline de Auditoría WMS
    await prisma.warehouseTimeline.create({
      data: {
        transferId: transfer.id,
        title: `Traslado ${transferNumber} Iniciado (En Tránsito)`,
        description: `Traslado de ${data.items.length} producto(s) desde '${transfer.originWarehouse.name}' hacia '${transfer.destinationWarehouse.name}'`,
        status: "INFO",
        userId
      }
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, transfer };
  } catch (error: any) {
    console.error("[CREATE_TRANSFER]", error);
    return { success: false, error: error.message || "Error al crear el traslado" };
  }
}

// 5. Confirmar Recepción de Traslado en Bodega Destino
export async function confirmWarehouseTransferReceipt(transferId: number) {
  try {
    const { userId } = await getCompanyAndUser();

    const transfer = await prisma.warehouseTransfer.findUnique({
      where: { id: Number(transferId) },
      include: { items: true, originWarehouse: true, destinationWarehouse: true }
    });

    if (!transfer || transfer.status === "RECEIVED") {
      return { success: false, error: "El traslado no existe o ya fue recepcionado" };
    }

    // Mover de 'inTransit' a 'physical' en la bodega destino
    for (const item of transfer.items) {
      const destStock = await prisma.warehouseStock.findFirst({
        where: { productId: item.productId, warehouseId: transfer.destinationWarehouseId }
      });

      if (destStock) {
        await prisma.warehouseStock.update({
          where: { id: destStock.id },
          data: {
            inTransit: { decrement: item.quantity },
            physical: { increment: item.quantity }
          }
        });
      }
    }

    // Actualizar estado del Traslado
    await prisma.warehouseTransfer.update({
      where: { id: transfer.id },
      data: { status: "RECEIVED" }
    });

    // Registrar Evento en Timeline
    await prisma.warehouseTimeline.create({
      data: {
        transferId: transfer.id,
        title: `Traslado ${transfer.transferNumber} Recepcionado con Éxito`,
        description: `Mercancía ingresada a la bodega de destino '${transfer.destinationWarehouse.name}'`,
        status: "SUCCESS",
        userId
      }
    });

    revalidatePath("/dashboard/warehouses");
    return { success: true, message: "Traslado recepcionado con éxito" };
  } catch (error: any) {
    console.error("[CONFIRM_TRANSFER_RECEIPT]", error);
    return { success: false, error: error.message || "Error al confirmar la recepción del traslado" };
  }
}

// 6. Obtener Movimientos, Traslados y Timeline WMS
export async function getWarehouseOverviewData() {
  try {
    const { companyId } = await getCompanyAndUser();

    const [transfers, stocks, timelines] = await Promise.all([
      prisma.warehouseTransfer.findMany({
        where: { companyId },
        include: {
          originWarehouse: true,
          destinationWarehouse: true,
          items: { include: { product: true } },
          createdBy: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      }),
      prisma.warehouseStock.findMany({
        where: { companyId },
        include: {
          product: { select: { id: true, code: true, name: true, salePrice: true } },
          warehouse: { select: { id: true, name: true } },
          location: { select: { id: true, code: true } }
        },
        take: 50
      }),
      prisma.warehouseTimeline.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { user: { select: { name: true } } }
      })
    ]);

    return { success: true, transfers, stocks, timelines };
  } catch (error: any) {
    console.error("[GET_WAREHOUSE_OVERVIEW]", error);
    return { success: false, error: error.message || "Error al cargar la información del módulo WMS" };
  }
}
