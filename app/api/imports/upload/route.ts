import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { companyId: sessionCompanyId, role } = session.user as { companyId?: string; role?: string };
    
    // For imports, superadmins must be impersonating or we enforce they select a company. 
    // Usually companyId is present.
    const companyId = sessionCompanyId; 
    
    if (!companyId) {
      return NextResponse.json({ error: "No hay empresa asociada a la sesión" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "Archivo o tipo faltante" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) {
      return NextResponse.json({ error: "El archivo no contiene hojas" }, { status: 400 });
    }

    const rows: any[] = [];
    let headers: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = row.values as any[];
      if (rowNumber === 1) {
        headers = values; // values is 1-indexed in exceljs
      } else {
        const rowData: any = {};
        for (let i = 1; i < headers.length; i++) {
          if (headers[i]) {
            rowData[headers[i]] = values[i];
          }
        }
        rows.push(rowData);
      }
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    const updateExistingStock = formData.get("updateExistingStock") === "true";
    let count = 0;
    let updatedCount = 0;
    const skipped: string[] = [];

    const settings = await prisma.companySetting.findUnique({
      where: { companyId: Number(companyId) }
    });
    const enableNotifications = settings?.enableNotifications !== false;
    const registerAsExpense = settings?.registerInventoryCostAsExpense === true;

    await prisma.$transaction(async (tx) => {
      if (type === "groups") {
        for (const row of rows) {
          const code = String(row["Código de Grupo"]).trim();
          const name = String(row["Nombre"]).trim();
          const status = row["Estado (ACTIVE o INACTIVE)"] === "INACTIVE" ? "INACTIVE" : "ACTIVE";
          
          if (!code || !name || code === "undefined" || name === "undefined") continue;

          // Check if exists
          const exists = await tx.productGroup.findFirst({
            where: { code, companyId: Number(companyId) }
          });

          if (!exists) {
            await tx.productGroup.create({
              data: {
                code,
                name,
                status,
                companyId: Number(companyId)
              }
            });
            count++;
          } else {
            skipped.push(`Grupo ${code}: Ya existe.`);
          }
        }
      } 
      else if (type === "categories") {
        for (const row of rows) {
          const groupCode = String(row["Código de Grupo"]).trim();
          const code = String(row["Código de Categoría"]).trim();
          const name = String(row["Nombre"]).trim();
          const description = row["Descripción"] ? String(row["Descripción"]).trim() : null;

          if (!code || !name || !groupCode || code === "undefined" || name === "undefined") continue;

          const group = await tx.productGroup.findFirst({
            where: { code: groupCode, companyId: Number(companyId) }
          });

          if (!group) {
            throw new Error(`Grupo con código ${groupCode} no encontrado para la categoría ${code}`);
          }

          const exists = await tx.category.findFirst({
            where: { code, companyId: Number(companyId) }
          });

          if (!exists) {
            await tx.category.create({
              data: {
                code,
                name,
                description,
                productGroupId: group.id,
                companyId: Number(companyId)
              }
            });
            count++;
          } else {
            skipped.push(`Categoría ${code}: Ya existe.`);
          }
        }
      }
      else if (type === "suppliers") {
        for (const row of rows) {
          const code = String(row["Código de Proveedor"]).trim();
          const companyName = String(row["Empresa"]).trim();
          const contactName = String(row["Contacto"]).trim();
          const email = String(row["Email"]).trim();
          const phone = String(row["Teléfono"]).trim();
          const city = String(row["Ciudad"] || "").trim();
          const country = String(row["País"] || "Colombia").trim();
          const address = String(row["Dirección"] || "").trim();

          if (!code || !companyName || code === "undefined" || companyName === "undefined") continue;

          const exists = await tx.supplier.findFirst({
            where: { code, companyId: Number(companyId) }
          });

          if (!exists) {
            await tx.supplier.create({
              data: {
                code,
                companyName,
                contactName: contactName === "undefined" ? "" : contactName,
                email: email === "undefined" ? "" : email,
                phone: phone === "undefined" ? "" : phone,
                city: city === "undefined" ? "" : city,
                country: country === "undefined" ? "Colombia" : country,
                address: address === "undefined" ? "" : address,
                companyId: Number(companyId)
              }
            });
            count++;
          } else {
            skipped.push(`Proveedor ${code}: Ya existe.`);
          }
        }
      }
      else if (type === "products") {
        for (const row of rows) {
          const groupCode = String(row["Código de Grupo"]).trim();
          const catCode = String(row["Código de Categoría"]).trim();
          const supCode = String(row["Código de Proveedor"]).trim();
          const code = String(row["Código de Producto"]).trim();
          const name = String(row["Nombre"]).trim();
          const pType = String(row["Tipo (SALE, RAW_MATERIAL, FINISHED_GOOD, SUPPLY, SERVICE, FIXED_ASSET)"]).trim();
          const cost = Number(row["Costo Unitario"]) || 0;
          const price = Number(row["Precio Venta"]) || 0;
          const initialQty = Number(row["Cantidad Inicial"]) || 0;

          if (!code || !name || !catCode || !supCode || code === "undefined" || name === "undefined") continue;

          const group = await tx.productGroup.findFirst({ where: { code: groupCode, companyId: Number(companyId) } });
          const category = await tx.category.findFirst({ where: { code: catCode, companyId: Number(companyId) } });
          const supplier = await tx.supplier.findFirst({ where: { code: supCode, companyId: Number(companyId) } });

          if (!category) throw new Error(`Categoría con código ${catCode} no encontrada para producto ${code}`);
          if (!supplier) throw new Error(`Proveedor con código ${supCode} no encontrado para producto ${code}`);
          // Group is optional for product? No, it's optional in schema `productGroupId Int?` but we usually require it.
          // Let's make it optional if not found, but if provided it should exist.
          let groupId = null;
          if (groupCode && groupCode !== "undefined") {
            if (!group) throw new Error(`Grupo con código ${groupCode} no encontrado para producto ${code}`);
            groupId = group.id;
          }

          const exists = await tx.product.findFirst({
            where: { code, companyId: Number(companyId) }
          });

          if (!exists) {
            const newProduct = await tx.product.create({
              data: {
                code,
                name,
                type: (pType && pType !== "undefined" ? pType : "SALE") as any,
                unitCost: cost,
                salePrice: price,
                quantityAvailable: initialQty,
                categoryId: category.id,
                supplierId: supplier.id,
                productGroupId: groupId,
                companyId: Number(companyId),
                status: initialQty > 0 ? "AVAILABLE" : "OUT_OF_STOCK"
              }
            });
            count++;

            if (session.user.id) {
              await tx.auditLog.create({
                data: {
                  module: 'PRODUCTS',
                  action: 'CREATE',
                  entity: 'Product',
                  entityId: newProduct.id,
                  description: `Creó el producto "${newProduct.name}" (Código: ${newProduct.code}) masivamente`,
                  userId: Number(session.user.id),
                  companyId: Number(companyId),
                }
              });
            }

            if (registerAsExpense && initialQty > 0 && cost > 0) {
              const expenseAmount = initialQty * cost;
              const expense = await tx.expense.create({
                data: {
                  description: `Compra inicial de inventario (Importación): ${name} (${initialQty} unidades)`,
                  amount: expenseAmount,
                  category: 'INVENTORY_COST',
                  date: new Date(),
                  companyId: Number(companyId),
                }
              });
              if (session.user.id) {
                await tx.auditLog.create({
                  data: {
                    action: "CREATE",
                    module: "FINANZAS",
                    entity: "Expense",
                    entityId: expense.id,
                    description: `Gasto de inventario registrado automáticamente: ${expense.description} por valor de $${expense.amount}`,
                    userId: Number(session.user.id),
                    companyId: Number(companyId),
                  }
                });
              }
            }

            if (enableNotifications && session.user.id) {
              await tx.notification.create({
                data: {
                  userId: Number(session.user.id),
                  companyId: Number(companyId),
                  title: '📦 Nuevo Producto Importado',
                  message: `Se importó el producto "${name}" con ${initialQty} unidades iniciales.`,
                  type: 'SUCCESS'
                }
              });
            }
          } else {
            if (updateExistingStock && initialQty > 0) {
              const updatedProduct = await tx.product.update({
                where: { id: exists.id },
                data: {
                  quantityAvailable: exists.quantityAvailable + initialQty,
                  status: "AVAILABLE"
                }
              });
              updatedCount++;

              if (session.user.id) {
                await tx.auditLog.create({
                  data: {
                    module: 'PRODUCTS',
                    action: 'UPDATE',
                    entity: 'Product',
                    entityId: exists.id,
                    description: `Actualizó el producto "${updatedProduct.name}" masivamente (Stock: +${initialQty})`,
                    userId: Number(session.user.id),
                    companyId: Number(companyId),
                  }
                });
              }

              if (registerAsExpense && cost > 0) {
                const expenseAmount = initialQty * cost;
                const expense = await tx.expense.create({
                  data: {
                    description: `Actualización de inventario (Importación): ${name} (+${initialQty} unidades)`,
                    amount: expenseAmount,
                    category: 'INVENTORY_COST',
                    date: new Date(),
                    companyId: Number(companyId),
                  }
                });
                if (session.user.id) {
                  await tx.auditLog.create({
                    data: {
                      action: "CREATE",
                      module: "FINANZAS",
                      entity: "Expense",
                      entityId: expense.id,
                      description: `Gasto de inventario registrado automáticamente: ${expense.description} por valor de $${expense.amount}`,
                      userId: Number(session.user.id),
                      companyId: Number(companyId),
                    }
                  });
                }
              }

              if (enableNotifications && session.user.id) {
                await tx.notification.create({
                  data: {
                    userId: Number(session.user.id),
                    companyId: Number(companyId),
                    title: '📦 Stock Actualizado por Importación',
                    message: `Se sumaron ${initialQty} unidades al producto "${name}".`,
                    type: 'INFO'
                  }
                });
              }
            } else {
              skipped.push(`Producto ${code}: Ya existe.`);
            }
          }
        }
      } else {
        throw new Error("Tipo de importación no soportado");
      }
    }, {
      maxWait: 5000, // 5s max wait to connect
      timeout: 30000 // 30s timeout for execution (useful for bulk uploads)
    });

    return NextResponse.json({ success: true, count, updatedCount, skipped }, { status: 200 });
  } catch (error: any) {
    console.error("[IMPORTS_UPLOAD]", error);
    return NextResponse.json({ error: error.message || "Error al procesar el archivo" }, { status: 500 });
  }
}
