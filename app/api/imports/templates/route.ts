import { NextRequest } from "next/server";
import ExcelJS from "exceljs";

const HEADERS: Record<string, string[]> = {
  groups: ["Código de Grupo", "Nombre", "Estado (ACTIVE o INACTIVE)"],
  categories: ["Código de Grupo", "Código de Categoría", "Nombre", "Descripción"],
  suppliers: ["Código de Proveedor", "Empresa", "Contacto", "Email", "Teléfono", "Ciudad", "País", "Dirección"],
  products: ["Código de Grupo", "Código de Categoría", "Código de Proveedor", "Código de Producto", "Nombre", "Tipo (SALE, RAW_MATERIAL, FINISHED_GOOD, SUPPLY, SERVICE, FIXED_ASSET)", "Costo Unitario", "Precio Venta", "Cantidad Inicial"],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type || !HEADERS[type]) {
      return new Response(JSON.stringify({ error: "Tipo de plantilla inválido" }), { status: 400 });
    }

    const headers = HEADERS[type];
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Plantilla");
    
    // Añadir encabezados
    worksheet.addRow(headers);
    
    // Estilizar solo las celdas utilizadas de la fila de encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF334155" } // Slate 700
      };
    });
    
    // Habilitar Autofiltros para la primera fila
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length }
    };
    
    // Ajustar ancho de columnas y formato
    worksheet.columns.forEach((col, index) => {
      col.width = 25;
      // El nombre del encabezado actual
      const headerName = headers[index] || "";
      // Si no es un campo de costo, precio o cantidad, forzar como Texto (@)
      // Esto evita que Excel borre los ceros a la izquierda (ej. 003 -> 3)
      if (!headerName.toLowerCase().includes("costo") && 
          !headerName.toLowerCase().includes("precio") && 
          !headerName.toLowerCase().includes("cantidad")) {
        col.numFmt = '@';
      }
    });
    
    const buffer = await workbook.xlsx.writeBuffer();

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
