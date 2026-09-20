"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Globe,
  Code,
  CheckCircle2,
  XCircle,
  Terminal,
  Package,
  Users,
  Truck,
  FolderTree,
  Tag,
  ShoppingCart,
  DollarSign,
  Receipt,
  ChevronDown,
  ChevronRight,
  Zap,
  FileJson,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
  ExternalLink,
  Lock,
  AlertCircle,
  Clock,
  ShieldAlert,
  Send,
  CheckCheck
} from "lucide-react";
import {
  createApiKey,
  toggleApiKeyStatus,
  updateApiKeyPermissions,
  deleteApiKey,
  requestApiAccess,
  reviewApiRequest
} from "@/app/actions/api-key-actions";
import { successAlert, errorAlert, confirmAction } from "@/lib/sweetalert";

const RESOURCES = [
  { id: "products", label: "Productos" },
  { id: "suppliers", label: "Proveedores" },
  { id: "categories", label: "Categorías" },
  { id: "groups", label: "Grupos de Productos" },
  { id: "purchases", label: "Compras y Órdenes" },
  { id: "sales", label: "Ventas" },
  { id: "expenses", label: "Gastos y Finanzas" },
  { id: "users", label: "Usuarios" },
];

const DEFAULT_PERMISSIONS = {
  products: { read: true, create: true, update: true, delete: false },
  suppliers: { read: true, create: true, update: true, delete: false },
  categories: { read: true, create: true, update: true, delete: false },
  groups: { read: true, create: true, update: true, delete: false },
  purchases: { read: true, create: true, update: false, delete: false },
  sales: { read: true, create: true, update: false, delete: false },
  expenses: { read: true, create: true, update: false, delete: false },
  users: { read: false, create: false, update: false, delete: false },
};

type LanguageSnippet = "curl" | "js" | "python" | "php";

interface EndpointDoc {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  description: string;
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
  bodyParams?: { name: string; type: string; required: boolean; description: string }[];
  sampleBody?: any;
  sampleResponse: { status: number; data: any };
}

interface ModuleDoc {
  id: string;
  title: string;
  icon: any;
  description: string;
  endpoints: EndpointDoc[];
}

const API_MODULES: ModuleDoc[] = [
  {
    id: "products",
    title: "Productos",
    icon: Package,
    description: "Gestión del catálogo, inventario, precios y sincronización de stock con plataformas externas.",
    endpoints: [
      {
        id: "get-products",
        method: "GET",
        path: "/api/v1/products",
        title: "Consultar Catálogo de Productos",
        description: "Obtiene la lista de productos registrados para la empresa con detalles de categoría, grupo y stock disponible.",
        queryParams: [
          { name: "limit", type: "number", required: false, description: "Cantidad máxima de registros a retornar (por defecto 50)" }
        ],
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            count: 2,
            data: [
              {
                id: 101,
                code: "PRD-001",
                name: "Camiseta Oversize Algodón",
                quantityAvailable: 45,
                unitCost: 25000,
                salePrice: 55000,
                type: "SALE",
                category: { id: 3, name: "Ropa y Textiles" },
                supplier: { id: 12, companyName: "Textiles Andinos S.A.S.", contactName: "Carlos Ruiz" },
                productGroup: { id: 1, name: "Prendas Superiores" },
                updatedAt: "2026-09-19T01:00:00.000Z"
              }
            ]
          }
        }
      },
      {
        id: "post-products",
        method: "POST",
        path: "/api/v1/products",
        title: "Crear Nuevo Producto",
        description: "Crea un producto en el inventario y lo asigna automáticamente a la bodega principal de la empresa.",
        bodyParams: [
          { name: "code", type: "string", required: true, description: "Código SKU o de barras único" },
          { name: "name", type: "string", required: true, description: "Nombre comercial del producto" },
          { name: "categoryId", type: "number", required: true, description: "ID de la categoría existente" },
          { name: "supplierId", type: "number", required: true, description: "ID del proveedor asignado" },
          { name: "quantityAvailable", type: "number", required: false, description: "Stock inicial en bodega (default 0)" },
          { name: "unitCost", type: "number", required: false, description: "Costo unitario de adquisición (default 0)" },
          { name: "salePrice", type: "number", required: false, description: "Precio de venta al público (default 0)" },
          { name: "productGroupId", type: "number", required: false, description: "ID del grupo de productos opcional" },
          { name: "type", type: "string", required: false, description: "Tipo: 'SALE' o 'RAW_MATERIAL' (default 'SALE')" }
        ],
        sampleBody: {
          code: "PRD-002",
          name: "Pantalón Cargo Casual",
          categoryId: 3,
          supplierId: 12,
          quantityAvailable: 30,
          unitCost: 40000,
          salePrice: 89000,
          productGroupId: 2,
          type: "SALE"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 102,
              code: "PRD-002",
              name: "Pantalón Cargo Casual",
              quantityAvailable: 30,
              salePrice: 89000,
              createdAt: "2026-09-19T01:05:00.000Z"
            }
          }
        }
      },
      {
        id: "put-products",
        method: "PUT",
        path: "/api/v1/products",
        title: "Actualizar Producto Existente",
        description: "Modifica atributos como precios, stock, categoría o nombre de un producto por su ID.",
        bodyParams: [
          { name: "id", type: "number", required: true, description: "ID interno del producto a modificar" },
          { name: "name", type: "string", required: false, description: "Nuevo nombre" },
          { name: "salePrice", type: "number", required: false, description: "Nuevo precio de venta" },
          { name: "quantityAvailable", type: "number", required: false, description: "Ajuste directo de stock disponible" },
          { name: "unitCost", type: "number", required: false, description: "Nuevo costo unitario" }
        ],
        sampleBody: {
          id: 102,
          salePrice: 95000,
          quantityAvailable: 28
        },
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            message: "Producto actualizado correctamente"
          }
        }
      },
      {
        id: "delete-products",
        method: "DELETE",
        path: "/api/v1/products?id={id}",
        title: "Eliminar Producto",
        description: "Elimina permanentemente un producto de la empresa especificado por su ID en parámetro query.",
        queryParams: [
          { name: "id", type: "number", required: true, description: "ID del producto a eliminar" }
        ],
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            message: "Producto eliminado correctamente"
          }
        }
      }
    ]
  },
  {
    id: "suppliers",
    title: "Proveedores",
    icon: Truck,
    description: "Administración de proveedores, contactos comerciales, NITs y datos de facturación.",
    endpoints: [
      {
        id: "get-suppliers",
        method: "GET",
        path: "/api/v1/suppliers",
        title: "Consultar Directorio de Proveedores",
        description: "Lista todos los proveedores registrados en la empresa.",
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            data: [
              {
                id: 12,
                code: "PRV-01",
                companyName: "Textiles Andinos S.A.S.",
                nit: "900123456-7",
                contactName: "Carlos Ruiz",
                email: "contacto@textilesandinos.com",
                phone: "3101234567",
                city: "Medellín",
                address: "Calle 50 # 40-20"
              }
            ]
          }
        }
      },
      {
        id: "post-suppliers",
        method: "POST",
        path: "/api/v1/suppliers",
        title: "Registrar Proveedor",
        description: "Crea un nuevo proveedor en la base de datos empresarial.",
        bodyParams: [
          { name: "companyName", type: "string", required: true, description: "Razón social o nombre comercial" },
          { name: "nit", type: "string", required: false, description: "Documento o identificación tributaria" },
          { name: "contactName", type: "string", required: false, description: "Nombre del asesor o contacto directo" },
          { name: "email", type: "string", required: false, description: "Correo electrónico de contacto" },
          { name: "phone", type: "string", required: false, description: "Teléfono o celular" },
          { name: "city", type: "string", required: false, description: "Ciudad o municipio" },
          { name: "address", type: "string", required: false, description: "Dirección física" }
        ],
        sampleBody: {
          companyName: "Distribuidora Global S.A.",
          nit: "901456789-1",
          contactName: "Mariana Gómez",
          email: "ventas@globaldist.com",
          phone: "3009876543",
          city: "Bogotá",
          address: "Cra 15 # 85-30"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 13,
              companyName: "Distribuidora Global S.A.",
              contactName: "Mariana Gómez",
              email: "ventas@globaldist.com"
            }
          }
        }
      },
      {
        id: "put-suppliers",
        method: "PUT",
        path: "/api/v1/suppliers",
        title: "Actualizar Proveedor",
        description: "Modifica información de contacto o fiscal de un proveedor existente.",
        bodyParams: [
          { name: "id", type: "number", required: true, description: "ID del proveedor a modificar" },
          { name: "phone", type: "string", required: false, description: "Nuevo teléfono" },
          { name: "email", type: "string", required: false, description: "Nuevo correo electrónico" }
        ],
        sampleBody: {
          id: 13,
          phone: "3151112233",
          email: "gerencia@globaldist.com"
        },
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            message: "Proveedor actualizado correctamente"
          }
        }
      },
      {
        id: "delete-suppliers",
        method: "DELETE",
        path: "/api/v1/suppliers?id={id}",
        title: "Eliminar Proveedor",
        description: "Elimina un proveedor por su ID vía parámetro query.",
        queryParams: [
          { name: "id", type: "number", required: true, description: "ID del proveedor a eliminar" }
        ],
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            message: "Proveedor eliminado correctamente"
          }
        }
      }
    ]
  },
  {
    id: "purchases",
    title: "Compras & Órdenes",
    icon: ShoppingCart,
    description: "Registro de órdenes de compra, control de recepciones, proveedores y líneas de costos.",
    endpoints: [
      {
        id: "get-purchases",
        method: "GET",
        path: "/api/v1/purchases",
        title: "Consultar Órdenes de Compra",
        description: "Obtiene el historial de órdenes de compra emitidas con detalle de artículos, proveedor y totales.",
        queryParams: [
          { name: "limit", type: "number", required: false, description: "Límite de órdenes a consultar (default 50)" }
        ],
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            count: 1,
            data: [
              {
                id: 45,
                orderNumber: "OC-948123",
                status: "DRAFT",
                subtotal: 500000,
                taxAmount: 95000,
                total: 595000,
                expectedDelivery: "2026-09-30T00:00:00.000Z",
                supplier: {
                  id: 12,
                  companyName: "Textiles Andinos S.A.S.",
                  contactName: "Carlos Ruiz",
                  email: "contacto@textilesandinos.com"
                },
                lines: [
                  {
                    id: 89,
                    productId: 101,
                    description: "Camiseta Oversize Algodón",
                    itemType: "PRODUCTO_VENTA",
                    quantity: 20,
                    unitPrice: 25000,
                    total: 500000,
                    product: { id: 101, code: "PRD-001", name: "Camiseta Oversize Algodón" }
                  }
                ],
                createdAt: "2026-09-19T01:00:00.000Z"
              }
            ]
          }
        }
      },
      {
        id: "post-purchases",
        method: "POST",
        path: "/api/v1/purchases",
        title: "Crear Orden de Compra",
        description: "Crea una nueva orden de compra calculando automáticamente subtotales, impuestos y totales.",
        bodyParams: [
          { name: "supplierId", type: "number", required: true, description: "ID del proveedor destinatario" },
          { name: "expectedDelivery", type: "string", required: false, description: "Fecha estimada de entrega (ISO 8601 YYYY-MM-DD)" },
          { name: "notes", type: "string", required: false, description: "Observaciones internas de la orden" },
          { name: "terms", type: "string", required: false, description: "Términos comerciales o de pago" },
          { name: "lines", type: "array", required: true, description: "Array de items: [{ productId?, description?, itemType?, quantity, unitPrice, taxRate? }]" }
        ],
        sampleBody: {
          supplierId: 12,
          expectedDelivery: "2026-10-05",
          notes: "Entrega en bodega central de 8am a 5pm",
          terms: "Pago a 30 días contra entrega",
          lines: [
            {
              productId: 101,
              description: "Camisetas Lote Primavera",
              itemType: "PRODUCTO_VENTA",
              quantity: 50,
              unitPrice: 24000,
              taxRate: 19
            }
          ]
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 46,
              orderNumber: "OC-948124",
              supplierId: 12,
              status: "DRAFT",
              subtotal: 1200000,
              taxAmount: 228000,
              total: 1428000,
              createdAt: "2026-09-19T01:10:00.000Z"
            }
          }
        }
      }
    ]
  },
  {
    id: "sales",
    title: "Ventas",
    icon: DollarSign,
    description: "Registro de ventas, transacciones de POS/E-commerce y descarga automática de stock.",
    endpoints: [
      {
        id: "get-sales",
        method: "GET",
        path: "/api/v1/sales",
        title: "Consultar Historial de Ventas",
        description: "Lista las ventas completadas por la empresa con el desglose de productos y medios de pago.",
        queryParams: [
          { name: "limit", type: "number", required: false, description: "Número máximo de ventas (default 50)" }
        ],
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            count: 1,
            data: [
              {
                id: 88,
                saleNumber: "VEN-892301",
                client: "Juan Pérez",
                paymentMethod: "TRANSFERENCIA",
                discount: 0,
                total: 110000,
                status: "COMPLETED",
                saleDetails: [
                  {
                    id: 140,
                    quantity: 2,
                    unitPrice: 55000,
                    subtotal: 110000,
                    product: { id: 101, code: "PRD-001", name: "Camiseta Oversize Algodón" }
                  }
                ],
                createdAt: "2026-09-19T00:30:00.000Z"
              }
            ]
          }
        }
      },
      {
        id: "post-sales",
        method: "POST",
        path: "/api/v1/sales",
        title: "Registrar Nueva Venta",
        description: "Registra una venta, descuenta inmediatamente las unidades del stock y genera el consecutivo de venta.",
        bodyParams: [
          { name: "client", type: "string", required: false, description: "Nombre o razón social del cliente (default 'Cliente General')" },
          { name: "paymentMethod", type: "string", required: false, description: "Método: 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'DATAFONO'" },
          { name: "discount", type: "number", required: false, description: "Valor del descuento aplicado en moneda" },
          { name: "remarks", type: "string", required: false, description: "Notas u observaciones de la transacción" },
          { name: "items", type: "array", required: true, description: "Lista de productos vendidos: [{ productId, quantity, unitPrice? }]" }
        ],
        sampleBody: {
          client: "Laura Martínez",
          paymentMethod: "TARJETA",
          discount: 5000,
          remarks: "Pedido tienda online #4582",
          items: [
            {
              productId: 101,
              quantity: 2,
              unitPrice: 55000
            }
          ]
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 89,
              saleNumber: "VEN-892302",
              client: "Laura Martínez",
              paymentMethod: "TARJETA",
              total: 105000,
              status: "COMPLETED",
              createdAt: "2026-09-19T01:15:00.000Z"
            }
          }
        }
      }
    ]
  },
  {
    id: "groups",
    title: "Grupos de Productos",
    icon: FolderTree,
    description: "Clasificación por líneas de producto, marcas, colecciones o familias comerciales.",
    endpoints: [
      {
        id: "get-groups",
        method: "GET",
        path: "/api/v1/groups",
        title: "Consultar Grupos",
        description: "Obtiene todos los grupos de productos creados por la empresa.",
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            data: [
              { id: 1, name: "Prendas Superiores", description: "Camisetas, camisas y chaquetas", createdAt: "2026-09-01T00:00:00.000Z" },
              { id: 2, name: "Prendas Inferiores", description: "Pantalones, jeans y bermudas", createdAt: "2026-09-01T00:00:00.000Z" }
            ]
          }
        }
      },
      {
        id: "post-groups",
        method: "POST",
        path: "/api/v1/groups",
        title: "Crear Grupo",
        description: "Crea un nuevo grupo o familia de productos.",
        bodyParams: [
          { name: "name", type: "string", required: true, description: "Nombre del grupo" },
          { name: "description", type: "string", required: false, description: "Descripción opcional" }
        ],
        sampleBody: {
          name: "Calzado & Accesorios",
          description: "Zapatos, cinturones y bolsos de cuero"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: { id: 3, name: "Calzado & Accesorios", description: "Zapatos, cinturones y bolsos de cuero" }
          }
        }
      },
      {
        id: "put-groups",
        method: "PUT",
        path: "/api/v1/groups",
        title: "Actualizar Grupo",
        description: "Modifica el nombre o descripción de un grupo existente.",
        bodyParams: [
          { name: "id", type: "number", required: true, description: "ID del grupo a editar" },
          { name: "name", type: "string", required: false, description: "Nuevo nombre" },
          { name: "description", type: "string", required: false, description: "Nueva descripción" }
        ],
        sampleBody: {
          id: 3,
          name: "Calzado, Bolsos & Accesorios"
        },
        sampleResponse: {
          status: 200,
          data: { success: true, message: "Grupo actualizado correctamente" }
        }
      },
      {
        id: "delete-groups",
        method: "DELETE",
        path: "/api/v1/groups?id={id}",
        title: "Eliminar Grupo",
        description: "Elimina un grupo de productos por su ID.",
        queryParams: [
          { name: "id", type: "number", required: true, description: "ID del grupo a eliminar" }
        ],
        sampleResponse: {
          status: 200,
          data: { success: true, message: "Grupo eliminado correctamente" }
        }
      }
    ]
  },
  {
    id: "categories",
    title: "Categorías",
    icon: Tag,
    description: "Gestión de categorías y subcategorías del catálogo de productos.",
    endpoints: [
      {
        id: "get-categories",
        method: "GET",
        path: "/api/v1/categories",
        title: "Consultar Categorías",
        description: "Retorna la lista completa de categorías de la empresa.",
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            data: [
              { id: 3, name: "Ropa y Textiles", description: "Prendas de vestir en general" },
              { id: 4, name: "Artículos para Hogar", description: "Decoración y cocina" }
            ]
          }
        }
      },
      {
        id: "post-categories",
        method: "POST",
        path: "/api/v1/categories",
        title: "Crear Categoría",
        description: "Registra una nueva categoría en el catálogo.",
        bodyParams: [
          { name: "name", type: "string", required: true, description: "Nombre de la categoría" },
          { name: "description", type: "string", required: false, description: "Descripción detallada" }
        ],
        sampleBody: {
          name: "Electrónica & Gadgets",
          description: "Dispositivos electrónicos y periféricos"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: { id: 5, name: "Electrónica & Gadgets", description: "Dispositivos electrónicos y periféricos" }
          }
        }
      },
      {
        id: "put-categories",
        method: "PUT",
        path: "/api/v1/categories",
        title: "Actualizar Categoría",
        description: "Modifica el nombre o descripción de una categoría.",
        bodyParams: [
          { name: "id", type: "number", required: true, description: "ID de la categoría" },
          { name: "name", type: "string", required: false, description: "Nuevo nombre" },
          { name: "description", type: "string", required: false, description: "Nueva descripción" }
        ],
        sampleBody: {
          id: 5,
          name: "Tecnología y Gadgets"
        },
        sampleResponse: {
          status: 200,
          data: { success: true, message: "Categoría actualizada correctamente" }
        }
      },
      {
        id: "delete-categories",
        method: "DELETE",
        path: "/api/v1/categories?id={id}",
        title: "Eliminar Categoría",
        description: "Elimina una categoría existente por su ID.",
        queryParams: [
          { name: "id", type: "number", required: true, description: "ID de la categoría a eliminar" }
        ],
        sampleResponse: {
          status: 200,
          data: { success: true, message: "Categoría eliminada correctamente" }
        }
      }
    ]
  },
  {
    id: "expenses",
    title: "Gastos & Finanzas",
    icon: Receipt,
    description: "Registro de egresos operativos, pagos a proveedores, arriendos y caja menor.",
    endpoints: [
      {
        id: "get-expenses",
        method: "GET",
        path: "/api/v1/expenses",
        title: "Consultar Gastos Corporativos",
        description: "Lista todos los gastos y egresos registrados por fecha descendente.",
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            count: 1,
            data: [
              {
                id: 20,
                concept: "Pago de Servicios Públicos e Internet",
                category: "SERVICIOS",
                amount: 320000,
                paymentMethod: "TRANSFERENCIA",
                date: "2026-09-18T14:00:00.000Z",
                notes: "Factura septiembre fibra óptica"
              }
            ]
          }
        }
      },
      {
        id: "post-expenses",
        method: "POST",
        path: "/api/v1/expenses",
        title: "Registrar Gasto",
        description: "Crea un nuevo movimiento de egreso financiero.",
        bodyParams: [
          { name: "concept", type: "string", required: true, description: "Concepto o motivo del gasto" },
          { name: "amount", type: "number", required: true, description: "Monto total del gasto" },
          { name: "category", type: "string", required: false, description: "Categoría (e.g. 'ADMINISTRATIVO', 'OPERATIVO', 'SERVICIOS')" },
          { name: "paymentMethod", type: "string", required: false, description: "Método de pago (default 'EFECTIVO')" },
          { name: "date", type: "string", required: false, description: "Fecha del gasto en formato ISO 8601" },
          { name: "notes", type: "string", required: false, description: "Detalles u observaciones" }
        ],
        sampleBody: {
          concept: "Mantenimiento de Maquinaria y Equipos",
          amount: 450000,
          category: "MANTENIMIENTO",
          paymentMethod: "TRANSFERENCIA",
          date: "2026-09-19T10:00:00.000Z",
          notes: "Cambio de repuestos preventivo"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 21,
              concept: "Mantenimiento de Maquinaria y Equipos",
              amount: 450000,
              category: "MANTENIMIENTO",
              createdAt: "2026-09-19T01:20:00.000Z"
            }
          }
        }
      }
    ]
  },
  {
    id: "users",
    title: "Usuarios",
    icon: Users,
    description: "Gestión y consulta de colaboradores de la empresa con acceso al sistema.",
    endpoints: [
      {
        id: "get-users",
        method: "GET",
        path: "/api/v1/users",
        title: "Consultar Usuarios",
        description: "Lista los colaboradores y usuarios activos de la empresa.",
        sampleResponse: {
          status: 200,
          data: {
            success: true,
            data: [
              {
                id: 1,
                name: "Administrador General",
                email: "admin@empresa.com",
                role: "ADMIN",
                active: true,
                createdAt: "2026-01-01T00:00:00.000Z"
              }
            ]
          }
        }
      },
      {
        id: "post-users",
        method: "POST",
        path: "/api/v1/users",
        title: "Crear Usuario",
        description: "Registra un nuevo usuario para la empresa con rol asignado.",
        bodyParams: [
          { name: "name", type: "string", required: true, description: "Nombre completo del usuario" },
          { name: "email", type: "string", required: true, description: "Correo electrónico único" },
          { name: "password", type: "string", required: true, description: "Contraseña inicial de acceso" },
          { name: "role", type: "string", required: false, description: "Rol: 'ADMIN', 'SELLER', 'WAREHOUSE', 'AUDITOR' (default 'SELLER')" }
        ],
        sampleBody: {
          name: "Carlos Vendedor",
          email: "carlos.ventas@empresa.com",
          password: "ClaveSegura2026*",
          role: "SELLER"
        },
        sampleResponse: {
          status: 201,
          data: {
            success: true,
            data: {
              id: 5,
              name: "Carlos Vendedor",
              email: "carlos.ventas@empresa.com",
              role: "SELLER"
            }
          }
        }
      }
    ]
  }
];

export function ApiIntegrationsManager({
  apiData = { isSuperAdmin: false, keys: [], hasActiveIntegrations: false },
  companies = []
}: {
  apiData: {
    isSuperAdmin: boolean;
    isAdmin?: boolean;
    isTrialLocked?: boolean;
    canRequest?: boolean;
    requestStatus?: string | null;
    rejectionReason?: string | null;
    pendingRequests?: any[];
    keys: any[];
    hasActiveIntegrations: boolean;
  };
  companies?: { id: number; name: string }[];
}) {
  const isSuperAdmin = apiData.isSuperAdmin;
  const [keysList, setKeysList] = useState<any[]>(apiData.keys || []);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | string>(companies[0]?.id || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [permissions, setPermissions] = useState<any>(DEFAULT_PERMISSIONS);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [origin, setOrigin] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("products");
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    "get-products": true,
    "post-products": true
  });
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageSnippet>("curl");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Estados de control de período de prueba y solicitudes de activación
  const [isTrialLocked, setIsTrialLocked] = useState(Boolean(apiData.isTrialLocked));
  const [requestStatus, setRequestStatus] = useState<string | null>(apiData.requestStatus || null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(apiData.rejectionReason || null);
  const [canRequest, setCanRequest] = useState(Boolean(apiData.canRequest));
  const [pendingRequestsList, setPendingRequestsList] = useState<any[]>(apiData.pendingRequests || []);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [justification, setJustification] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints(prev => ({
      ...prev,
      [endpointId]: !prev[endpointId]
    }));
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setPermissions((prev: any) => ({
      ...prev,
      [resource]: {
        ...(prev[resource] || {}),
        [action]: checked
      }
    }));
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      errorAlert("Atención", "Por favor asigna un nombre para identificar la llave API.");
      return;
    }
    if (isSuperAdmin && !selectedCompanyId) {
      errorAlert("Atención", "Debes seleccionar la empresa a la que se le asignará la llave API.");
      return;
    }

    setIsCreating(true);
    const res = await createApiKey({
      name: newKeyName,
      targetCompanyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
      permissions
    });
    setIsCreating(false);

    if (res.success && res.apiKey) {
      setCreatedKey(res.apiKey.key);
      setKeysList([res.apiKey, ...keysList]);
      successAlert("¡Llave API Generada!", "Guarda tu token de acceso de forma segura.");
    } else {
      errorAlert("Error", res.error || "No se pudo generar la API Key");
    }
  };

  const handleToggleStatus = async (keyItem: any) => {
    const nextStatus = !keyItem.active;
    const res = await toggleApiKeyStatus(keyItem.id, nextStatus);
    if (res.success) {
      setKeysList(keysList.map(k => k.id === keyItem.id ? { ...k, active: nextStatus } : k));
      successAlert("Estado Actualizado", `La llave ahora está ${nextStatus ? 'activa' : 'desactivada'}.`);
    } else {
      errorAlert("Error", res.error || "No se pudo actualizar el estado de la llave");
    }
  };

  const handleDeleteKey = async (id: string) => {
    const confirmed = await confirmAction(
      "Revocar Llave API",
      "¿Estás seguro de revocar esta llave? Todas las aplicaciones externas conectadas perderán el acceso inmediatamente.",
      "Sí, Revocar Llave",
      "Cancelar"
    );
    if (!confirmed) return;

    const res = await deleteApiKey(id);
    if (res.success) {
      setKeysList(keysList.filter(k => k.id !== id));
      successAlert("Llave Revocada", "La API Key ha sido eliminada permanentemente.");
    } else {
      errorAlert("Error", res.error || "No se pudo eliminar la API Key");
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 15) {
      errorAlert("Justificación requerida", "Por favor ingresa una justificación detallada de al menos 15 caracteres.");
      return;
    }
    setIsSubmittingRequest(true);
    const res = await requestApiAccess(justification.trim());
    setIsSubmittingRequest(false);
    if (res.success) {
      setRequestStatus("PENDING");
      setCanRequest(false);
      setIsRequestModalOpen(false);
      setJustification("");
      successAlert("Solicitud Enviada", "Tu solicitud fue remitida al Administrador Global. Te notificaremos una vez sea revisada.");
    } else {
      errorAlert("Error", res.error || "No se pudo enviar la solicitud.");
    }
  };

  const handleApprove = async (reqItem: any) => {
    const confirmed = await confirmAction(
      "Aprobar Acceso a API",
      `¿Deseas autorizar a la empresa "${reqItem.company?.name}" para generar y consumir llaves API REST?`,
      "Sí, Aprobar Integración",
      "Cancelar"
    );
    if (!confirmed) return;

    setIsSubmittingReview(true);
    const res = await reviewApiRequest(reqItem.id, "APPROVE");
    setIsSubmittingReview(false);
    if (res.success) {
      setPendingRequestsList(prev => prev.map(r => r.id === reqItem.id ? { ...r, status: "APPROVED", reviewedAt: new Date() } : r));
      successAlert("Aprobado con éxito", `La empresa ${reqItem.company?.name} ahora puede usar el módulo de APIs.`);
    } else {
      errorAlert("Error", res.error || "No se pudo aprobar la solicitud.");
    }
  };

  const handleOpenReject = (reqId: number) => {
    setRejectRequestId(reqId);
    setRejectReasonText("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRequestId) return;

    setIsSubmittingReview(true);
    const res = await reviewApiRequest(rejectRequestId, "REJECT", rejectReasonText);
    setIsSubmittingReview(false);

    if (res.success) {
      setPendingRequestsList(prev => prev.map(r => r.id === rejectRequestId ? { ...r, status: "REJECTED", rejectionReason: rejectReasonText, reviewedAt: new Date() } : r));
      setIsRejectModalOpen(false);
      successAlert("Solicitud Rechazada", "Se ha registrado el rechazo y el motivo.");
    } else {
      errorAlert("Error", res.error || "No se pudo rechazar la solicitud.");
    }
  };

  const activeToken = keysList.find(k => k.active)?.key || "gns_live_tu_api_key_aqui";
  const currentModuleDoc = API_MODULES.find(m => m.id === selectedModule) || API_MODULES[0];

  const getBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "POST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "PUT":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const generateSnippet = (ep: EndpointDoc, lang: LanguageSnippet) => {
    const fullUrl = `${origin || "https://tu-dominio.com"}${ep.path}`;
    const token = activeToken;

    if (lang === "curl") {
      if (ep.method === "GET") {
        return `curl -X GET "${fullUrl}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json"`;
      }
      if (ep.method === "DELETE") {
        return `curl -X DELETE "${fullUrl}" \\\n  -H "Authorization: Bearer ${token}"`;
      }
      return `curl -X ${ep.method} "${fullUrl}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(ep.sampleBody || {}, null, 2)}'`;
    }

    if (lang === "js") {
      const bodySnippet = ep.sampleBody
        ? `,\n  body: JSON.stringify(${JSON.stringify(ep.sampleBody, null, 4)})`
        : "";
      return `// JavaScript / Node.js (fetch)\nconst response = await fetch("${fullUrl}", {\n  method: "${ep.method}",\n  headers: {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n  }${bodySnippet}\n});\n\nconst result = await response.json();\nconsole.log(result);`;
    }

    if (lang === "python") {
      return `# Python (requests)\nimport requests\n\nurl = "${fullUrl}"\nheaders = {\n    "Authorization": "Bearer ${token}",\n    "Content-Type": "application/json"\n}\n${ep.sampleBody ? `payload = ${JSON.stringify(ep.sampleBody, null, 4)}\nresponse = requests.${ep.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.${ep.method.toLowerCase()}(url, headers=headers)`}\n\nprint(response.json())`;
    }

    if (lang === "php") {
      return `<?php\n// PHP (cURL)\n$curl = curl_init();\n\ncurl_setopt_array($curl, array(\n  CURLOPT_URL => "${fullUrl}",\n  CURLOPT_RETURNTRANSFER => true,\n  CURLOPT_CUSTOMREQUEST => "${ep.method}",\n  ${ep.sampleBody ? `CURLOPT_POSTFIELDS => '${JSON.stringify(ep.sampleBody)}',\n  ` : ""}CURLOPT_HTTPHEADER => array(\n    "Authorization: Bearer ${token}",\n    "Content-Type: application/json"\n  ),\n));\n\n$response = curl_exec($curl);\ncurl_close($curl);\necho $response;\n?>`;
    }

    return "";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* ── BANDEJA DE SOLICITUDES PARA SUPERADMIN ── */}
      {isSuperAdmin && (
        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Solicitudes de Acceso a API REST (Empresas en Prueba)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Revisa y aprueba las justificaciones de empresas en prueba que requieren generar Llaves API.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-center">
              {pendingRequestsList.filter(r => r.status === "PENDING").length} Pendientes
            </span>
          </div>

          {pendingRequestsList.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-2xl">
              <p className="text-xs text-muted-foreground">No hay solicitudes de integración pendientes ni registradas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pendingRequestsList.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    req.status === "PENDING"
                      ? "bg-amber-500/5 border-amber-500/30"
                      : req.status === "APPROVED"
                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-80"
                      : "bg-rose-500/5 border-rose-500/20 opacity-70"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-foreground">{req.company?.name || "Empresa"}</span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        req.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}>
                        {req.status === "PENDING" ? "Pendiente de Revisión" : req.status === "APPROVED" ? "Aprobada" : "Rechazada"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Solicitado por: <strong>{req.requestedBy?.name || req.requestedBy?.email}</strong> ({new Date(req.createdAt).toLocaleDateString("es-CO")})
                      </span>
                    </div>

                    <div className="bg-background/80 border border-border/60 p-3 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                        Justificación comercial / técnica del cliente:
                      </span>
                      <p className="text-xs text-foreground italic">"{req.justification}"</p>
                      {req.rejectionReason && (
                        <p className="text-xs text-rose-500 font-semibold mt-1.5 pt-1.5 border-t border-border/40">
                          Motivo de rechazo: {req.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={isSubmittingReview}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <CheckCheck size={14} />
                        <span>Aprobar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenReject(req.id)}
                        disabled={isSubmittingReview}
                        className="px-3.5 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-600/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BLOQUEO PARA CUENTAS DE PRUEBA GRATUITA SIN APROBACIÓN ── */}
      {isTrialLocked && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-background p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                <Lock size={14} />
                Módulo Protegido · Prueba Gratuita 15 Días
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                <ShieldCheck size={24} className="text-amber-500" />
                Integración API REST Inhabilitada Temporalmente
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Por políticas de ciberseguridad, aislamiento multi-empresa y prevención de abuso, la generación y consumo de Llaves API REST durante el período de prueba gratuita requiere una solicitud previa y justificación de uso ante el Administrador Global.
              </p>

              {requestStatus === "PENDING" && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <Clock size={20} className="text-amber-500 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Solicitud enviada y en revisión
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tu solicitud de activación está siendo evaluada por el equipo de seguridad de SarriaTech. Te avisaremos cuando sea aprobada.
                    </p>
                  </div>
                </div>
              )}

              {requestStatus === "REJECTED" && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Solicitud anterior no aprobada: "{rejectionReason || "No cumple con requisitos mínimos de seguridad"}"
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Puedes enviar una nueva solicitud detallando el sistema o plataforma externa con la que necesitas conectarte.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {canRequest && (
              <button
                type="button"
                onClick={() => {
                  setJustification("");
                  setIsRequestModalOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer shrink-0"
              >
                <Send size={16} />
                <span>Solicitar Activación de APIs</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BANNER PRINCIPAL DE INTEGRACIONES ── */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-bold">
              <Zap size={14} className="animate-pulse" />
              Ecosistema de Conexiones REST API v1
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Code size={24} className="text-primary" />
              Módulo de Integraciones & Endpoints
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Conecta tu software con plataformas de E-commerce (Shopify, WooCommerce), sistemas ERP, POS de punto de venta, aplicaciones móviles o herramientas de automatización como Zapier y Make mediante nuestra API REST segura.
            </p>
          </div>

          {!isTrialLocked && (
            <button
              type="button"
              onClick={() => {
                setCreatedKey(null);
                setNewKeyName("");
                setPermissions(DEFAULT_PERMISSIONS);
                if (companies.length > 0) setSelectedCompanyId(companies[0].id);
                setIsModalOpen(true);
              }}
              className="bg-primary text-primary-foreground font-extrabold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 hover:opacity-95 active:scale-95 transition-all shadow-lg hover:shadow-primary/25 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              <span>Generar Nueva Llave API</span>
            </button>
          )}
        </div>

        {/* Barra de Autenticación Rápida */}
        <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Base URL del Servidor</span>
              <code className="text-xs font-mono text-primary font-bold truncate block mt-0.5">
                {origin || "https://tu-dominio.com"}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(origin || "https://tu-dominio.com", "base_url")}
              className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/60 transition cursor-pointer shrink-0"
              title="Copiar URL base"
            >
              {copiedId === "base_url" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">Encabezado de Autenticación Requerido</span>
              <code className="text-xs font-mono text-foreground font-semibold truncate block mt-0.5">
                Authorization: Bearer &lt;TU_API_KEY&gt;
              </code>
            </div>
            <button
              onClick={() => copyToClipboard("Authorization: Bearer " + activeToken, "auth_header")}
              className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/60 transition cursor-pointer shrink-0"
              title="Copiar cabecera de autenticación"
            >
              {copiedId === "auth_header" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DE LLAVES API ACTIVAS ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-primary" />
            <h3 className="font-extrabold text-sm sm:text-base text-foreground">
              {isSuperAdmin ? "Llaves API de Todas las Empresas" : "Credenciales de Acceso de Tu Empresa"}
            </h3>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            keysList.some(k => k.active)
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {keysList.filter(k => k.active).length} Llaves Activas
          </span>
        </div>

        {keysList.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <KeyRound size={22} />
            </div>
            <h4 className="font-bold text-sm text-foreground">No hay Llaves API generadas</h4>
            <p className="text-xs text-muted-foreground max-w-md">
              Genera tu primera API Key para otorgar permisos a aplicaciones externas como Shopify, WooCommerce o scripts en Python.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-xs hover:opacity-90 transition cursor-pointer"
            >
              Crear Llave Ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {keysList.map((k) => {
              const isVisible = !!visibleKeys[k.id];
              const displayKey = isVisible ? k.key : (k.key ? `${k.key.substring(0, 16)}••••••••••••••••••••••••` : "gns_live_••••••••••••••••");

              return (
                <div
                  key={k.id}
                  className="bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm transition"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${k.active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      <h4 className="font-black text-sm text-foreground truncate">{k.name}</h4>
                      {k.company?.name && (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {k.company.name}
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        k.active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {k.active ? "Conectada & Activa" : "Desactivada"}
                      </span>
                    </div>

                    {/* Token de la Llave */}
                    {k.key && (
                      <div className="flex items-center gap-2 pt-1">
                        <code className="text-xs font-mono bg-muted/70 px-3 py-1.5 rounded-xl border border-border text-foreground truncate max-w-sm sm:max-w-md">
                          {displayKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(k.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                          title={isVisible ? "Ocultar token" : "Mostrar token completo"}
                        >
                          {isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition cursor-pointer"
                          title="Copiar token completo"
                        >
                          {copiedId === k.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground pt-0.5">
                      Último uso: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("es-CO") : "Sin uso reciente"} • Creada: {new Date(k.createdAt).toLocaleDateString("es-CO")}
                    </p>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(k)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        k.active
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {k.active ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                      title="Revocar / Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── EXPLORADOR Y DOCUMENTACIÓN INTERACTIVA DE ENDPOINTS ── */}
      <div className="space-y-5 pt-4 border-t border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Globe size={20} className="text-primary" />
              Documentación Interactiva de Endpoints REST
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explora los esquemas de petición (JSON Body), parámetros y ejemplos de código listos para producción.
            </p>
          </div>

          {/* Selector de Lenguaje de Código */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedLanguage("curl")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedLanguage === "curl" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("js")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedLanguage === "js" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              JavaScript (Fetch)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("python")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedLanguage === "python" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Python
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage("php")}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                selectedLanguage === "php" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              PHP
            </button>
          </div>
        </div>

        {/* Pestañas de Módulos (Productos, Proveedores, Grupos, Categorías, Compras, Ventas, Gastos, Usuarios) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {API_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isSelected = selectedModule === mod.id;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSelectedModule(mod.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                <Icon size={16} />
                <span>{mod.title}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {mod.endpoints.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tarjeta de Resumen del Módulo Seleccionado */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {React.createElement(currentModuleDoc.icon, { size: 20 })}
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-foreground">
                Módulo de {currentModuleDoc.title}
              </h4>
              <p className="text-xs text-muted-foreground">{currentModuleDoc.description}</p>
            </div>
          </div>

          {/* Lista de Endpoints del Módulo */}
          <div className="space-y-3.5">
            {currentModuleDoc.endpoints.map((ep) => {
              const isExpanded = !!expandedEndpoints[ep.id];
              const fullPath = `${origin || "https://tu-dominio.com"}${ep.path}`;

              return (
                <div
                  key={ep.id}
                  className="bg-muted/30 border border-border rounded-2xl overflow-hidden transition"
                >
                  {/* Cabecera del Endpoint (Clickable) */}
                  <div
                    onClick={() => toggleEndpoint(ep.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/60 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border uppercase tracking-wider shrink-0 ${getBadgeColor(ep.method)}`}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono font-bold text-foreground truncate">
                        {ep.path}
                      </code>
                      <span className="hidden md:inline text-xs text-muted-foreground truncate">
                        — {ep.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(fullPath, `path_${ep.id}`);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-card transition cursor-pointer"
                        title="Copiar ruta completa"
                      >
                        {copiedId === `path_${ep.id}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        className="p-1 text-muted-foreground hover:text-foreground transition"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalle Expandible del Endpoint */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 border-t border-border/60 bg-card/60 space-y-5 animate-in fade-in duration-150">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {ep.description}
                      </p>

                      {/* Parámetros Query */}
                      {ep.queryParams && ep.queryParams.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileJson size={14} className="text-primary" />
                            Parámetros Query (URL)
                          </h5>
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border text-[10px] uppercase">
                                <tr>
                                  <th className="p-2.5">Parámetro</th>
                                  <th className="p-2.5">Tipo</th>
                                  <th className="p-2.5">Requerido</th>
                                  <th className="p-2.5">Descripción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                                {ep.queryParams.map((param, i) => (
                                  <tr key={i} className="hover:bg-muted/30">
                                    <td className="p-2.5 font-bold text-primary">{param.name}</td>
                                    <td className="p-2.5 text-muted-foreground font-sans">{param.type}</td>
                                    <td className="p-2.5 font-sans">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${param.required ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                                        {param.required ? "Obligatorio" : "Opcional"}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-foreground font-sans">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Parámetros del Body JSON */}
                      {ep.bodyParams && ep.bodyParams.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileJson size={14} className="text-primary" />
                            Cuerpo de la Petición (Request Body JSON)
                          </h5>
                          <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border text-[10px] uppercase">
                                <tr>
                                  <th className="p-2.5">Campo</th>
                                  <th className="p-2.5">Tipo</th>
                                  <th className="p-2.5">Requerido</th>
                                  <th className="p-2.5">Descripción</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                                {ep.bodyParams.map((param, i) => (
                                  <tr key={i} className="hover:bg-muted/30">
                                    <td className="p-2.5 font-bold text-primary">{param.name}</td>
                                    <td className="p-2.5 text-muted-foreground font-sans">{param.type}</td>
                                    <td className="p-2.5 font-sans">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${param.required ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                                        {param.required ? "Obligatorio" : "Opcional"}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-foreground font-sans">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Ejemplo de Código Generado */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal size={14} className="text-primary" />
                            Código de Ejemplo ({selectedLanguage.toUpperCase()})
                          </h5>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generateSnippet(ep, selectedLanguage), `snippet_${ep.id}`)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {copiedId === `snippet_${ep.id}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            <span>{copiedId === `snippet_${ep.id}` ? "¡Copiado!" : "Copiar código"}</span>
                          </button>
                        </div>
                        <pre className="bg-muted/80 p-3.5 rounded-2xl border border-border text-xs font-mono text-foreground overflow-x-auto custom-scrollbar">
                          <code>{generateSnippet(ep, selectedLanguage)}</code>
                        </pre>
                      </div>

                      {/* Ejemplo de Respuesta HTTP (JSON) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h5 className="text-[11px] font-extrabold text-foreground uppercase tracking-wider">
                              Respuesta Exitosa del Servidor
                            </h5>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {ep.sampleResponse.status} OK
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(JSON.stringify(ep.sampleResponse.data, null, 2), `res_${ep.id}`)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {copiedId === `res_${ep.id}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            <span>{copiedId === `res_${ep.id}` ? "¡Copiado!" : "Copiar JSON"}</span>
                          </button>
                        </div>
                        <pre className="bg-muted/80 p-3.5 rounded-2xl border border-border text-xs font-mono text-foreground overflow-x-auto custom-scrollbar">
                          <code>{JSON.stringify(ep.sampleResponse.data, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CARD INFORMATIVA DE WEBHOOKS & AUTOMATIZACIONES ── */}
      <div className="bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-black text-sm text-foreground flex items-center gap-2">
            <Zap size={18} className="text-blue-500" />
            Webhooks en Tiempo Real (Event-Driven)
          </h4>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Configura eventos automáticos para recibir notificaciones HTTP instantáneas cuando ocurran eventos como: <code className="text-primary font-bold">sale.created</code>, <code className="text-primary font-bold">stock.low</code>, <code className="text-primary font-bold">purchase.received</code> o <code className="text-primary font-bold">customer.created</code>.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20 whitespace-nowrap">
          Disponible para Integraciones REST
        </div>
      </div>

      {/* ── MODAL PARA GENERAR LLAVE API ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">

            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <KeyRound size={18} className="text-primary" />
                {createdKey ? "¡Llave API Generada con Éxito!" : "Configurar Nueva Llave API"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            {createdKey ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Copia este token de acceso ahora. Por motivos de seguridad corporativa, no volverá a mostrarse en texto plano:
                  </p>
                  <div className="mt-3 flex items-center justify-between bg-muted p-3.5 rounded-2xl border border-border">
                    <code className="text-xs font-mono text-primary font-bold break-all select-all text-left">
                      {createdKey}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdKey, "modal")}
                      className="ml-3 bg-primary text-primary-foreground font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                    >
                      {copiedId === "modal" ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === "modal" ? "Copiado" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl text-xs hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  Entendido y Guardado
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                {isSuperAdmin && companies.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                      Empresa Destinataria
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      required
                      className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name} (ID #{c.id})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Nombre Identificador de la Integración
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Ej. E-commerce Shopify, Sistema POS Externo, App Móvil"
                    required
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Matriz Granular de Permisos */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
                    Matriz de Permisos por Recurso
                  </label>

                  <div className="bg-muted/20 border border-border rounded-2xl p-3 divide-y divide-border/60 max-h-60 overflow-y-auto custom-scrollbar">
                    {RESOURCES.map((r) => {
                      const perm = permissions[r.id] || {};
                      return (
                        <div key={r.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">{r.label}</span>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap">
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.read}
                                onChange={(e) => handlePermissionChange(r.id, "read", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span>Consultar (GET)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.create}
                                onChange={(e) => handlePermissionChange(r.id, "create", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-blue-500 font-semibold">Crear (POST)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.update}
                                onChange={(e) => handlePermissionChange(r.id, "update", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-amber-500 font-semibold">Editar (PUT)</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                              <input
                                type="checkbox"
                                checked={!!perm.delete}
                                onChange={(e) => handlePermissionChange(r.id, "delete", e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-rose-500 font-semibold">Eliminar (DELETE)</span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:opacity-90 transition disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isCreating ? "Generando Token..." : "Generar Llave API"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: SOLICITUD DE ACTIVACIÓN DE APIS (ADMIN) ── */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Send size={16} />
                </div>
                <h3 className="font-extrabold text-base text-foreground">Solicitud de Activación de APIs</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Justificación de Uso & Plataformas Externas
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Describe detalladamente para qué requieres las APIs (ej. sincronizar inventario con Shopify, registrar pedidos desde un POS, integración con ERP externo, etc.).
                </p>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  required
                  placeholder="Ej. Requerimos las llaves API REST para conectar nuestra tienda online en WooCommerce y sincronizar el stock disponible de productos cada hora..."
                  className="w-full bg-muted/40 border border-border rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-primary resize-none"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Mínimo 15 caracteres</span>
                  <span>{justification.length} / 1000</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest || justification.trim().length < 15}
                  className="flex-1 py-2.5 bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs hover:bg-amber-600 transition disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isSubmittingRequest ? "Enviando Solicitud..." : "Enviar a Revisión"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: MOTIVO DE RECHAZO (SUPERADMIN) ── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <XCircle size={16} />
                </div>
                <h3 className="font-extrabold text-base text-foreground">Rechazar Solicitud de API</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider block">
                  Motivo de Rechazo (Opcional)
                </label>
                <textarea
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  rows={3}
                  placeholder="Ej. Justificación incompleta, requiere plan pago o especificación de IP fija..."
                  className="w-full bg-muted/40 border border-border rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted text-foreground font-bold rounded-xl text-xs hover:bg-muted/80 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 bg-rose-600 text-white font-extrabold rounded-xl text-xs hover:bg-rose-700 transition disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {isSubmittingReview ? "Procesando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
