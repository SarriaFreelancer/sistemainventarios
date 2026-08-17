import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  columns: { header: string; dataKey: string }[];
  data: Record<string, any>[];
  companyName?: string;
}

export function generatePdfReport({
  title,
  subtitle,
  filename,
  columns,
  data,
  companyName = 'GNS Gestión de Negocios SarriaTech',
}: PdfReportOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header background band
  doc.setFillColor(139, 92, 246); // Primary purple
  doc.rect(0, 0, 297, 22, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 14);

  // Subtitle / Date right aligned
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const nowStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`${companyName}  |  ${nowStr}`, 283, 14, { align: 'right' });

  // Subtitle info below header band
  let startY = 28;
  if (subtitle) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9.5);
    doc.text(subtitle, 14, startY);
    startY += 6;
  }

  // AutoTable Data Render
  autoTable(doc, {
    startY,
    head: [columns.map(c => c.header)],
    body: data.map(row => columns.map(c => {
      const val = row[c.dataKey];
      if (val === null || val === undefined || val === '') return '—';
      if (typeof val === 'number') {
        // Format currency or quantities nicely
        return val.toLocaleString('es-CO');
      }
      return String(val);
    })),
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [51, 65, 85], // Slate 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    margin: { top: 25, right: 14, bottom: 15, left: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${data.pageNumber} de ${totalPages}`,
        283,
        202,
        { align: 'right' }
      );
    },
  });

  const pdfFilename = filename.endsWith('.pdf') ? filename : filename.replace(/\.xlsx$/, '.pdf');
  doc.save(pdfFilename);
}
