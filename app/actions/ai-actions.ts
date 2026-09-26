'use server';

import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getGroqClient, GROQ_DEFAULT_MODEL, GNS_AI_SYSTEM_PROMPT } from '@/lib/groq';

export interface BusinessMetrics {
  totalProducts: number;
  totalUnits: number;
  totalCostValue: number;
  totalSaleValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  outOfStockProducts: Array<{ name: string; code: string }>;
  lowStockProducts: Array<{ name: string; code: string; stock: number; minStock?: number | null }>;
  lowMarginProducts: Array<{ name: string; code: string; cost: number; salePrice: number; marginPercent: number }>;
  overstockedProducts: Array<{ name: string; code: string; stock: number; cost: number }>;
  totalKits: number;
  activeKits: number;
  completeKits: number;
  incompleteKits: number;
  recentSalesTotal: number;
  recentSalesCount: number;
  topSellingProducts: Array<{ name: string; quantitySold: number; totalSold: number }>;
  recentExpensesTotal: number;
}

/**
 * Recopila y sintetiza métricas clave en tiempo real del tenant activo
 */
export async function getTenantBusinessMetrics(): Promise<{ success: boolean; metrics?: BusinessMetrics; error?: string }> {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return { success: false, error: 'No autenticado' };
    }

    const companyId = await getSessionCompanyId();
    const whereTenant = companyId ? { companyId } : {};

    // 1. Obtener productos y existencias
    const products = await prisma.product.findMany({
      where: whereTenant,
      select: {
        id: true,
        code: true,
        name: true,
        unitCost: true,
        salePrice: true,
        quantityAvailable: true,
        type: true,
      },
    });

    let totalUnits = 0;
    let totalCostValue = 0;
    let totalSaleValue = 0;
    const outOfStockList: Array<{ name: string; code: string }> = [];
    const lowStockList: Array<{ name: string; code: string; stock: number; minStock?: number | null }> = [];
    const lowMarginList: Array<{ name: string; code: string; cost: number; salePrice: number; marginPercent: number }> = [];
    const overstockedList: Array<{ name: string; code: string; stock: number; cost: number }> = [];

    for (const p of products) {
      const stock = p.quantityAvailable || 0;
      const cost = Number(p.unitCost || 0);
      const price = Number(p.salePrice || 0);

      totalUnits += stock;
      totalCostValue += stock * cost;
      totalSaleValue += stock * price;

      if (stock <= 0) {
        outOfStockList.push({ name: p.name, code: p.code });
      } else if (stock <= 5) {
        lowStockList.push({ name: p.name, code: p.code, stock, minStock: 5 });
      }

      if (price > 0 && cost > 0) {
        const marginPercent = ((price - cost) / price) * 100;
        if (marginPercent < 20) {
          lowMarginList.push({ name: p.name, code: p.code, cost, salePrice: price, marginPercent });
        }
      }

      if (stock >= 20) {
        overstockedList.push({ name: p.name, code: p.code, stock, cost });
      }
    }

    // 2. Obtener Kits comerciales
    const combos = await prisma.combo.findMany({
      where: whereTenant,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, quantityAvailable: true } },
          },
        },
      },
    });

    let completeKitsCount = 0;
    let incompleteKitsCount = 0;

    for (const c of combos) {
      if (c.isActive && c.items.length > 0) {
        const possible = Math.min(
          ...c.items.map((it) => Math.floor((it.product?.quantityAvailable || 0) / (it.quantity || 1)))
        );
        if (possible > 0) {
          completeKitsCount += possible;
        } else {
          incompleteKitsCount++;
        }
      }
    }

    // 3. Ventas recientes (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentSales, recentSaleDetails, recentExpenses] = await Promise.all([
      prisma.sale.findMany({
        where: {
          ...whereTenant,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { total: true },
      }),
      prisma.saleDetail.findMany({
        where: {
          sale: {
            ...whereTenant,
            status: 'COMPLETED',
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        select: {
          quantity: true,
          total: true,
          product: { select: { name: true } },
          combo: { select: { name: true } },
        },
      }),
      prisma.expense.findMany({
        where: {
          ...whereTenant,
          date: { gte: thirtyDaysAgo },
        },
        select: { amount: true },
      }),
    ]);

    const recentSalesTotal = recentSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const recentExpensesTotal = recentExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Agrupar productos más vendidos
    const salesByItem: Record<string, { quantitySold: number; totalSold: number }> = {};
    for (const d of recentSaleDetails) {
      const name = d.product?.name || (d.combo ? `[KIT] ${d.combo.name}` : 'Artículo');
      if (!salesByItem[name]) salesByItem[name] = { quantitySold: 0, totalSold: 0 };
      salesByItem[name].quantitySold += d.quantity || 0;
      salesByItem[name].totalSold += Number(d.total || 0);
    }

    const topSellingProducts = Object.entries(salesByItem)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const metrics: BusinessMetrics = {
      totalProducts: products.length,
      totalUnits,
      totalCostValue,
      totalSaleValue,
      outOfStockCount: outOfStockList.length,
      lowStockCount: lowStockList.length,
      outOfStockProducts: outOfStockList.slice(0, 8),
      lowStockProducts: lowStockList.slice(0, 8),
      lowMarginProducts: lowMarginList.sort((a, b) => a.marginPercent - b.marginPercent).slice(0, 8),
      overstockedProducts: overstockedList.sort((a, b) => b.stock - a.stock).slice(0, 8),
      totalKits: combos.length,
      activeKits: combos.filter((c) => c.isActive).length,
      completeKits: completeKitsCount,
      incompleteKits: incompleteKitsCount,
      recentSalesTotal,
      recentSalesCount: recentSales.length,
      topSellingProducts,
      recentExpensesTotal,
    };

    return { success: true, metrics };
  } catch (error: any) {
    console.error('[GET_TENANT_METRICS_ERROR]', error);
    return { success: false, error: error.message || 'Error al obtener métricas del negocio.' };
  }
}

/**
 * Construye un resumen en texto del contexto del negocio para inyectar a Groq
 */
function buildBusinessContextPrompt(m: BusinessMetrics): string {
  const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('es-CO')} COP`;

  return `
[DATOS REALES DEL NEGOCIO (GNS SarriaTech - Tiempo Real)]:
- Total Productos en Catálogo: ${m.totalProducts}
- Unidades Físicas Totales en Stock: ${m.totalUnits}
- Valor del Inventario a Costo: ${fmtMoney(m.totalCostValue)}
- Valor del Inventario a Precio de Venta: ${fmtMoney(m.totalSaleValue)}
- Margen Bruto Potencial Global: ${m.totalSaleValue > 0 ? (((m.totalSaleValue - m.totalCostValue) / m.totalSaleValue) * 100).toFixed(1) : 0}%

ALERTAS DE INVENTARIO:
- Productos Agotados (Stock 0): ${m.outOfStockCount} ${m.outOfStockProducts.length > 0 ? `(${m.outOfStockProducts.map(p => p.name).join(', ')})` : ''}
- Productos con Stock Bajo / Crítico: ${m.lowStockCount} ${m.lowStockProducts.length > 0 ? `(${m.lowStockProducts.map(p => `${p.name}: ${p.stock}u`).join(', ')})` : ''}
- Productos con Mayor Stock (Posible Sobre-inventario): ${m.overstockedProducts.map(p => `${p.name}: ${p.stock}u`).join(', ') || 'Ninguno'}

ALERTAS DE MARGEN Y RENTABILIDAD:
- Productos con Margen Bajo (<20% o negativo): ${m.lowMarginProducts.length > 0 ? m.lowMarginProducts.map(p => `${p.name} (Costo: ${fmtMoney(p.cost)}, Venta: ${fmtMoney(p.salePrice)}, Margen: ${p.marginPercent.toFixed(1)}%)`).join(', ') : 'Todos tienen buen margen'}

MÓDULO DE KITS COMERCIALES:
- Total Kits: ${m.totalKits} (${m.activeKits} activos)
- Kits Disponibles para Armar: ${m.completeKits} kits armables
- Kits Incompletos / Sin Stock por producto limitante: ${m.incompleteKits} kits

DESEMPEÑO EN VENTAS (ÚLTIMOS 30 DÍAS):
- Ventas Totales Facturadas: ${fmtMoney(m.recentSalesTotal)} (${m.recentSalesCount} transacciones)
- Gastos Operativos Registrados: ${fmtMoney(m.recentExpensesTotal)}
- Balance Neto Operativo (Ventas - Gastos): ${fmtMoney(m.recentSalesTotal - m.recentExpensesTotal)}
- Top Productos Más Vendidos: ${m.topSellingProducts.map(p => `${p.name} (${p.quantitySold} u. vendidas)`).join(', ') || 'Sin ventas registradas'}
`.trim();
}

/**
 * Ejecuta una auditoría rápida de 1 clic con Groq LPU
 */
export async function runAiDiagnostic(type: 'stock' | 'margins' | 'kits' | 'general'): Promise<{
  success: boolean;
  analysis?: string;
  modelUsed?: string;
  error?: string;
}> {
  try {
    const metricsRes = await getTenantBusinessMetrics();
    if (!metricsRes.success || !metricsRes.metrics) {
      return { success: false, error: metricsRes.error || 'No se pudieron cargar los datos del inventario.' };
    }

    const context = buildBusinessContextPrompt(metricsRes.metrics);
    const groq = getGroqClient();

    let userPrompt = '';

    switch (type) {
      case 'stock':
        userPrompt = `
Por favor realiza una AUDITORÍA EXHAUSTIVA DE STOCK Y CONTROL DE INVENTARIO basada en mis datos reales:
1. Analiza los productos agotados y con stock bajo, priorizando el impacto comercial.
2. Identifica si hay productos con sobrestock que representan capital inmovilizado.
3. Proporciona un Plan de Reabastecimiento Urgente con cantidades sugeridas.
4. Entrega 3 estrategias para evitar quiebres de stock y rotar productos estancados.
Usa tablas o listas claras, formato Markdown y lenguaje empresarial accionable.
`.trim();
        break;

      case 'margins':
        userPrompt = `
Por favor realiza una AUDITORÍA DE COSTOS, PRECIOS Y MÁRGENES DE RENTABILIDAD basada en mis datos reales:
1. Revisa los productos con margen bajo o crítico detectados en el sistema.
2. Explica qué productos tienen precios desfasados respecto a su costo de adquisición.
3. Proporciona una tabla de Precios Sugeridos para alcanzar al menos un 35%-40% de margen saludable.
4. Consejos de negociación con proveedores o empaquetado para proteger la rentabilidad.
Usa tablas o listas claras, formato Markdown y cálculos precisos.
`.trim();
        break;

      case 'kits':
        userPrompt = `
Por favor actúa como Especialista en Estrategia de Kits y Promociones (Módulo Kits GNS) con mis datos reales:
1. Revisa mis kits actuales y el estado de disponibilidad según productos limitantes.
2. Analiza los productos con mayor stock disponible y PROPÓN 3 NUEVOS KITS COMERCIALES INNOVADORES (con Nombre atractivo, Componentes sugeridos, Descuento comercial sugerido y Precio final estimado).
3. Explica el impacto de estos kits en el aumento del Ticket Promedio del negocio.
4. Estrategia de exhibición y venta cruzada para el equipo de ventas / POS.
`.trim();
        break;

      case 'general':
      default:
        userPrompt = `
Por favor realiza un DIAGNÓSTICO EJECUTIVO 360° DEL ESTADO DEL NEGOCIO basado en todos mis datos reales de inventario, ventas, gastos y kits:
1. Resumen de la Salud Financiera y Comercial (Calificación de 1 a 10 con justificación).
2. Los 3 mayores Riesgos detectados (Fugas de capital, quiebres de stock o márgenes bajos).
3. Las 3 mayores Oportunidades de Crecimiento inmediato (Ventas, Kits, Clientes).
4. Plan de Acción Prioritario para esta semana (Paso 1, Paso 2, Paso 3).
Sé muy claro, inspirador, estratégico y profesional.
`.trim();
        break;
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: `${GNS_AI_SYSTEM_PROMPT}\n\n${context}` },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2500,
    });

    const analysis = completion.choices[0]?.message?.content || 'No se recibió respuesta del modelo.';

    return {
      success: true,
      analysis,
      modelUsed: completion.model || GROQ_DEFAULT_MODEL,
    };
  } catch (error: any) {
    console.error('[RUN_AI_DIAGNOSTIC_ERROR]', error);
    return { success: false, error: error.message || 'Error al comunicarse con el motor de IA Groq.' };
  }
}

/**
 * Chat interactivo con Groq con memoria conversacional y contexto de negocio en vivo
 */
export async function sendAiChatMessage(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  includeContext = true
): Promise<{
  success: boolean;
  message?: string;
  modelUsed?: string;
  error?: string;
}> {
  try {
    const groq = getGroqClient();

    let systemContent = GNS_AI_SYSTEM_PROMPT;

    if (includeContext) {
      const metricsRes = await getTenantBusinessMetrics();
      if (metricsRes.success && metricsRes.metrics) {
        systemContent += `\n\n${buildBusinessContextPrompt(metricsRes.metrics)}`;
      }
    }

    const cleanMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const completion = await groq.chat.completions.create({
      model: GROQ_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...cleanMessages,
      ],
      temperature: 0.6,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || 'No se generó respuesta.';

    return {
      success: true,
      message: reply,
      modelUsed: completion.model || GROQ_DEFAULT_MODEL,
    };
  } catch (error: any) {
    console.error('[SEND_AI_CHAT_ERROR]', error);
    return { success: false, error: error.message || 'Error en la consulta con Groq IA.' };
  }
}
