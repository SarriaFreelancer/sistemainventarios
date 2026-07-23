import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CompanyData {
  name: string;
  documentId?: string;
  email?: string;
  phone?: string;
}

export function generateInvoicePDF(sale: any, company: CompanyData = { name: 'GNS SarriaTech' }) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (company.documentId) doc.text(`NIT: ${company.documentId}`, 14, 26);
  if (company.email) doc.text(`Email: ${company.email}`, 14, 31);
  if (company.phone) doc.text(`Tel: ${company.phone}`, 14, 36);

  // Invoice Details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA DE VENTA', 130, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Factura: ${sale.saleNumber || 'N/A'}`, 130, 26);
  doc.text(`Fecha: ${new Date(sale.createdAt).toLocaleDateString()}`, 130, 31);
  doc.text(`Cliente: ${sale.client || 'Consumidor Final'}`, 130, 36);

  // Products Table
  const tableData = sale.details.map((item: any) => [
    item.product?.name || 'Producto Desconocido',
    item.quantity.toString(),
    `$${Number(item.unitPrice).toLocaleString('es-CO')}`,
    `$${(Number(item.unitPrice) * item.quantity).toLocaleString('es-CO')}`
  ]);

  (doc as any).autoTable({
    startY: 50,
    head: [['Producto / Servicio', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] }, // Violeta GNS
    styles: { fontSize: 10, cellPadding: 4 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(11);
  doc.text(`Subtotal: $${Number(sale.subtotal).toLocaleString('es-CO')}`, 130, finalY);
  if (Number(sale.discount) > 0) {
    doc.text(`Descuento: -$${Number(sale.discount).toLocaleString('es-CO')}`, 130, finalY + 7);
  }
  if (Number(sale.tax) > 0) {
    doc.text(`Impuestos: $${Number(sale.tax).toLocaleString('es-CO')}`, 130, finalY + 14);
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${Number(sale.total).toLocaleString('es-CO')}`, 130, finalY + (Number(sale.tax) > 0 ? 24 : 14));

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('¡Gracias por su compra!', 105, 280, { align: 'center' });

  // Download
  doc.save(`Factura_${sale.saleNumber || 'Venta'}.pdf`);
}


export function generatePayrollReceiptPDF(payrollDetail: any, payroll: any, company: CompanyData = { name: 'GNS SarriaTech' }) {
  const doc = new jsPDF();
  const emp = payrollDetail.employee;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 14, 20);
  
  doc.setFontSize(16);
  doc.text('COMPROBANTE DE PAGO DE NÓMINA', 14, 35);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${new Date(payroll.periodStart).toLocaleDateString()} al ${new Date(payroll.periodEnd).toLocaleDateString()}`, 14, 45);
  doc.text(`Fecha de Pago: ${payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'Pendiente'}`, 14, 52);

  // Employee Data
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 60, 180, 30, 3, 3, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Empleado', 20, 68);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre: ${emp.firstName} ${emp.lastName}`, 20, 76);
  doc.text(`Identificación: ${emp.documentId}`, 20, 84);
  
  doc.text(`Cargo: ${emp.position?.name || 'N/A'}`, 110, 76);
  doc.text(`Salario Base: $${Number(emp.position?.baseSalary || 0).toLocaleString('es-CO')}`, 110, 84);

  // Table Details
  const tableData = [
    ['Salario Base (Proporcional)', 'Ingreso', `$${Number(payrollDetail.baseSalary).toLocaleString('es-CO')}`]
  ];

  if (Number(payrollDetail.additions) > 0) {
    tableData.push(['Bonificaciones y Adiciones', 'Ingreso', `$${Number(payrollDetail.additions).toLocaleString('es-CO')}`]);
  }
  if (Number(payrollDetail.deductions) > 0) {
    tableData.push(['Deducciones (Salud, Pensión, etc.)', 'Egreso', `-$${Number(payrollDetail.deductions).toLocaleString('es-CO')}`]);
  }

  (doc as any).autoTable({
    startY: 100,
    head: [['Concepto', 'Tipo', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    styles: { fontSize: 10, cellPadding: 5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // Net Pay
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`NETO A PAGAR: $${Number(payrollDetail.netPay).toLocaleString('es-CO')}`, 14, finalY);

  // Signatures
  doc.setDrawColor(0);
  doc.line(20, finalY + 60, 80, finalY + 60);
  doc.line(120, finalY + 60, 180, finalY + 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma Empleador', 35, finalY + 66);
  doc.text('Firma Recibí Conforme', 130, finalY + 66);

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('Documento generado por GNS', 105, 280, { align: 'center' });

  // Download
  doc.save(`Comprobante_Nomina_${emp.documentId}.pdf`);
}
