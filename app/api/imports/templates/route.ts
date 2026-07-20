import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

const HEADERS: Record<string, string[]> = {
  groups: ["Nombre", "Descripción"],
  categories: ["Código de Grupo", "Nombre", "Descripción"],
  suppliers: ["Empresa", "Contacto", "Email", "Teléfono", "Sitio Web", "País", "Ciudad", "Dirección", "Términos de Pago"],
  products: ["Código de Grupo", "Código de Categoría", "NIT de Proveedor", "Código de Producto", "Nombre", "Descripción", "Tipo (SALE, RAW_MATERIAL, FINISHED_GOOD, SUPPLY, SERVICE, FIXED_ASSET)", "Costo Unitario", "Precio Venta", "Cantidad Inicial"],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !HEADERS[type]) {
      return new Response(JSON.stringify({ error: "Tipo de plantilla inválido" }), { status: 400 });
    }

    const headers = HEADERS[type];
    
    // Create worksheet with headers
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns slightly
    worksheet["!cols"] = headers.map(() => ({ wch: 25 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="plantilla_${type}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[TEMPLATE_DOWNLOAD]", error);
    return new Response(JSON.stringify({ error: "Error al generar la plantilla" }), { status: 500 });
  }
}
