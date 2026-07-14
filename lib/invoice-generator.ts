import { jsPDF } from 'jspdf';

interface InvoiceDetail {
  product: { name: string; code: string };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  total: number;
}

interface InvoiceData {
  saleNumber: string;
  client: string | null;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  remarks: string | null;
  createdAt: string;
  user: { name: string | null };
  details: InvoiceDetail[];
}

export async function generateInvoiceMedia(sale: InvoiceData, format: 'png' | 'jpeg' | 'pdf') {
  // Create virtual canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Premium dimensions (standard vertical flyer ratio)
  canvas.width = 840;
  const estimatedHeight = 400 + sale.details.length * 55;
  canvas.height = Math.max(1100, estimatedHeight);

  // Background and styling constants
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#FAF7FC');
  bgGradient.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer gold rose border
  ctx.strokeStyle = '#D8C1EC';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
  ctx.strokeStyle = '#B18ACF';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Header Logo / Text
  ctx.fillStyle = '#17121F';
  ctx.textAlign = 'center';

  // "DULCHE DORELLE" brand text
  ctx.font = 'bold 32px serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('DULCHE DORELLE', canvas.width / 2, 75);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#B18ACF';
  ctx.letterSpacing = '4px';
  ctx.fillText('MAISON DE BEAUTÉ · PREMIUM ERP', canvas.width / 2, 95);

  // Invoice divider line
  ctx.strokeStyle = '#EAE1F4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 115);
  ctx.lineTo(canvas.width - 40, 115);
  ctx.stroke();

  // Invoice Number & Status banner
  ctx.textAlign = 'left';
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`FACTURA: ${sale.saleNumber}`, 45, 145);

  ctx.textAlign = 'right';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = sale.status === 'COMPLETED' ? '#10B981' : '#EF4444';
  ctx.fillText(sale.status.toUpperCase(), canvas.width - 45, 145);

  // Metadata Grid
  ctx.textAlign = 'left';
  ctx.fillStyle = '#726A7A';
  ctx.font = '11px sans-serif';

  const fmtDate = new Date(sale.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  ctx.fillText(`FECHA: ${fmtDate}`, 45, 180);
  ctx.fillText(`VENDEDOR: ${sale.user.name || 'Sistema'}`, 45, 200);

  ctx.textAlign = 'right';
  ctx.fillText(`CLIENTE: ${sale.client || 'Consumidor Final'}`, canvas.width - 45, 180);
  ctx.fillText(`PAGO: ${sale.paymentMethod}`, canvas.width - 45, 200);

  // Divider
  ctx.strokeStyle = '#D8C1EC';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 220);
  ctx.lineTo(canvas.width - 40, 220);
  ctx.stroke();

  // Table Headers
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PRODUCTO', 45, 245);
  ctx.fillText('CANT', 430, 245);
  ctx.textAlign = 'right';
  ctx.fillText('PRECIO UNIT', 580, 245);
  ctx.fillText('DESC', 690, 245);
  ctx.fillText('TOTAL', canvas.width - 40, 245);

  // Table Header Line
  ctx.strokeStyle = '#17121F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 255);
  ctx.lineTo(canvas.width - 40, 255);
  ctx.stroke();

  // Table Rows
  let y = 280;
  ctx.font = '12px sans-serif';
  
  sale.details.forEach(item => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#17121F';
    ctx.textAlign = 'left';
    // Clean name
    const pName = item.product.name.length > 40 ? item.product.name.substring(0, 38) + '...' : item.product.name;
    ctx.fillText(pName, 45, y);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#B18ACF';
    ctx.fillText(item.product.code, 45, y + 14);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#17121F';
    // Quantity - left aligned under CANT header
    ctx.textAlign = 'left';
    ctx.fillText(`${item.quantity} u.`, 430, y);
    
    ctx.textAlign = 'right';
    // Price - right-aligned to x=580
    ctx.fillText(item.unitPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), 580, y);
    
    // Discount - right-aligned to x=690
    if (item.discount > 0) {
      ctx.fillStyle = '#EF4444';
      ctx.fillText(`-${item.discount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, 690, y);
    } else {
      ctx.fillStyle = '#726A7A';
      ctx.fillText('—', 690, y);
    }

    // Total - right-aligned to right edge
    ctx.fillStyle = '#17121F';
    ctx.fillText(item.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 40, y);

    y += 50;
  });

  // Table Bottom Line
  ctx.strokeStyle = '#D8C1EC';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(canvas.width - 40, y);
  ctx.stroke();

  // Calculations Panel
  y += 30;
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#726A7A';

  const subtotal = sale.details.reduce((s, d) => s + d.subtotal, 0);
  const totalItemDiscounts = sale.details.reduce((s, d) => s + d.discount, 0);
  const productDiscounts = totalItemDiscounts - sale.discount;

  ctx.fillText('SUBTOTAL DETALLES:', 600, y);
  ctx.fillStyle = '#17121F';
  ctx.fillText(subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 45, y);

  if (productDiscounts > 0) {
    y += 25;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#726A7A';
    ctx.fillText('DESCUENTOS PRODUCTOS:', 600, y);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`-${productDiscounts.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, canvas.width - 45, y);
  }

  if (sale.discount > 0) {
    y += 25;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#726A7A';
    ctx.fillText('DESCUENTO GLOBAL:', 600, y);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`-${sale.discount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, canvas.width - 45, y);
  }

  // Final Total Banner
  y += 35;
  ctx.fillStyle = '#FAF7FC';
  ctx.fillRect(400, y - 20, canvas.width - 440, 45);
  ctx.strokeStyle = '#B18ACF';
  ctx.strokeRect(400, y - 20, canvas.width - 440, 45);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('TOTAL GENERAL:', 420, y + 8);

  ctx.textAlign = 'right';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#8B5CF6';
  ctx.fillText(sale.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 45, y + 8);

  // Footer notes
  ctx.textAlign = 'center';
  ctx.fillStyle = '#B18ACF';
  ctx.font = 'italic 11px Georgia';
  ctx.fillText('Gracias por elegir la distinción de Dulche Dorelle', canvas.width / 2, canvas.height - 75);

  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#726A7A';
  ctx.fillText('Documento equivalente de venta generado de forma electrónica.', canvas.width / 2, canvas.height - 55);

  // Trigger download according to format
  const fileName = `factura_${sale.saleNumber}`;
  if (format === 'png') {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } else if (format === 'jpeg') {
    const link = document.createElement('a');
    link.download = `${fileName}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  } else if (format === 'pdf') {
    const imgData = canvas.toDataURL('image/jpeg', 0.90);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
    pdf.save(`${fileName}.pdf`);
  }
}
