import * as fs from 'fs';
import * as path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Replace PurchaseItemType
const oldPurchaseItemType = "enum PurchaseItemType {\n  PRODUCT\n  SERVICE\n}";

const newPurchaseItemType = "enum PurchaseItemType {\n  MATERIA_PRIMA\n  PRODUCTO_VENTA\n  SERVICIO\n  ACTIVO_FIJO\n  INSUMO\n  PAPELERIA\n  GASTO_ADMINISTRATIVO\n  OTROS\n}";

schema = schema.replace(oldPurchaseItemType, newPurchaseItemType);

// 2. Add deletedAt to purchase models
const modelsToUpdate = [
  'PurchaseRequest',
  'PurchaseRequestItem',
  'PurchaseApprovalConfig',
  'PurchaseApproval',
  'PurchaseQuotation',
  'PurchaseQuotationItem',
  'PurchaseOrder',
  'PurchaseOrderLine',
  'PurchaseReceipt',
  'PurchaseReceiptItem',
  'PurchaseInvoice',
  'AccountsPayable',
  'PurchasePayment'
];

for (const model of modelsToUpdate) {
  const regex = new RegExp("model " + model + " \\{[^}]+\\}", "g");
  schema = schema.replace(regex, (match) => {
    if (match.includes('deletedAt')) return match;
    return match.replace(/\\}$/, '  deletedAt DateTime?\n}');
  });
}

// 3. Append InternalRequisition models and enums if they don't exist
if (!schema.includes('enum InternalRequisitionStatus')) {
  schema += "\n\n" +
"enum InternalRequisitionStatus {\n" +
"  DRAFT\n" +
"  PENDING_BOSS\n" +
"  APPROVED\n" +
"  REJECTED\n" +
"  CONVERTED_TO_PURCHASE\n" +
"  CANCELLED\n" +
"}\n\n" +
"model InternalRequisition {\n" +
"  id              Int                       @id @default(autoincrement())\n" +
"  requisitionNum  String                    @unique\n" +
"  status          InternalRequisitionStatus @default(DRAFT)\n" +
"  priority        PurchaseRequestPriority   @default(MEDIUM)\n" +
"  userId          Int\n" +
"  user            User                      @relation(fields: [userId], references: [id])\n" +
"  companyId       Int?\n" +
"  company         Company?                  @relation(fields: [companyId], references: [id])\n" +
"  notes           String?                   @db.Text\n" +
"  createdAt       DateTime                  @default(now())\n" +
"  updatedAt       DateTime                  @updatedAt\n" +
"  deletedAt       DateTime?\n" +
"  items           InternalRequisitionItem[]\n" +
"  \n" +
"  @@index([companyId])\n" +
"  @@index([userId])\n" +
"}\n\n" +
"model InternalRequisitionItem {\n" +
"  id                    Int                 @id @default(autoincrement())\n" +
"  internalRequisitionId Int\n" +
"  internalRequisition   InternalRequisition @relation(fields: [internalRequisitionId], references: [id], onDelete: Cascade)\n" +
"  productId             Int?\n" +
"  product               Product?            @relation(fields: [productId], references: [id])\n" +
"  description           String?\n" +
"  quantity              Int                 @default(1)\n" +
"  unit                  String?             @default(\"UN\")\n" +
"  itemType              PurchaseItemType    @default(PRODUCTO_VENTA)\n" +
"  notes                 String?             @db.Text\n" +
"  companyId             Int?\n" +
"  company               Company?            @relation(fields: [companyId], references: [id])\n" +
"  deletedAt             DateTime?\n\n" +
"  @@index([internalRequisitionId])\n" +
"  @@index([productId])\n" +
"  @@index([companyId])\n" +
"}\n";
}

// Ensure User and Company have the relations
if (!schema.includes('internalRequisitions InternalRequisition[]')) {
  schema = schema.replace(
    /model User \{[^}]+\}/,
    (match) => match.replace(/\}$/, '  internalRequisitions InternalRequisition[]\n}')
  );
  
  schema = schema.replace(
    /model Company \{[^}]+\}/,
    (match) => match.replace(/\}$/, '  internalRequisitions InternalRequisition[]\n  internalRequisitionItems InternalRequisitionItem[]\n}')
  );
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully!');

// Ensure User and Company have the relations
if (!schema.includes('internalRequisitions InternalRequisition[]')) {
  schema = schema.replace(
    /model User \{[^}]+\}/,
    (match) => match.replace(/\}$/, '  internalRequisitions InternalRequisition[]\n}')
  );
  
  schema = schema.replace(
    /model Company \{[^}]+\}/,
    (match) => match.replace(/\}$/, '  internalRequisitions InternalRequisition[]\n  internalRequisitionItems InternalRequisitionItem[]\n}')
  );
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema updated successfully!');
