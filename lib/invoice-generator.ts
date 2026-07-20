
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

export async function generateInvoiceMedia(sale: InvoiceData, format: 'png' | 'jpeg' | 'pdf', invoiceConfig?: any) {
  // Config parameters with fallbacks
  const config = {
    companyName: invoiceConfig?.companyName || 'GNS SARRIA TECH',
    nit: invoiceConfig?.nit || '',
    address: invoiceConfig?.address || '',
    phone: invoiceConfig?.phone || '',
    email: invoiceConfig?.email || '',
    website: invoiceConfig?.website || '',
    primaryColor: invoiceConfig?.primaryColor || '#b91c1c',
    secondaryColor: invoiceConfig?.secondaryColor || '#C5A059',
    logo: invoiceConfig?.logo || '',
    resolutionText: invoiceConfig?.resolutionText || '',
    footerText: invoiceConfig?.footerText || 'Documento equivalente de venta generado de forma electrónica.',
  };

  // Helper to load logo asynchronously
  const loadLogo = () => new Promise<HTMLImageElement | null>((resolve) => {
    if (!config.logo) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = config.logo;
  });

  const logoImg = await loadLogo();

  // Create virtual canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Header height estimation
  let headerHeight = 130;
  if (logoImg) {
    headerHeight += 70;
  }
  if (config.nit || config.address || config.phone || config.email || config.website) {
    headerHeight += 35;
  }

  // Premium dimensions (standard vertical flyer ratio)
  canvas.width = 840;
  const estimatedHeight = headerHeight + 250 + sale.details.length * 55 + 180;
  canvas.height = Math.max(1100, estimatedHeight);

  // Background and styling constants
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGradient.addColorStop(0, '#FCFBFD');
  bgGradient.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer custom borders using primary and secondary colors
  ctx.strokeStyle = config.secondaryColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
  
  ctx.strokeStyle = config.primaryColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Draw Header Logo / Text
  let yCursor = 55;

  if (logoImg) {
    const maxW = 140;
    const maxH = 65;
    let w = logoImg.width;
    let h = logoImg.height;
    if (w > maxW) {
      h = (maxW / w) * h;
      w = maxW;
    }
    if (h > maxH) {
      w = (maxH / h) * w;
      h = maxH;
    }
    ctx.drawImage(logoImg, (canvas.width - w) / 2, yCursor, w, h);
    yCursor += h + 20;
  } else {
    ctx.fillStyle = '#17121F';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(config.companyName.toUpperCase(), canvas.width / 2, yCursor + 25);
    yCursor += 50;
  }

  // Draw Subtitle / Contact lines
  ctx.textAlign = 'center';
  ctx.fillStyle = '#726A7A';
  ctx.font = '10px sans-serif';
  ctx.letterSpacing = '1px';

  const sublines: string[] = [];
  if (config.nit) sublines.push(`NIT: ${config.nit}`);
  if (config.address) sublines.push(config.address);
  if (config.phone) sublines.push(`Tel: ${config.phone}`);
  if (config.email) sublines.push(config.email);
  if (config.website) sublines.push(config.website);

  if (sublines.length > 0) {
    ctx.fillText(sublines.slice(0, 3).join('  |  '), canvas.width / 2, yCursor);
    yCursor += 15;
    if (sublines.length > 3) {
      ctx.fillText(sublines.slice(3).join('  |  '), canvas.width / 2, yCursor);
      yCursor += 15;
    }
  }

  // Invoice divider line using primary color
  ctx.strokeStyle = `${config.primaryColor}25`; // 15% opacity
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, yCursor + 10);
  ctx.lineTo(canvas.width - 40, yCursor + 10);
  ctx.stroke();
  yCursor += 25;

  // Invoice Number & Status banner
  ctx.textAlign = 'left';
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`FACTURA: ${sale.saleNumber}`, 45, yCursor + 15);

  ctx.textAlign = 'right';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = sale.status === 'COMPLETED' ? '#10B981' : '#EF4444';
  ctx.fillText(sale.status === 'COMPLETED' ? 'PAGADO' : 'PENDIENTE', canvas.width - 45, yCursor + 15);
  yCursor += 35;

  // Metadata Grid
  ctx.textAlign = 'left';
  ctx.fillStyle = '#726A7A';
  ctx.font = '11px sans-serif';

  const fmtDate = new Date(sale.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  ctx.fillText(`FECHA: ${fmtDate}`, 45, yCursor);
  ctx.fillText(`VENDEDOR: ${sale.user.name || 'Sistema'}`, 45, yCursor + 20);

  ctx.textAlign = 'right';
  ctx.fillText(`CLIENTE: ${sale.client || 'Consumidor Final'}`, canvas.width - 45, yCursor);
  ctx.fillText(`MÉTODO: ${sale.paymentMethod}`, canvas.width - 45, yCursor + 20);
  yCursor += 40;

  // Divider
  ctx.strokeStyle = `${config.secondaryColor}40`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, yCursor);
  ctx.lineTo(canvas.width - 40, yCursor);
  ctx.stroke();
  yCursor += 25;

  // Table Headers
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PRODUCTO', 45, yCursor);
  ctx.fillText('CANT', 430, yCursor);
  ctx.textAlign = 'right';
  ctx.fillText('PRECIO UNIT', 580, yCursor);
  ctx.fillText('DESC', 690, yCursor);
  ctx.fillText('TOTAL', canvas.width - 40, yCursor);

  // Table Header Line
  ctx.strokeStyle = config.primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, yCursor + 10);
  ctx.lineTo(canvas.width - 40, yCursor + 10);
  ctx.stroke();
  yCursor += 35;

  // Table Rows
  ctx.font = '12px sans-serif';
  
  sale.details.forEach(item => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#17121F';
    ctx.textAlign = 'left';
    const pName = item.product.name.length > 40 ? item.product.name.substring(0, 38) + '...' : item.product.name;
    ctx.fillText(pName, 45, yCursor);
    
    // Product code in secondary color
    ctx.font = '10px sans-serif';
    ctx.fillStyle = config.secondaryColor;
    ctx.fillText(item.product.code, 45, yCursor + 14);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#17121F';
    ctx.textAlign = 'left';
    ctx.fillText(`${item.quantity} u.`, 430, yCursor);
    
    ctx.textAlign = 'right';
    ctx.fillText(item.unitPrice.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), 580, yCursor);
    
    if (item.discount > 0) {
      ctx.fillStyle = '#EF4444';
      ctx.fillText(`-${item.discount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, 690, yCursor);
    } else {
      ctx.fillStyle = '#726A7A';
      ctx.fillText('—', 690, yCursor);
    }

    ctx.fillStyle = '#17121F';
    ctx.fillText(item.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 40, yCursor);

    yCursor += 50;
  });

  // Table Bottom Line
  ctx.strokeStyle = `${config.secondaryColor}40`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, yCursor);
  ctx.lineTo(canvas.width - 40, yCursor);
  ctx.stroke();
  yCursor += 30;

  // Calculations Panel
  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = '#726A7A';

  const subtotal = sale.details.reduce((s, d) => s + d.subtotal, 0);
  const productDiscounts = sale.details.reduce((s, d) => s + d.discount, 0);

  ctx.fillText('SUBTOTAL DETALLES:', 600, yCursor);
  ctx.fillStyle = '#17121F';
  ctx.fillText(subtotal.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 45, yCursor);

  if (productDiscounts > 0) {
    yCursor += 25;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#726A7A';
    ctx.fillText('DESCUENTOS PRODUCTOS:', 600, yCursor);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`-${productDiscounts.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, canvas.width - 45, yCursor);
  }

  if (sale.discount > 0) {
    yCursor += 25;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#726A7A';
    ctx.fillText('DESCUENTO GLOBAL:', 600, yCursor);
    ctx.fillStyle = '#EF4444';
    ctx.fillText(`-${sale.discount.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}`, canvas.width - 45, yCursor);
  }

  // Final Total Banner
  yCursor += 35;
  ctx.fillStyle = `${config.primaryColor}06`; // 6% opacity background
  ctx.fillRect(400, yCursor - 20, canvas.width - 440, 48);
  ctx.strokeStyle = config.primaryColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(400, yCursor - 20, canvas.width - 440, 48);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#17121F';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('TOTAL GENERAL:', 420, yCursor + 10);

  ctx.textAlign = 'right';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = config.primaryColor;
  ctx.fillText(sale.total.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }), canvas.width - 45, yCursor + 10);

  // Footer notes
  yCursor = canvas.height - 85;
  ctx.textAlign = 'center';
  ctx.fillStyle = config.primaryColor;
  ctx.font = 'italic 12px Georgia';
  ctx.fillText(config.companyName.toUpperCase(), canvas.width / 2, yCursor);

  if (config.resolutionText) {
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#17121F';
    ctx.fillText(config.resolutionText, canvas.width / 2, yCursor + 20);
    yCursor += 15;
  }

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#726A7A';
  ctx.fillText(config.footerText, canvas.width / 2, yCursor + 20);

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
    const { jsPDF } = await import('jspdf');
    const imgData = canvas.toDataURL('image/jpeg', 0.90);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
    pdf.save(`${fileName}.pdf`);
  }
}
