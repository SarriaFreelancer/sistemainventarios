const fs = require('fs');

const files = [
  'app/dashboard/compras/cuentas-por-pagar/components/PurchasePaymentModal.tsx',
  'app/dashboard/compras/facturas/components/NewInvoiceModal.tsx',
  'app/dashboard/compras/ordenes/components/NewPurchaseOrderModal.tsx',
  'app/dashboard/compras/recepciones/components/NewReceiptModal.tsx',
  'app/dashboard/compras/requisiciones/components/NewRequisitionModal.tsx',
  'app/dashboard/compras/solicitudes/components/NewPurchaseRequestModal.tsx'
];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let text = fs.readFileSync(f, 'utf8');
  
  if (!text.includes('createPortal')) {
    text = text.replace(/import { useState } from "react";|import React, { useState } from "react";/, match => `${match}\nimport { createPortal } from "react-dom";`);
  }

  text = text.replace(/{isOpen && \(\s*<div className="fixed inset-0/g, '{isOpen && typeof document !== "undefined" && createPortal(\n        <div className="fixed inset-0');
  
  text = text.replace(/<\/div>\n\s*\)}/g, '</div>, document.body\n      )}');
  
  text = text.replace(/fixed inset-0 z-50/g, 'fixed inset-0 z-[9999]');

  fs.writeFileSync(f, text);
});
