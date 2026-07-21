import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// 1. Add Enums
const enumsToAdd = `
enum PurchaseRequestStatus { DRAFT\n  PENDING_APPROVAL\n  APPROVED\n  REJECTED\n  CANCELLED }
enum PurchaseRequestPriority { LOW\n  MEDIUM\n  HIGH\n  URGENT }
enum PurchaseQuotationStatus { DRAFT\n  SENT\n  RECEIVED\n  SELECTED\n  REJECTED }
enum PurchaseReceiptStatus { PENDING\n  PARTIAL\n  COMPLETE\n  CANCELLED }
enum PurchaseInvoiceStatus { DRAFT\n  PENDING\n  PARTIALLY_PAID\n  PAID\n  OVERDUE\n  CANCELLED }
enum PayableStatus { PENDING\n  PARTIAL\n  PAID\n  OVERDUE\n  CANCELLED }
enum PurchasePaymentMethod { CASH\n  TRANSFER\n  CHECK\n  CREDIT_CARD\n  OTHER }
enum PurchaseItemType { PRODUCT\n  SERVICE }
`;
if (!schema.includes('PurchaseRequestStatus')) {
  schema = schema.replace('model Customer', enumsToAdd + '\nmodel Customer');
}

// 2. Add New Models
const modelsToAdd = `
model PurchaseRequest {
  id           Int                   @id @default(autoincrement())
  requestNumber String               @unique
  status       PurchaseRequestStatus @default(DRAFT)
  priority     PurchaseRequestPriority @default(MEDIUM)
  userId       Int
  user         User                  @relation(fields: [userId], references: [id])
  companyId    Int?
  company      Company?              @relation(fields: [companyId], references: [id])
  createdAt    DateTime              @default(now())
  updatedAt    DateTime              @updatedAt
  items        PurchaseRequestItem[]
  approvals    PurchaseApproval[]
  quotations   PurchaseQuotation[]
  orders       PurchaseOrder[]
}

model PurchaseRequestItem {
  id                Int             @id @default(autoincrement())
  purchaseRequestId Int
  purchaseRequest   PurchaseRequest @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)
  productId         Int?
  product           Product?        @relation(fields: [productId], references: [id])
  description       String?
  quantity          Int             @default(1)
  itemType          PurchaseItemType @default(PRODUCT)
  companyId         Int?
  company           Company?        @relation(fields: [companyId], references: [id])
}

model PurchaseApprovalConfig {
  id             Int      @id @default(autoincrement())
  companyId      Int      @unique
  company        Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  requireApproval Boolean @default(true)
  levels         Int      @default(1)
}

model PurchaseApproval {
  id                Int             @id @default(autoincrement())
  purchaseRequestId Int
  purchaseRequest   PurchaseRequest @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)
  userId            Int
  user              User            @relation(fields: [userId], references: [id])
  level             Int             @default(1)
  status            String          @default("APPROVED")
  comments          String?
  companyId         Int?
  company           Company?        @relation(fields: [companyId], references: [id])
  createdAt         DateTime        @default(now())
}

model PurchaseQuotation {
  id                Int                     @id @default(autoincrement())
  quotationNumber   String                  @unique
  purchaseRequestId Int
  purchaseRequest   PurchaseRequest         @relation(fields: [purchaseRequestId], references: [id], onDelete: Cascade)
  supplierId        Int
  supplier          Supplier                @relation(fields: [supplierId], references: [id])
  status            PurchaseQuotationStatus @default(DRAFT)
  total             Float                   @default(0)
  companyId         Int?
  company           Company?                @relation(fields: [companyId], references: [id])
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  items             PurchaseQuotationItem[]
  orders            PurchaseOrder[]
}

model PurchaseQuotationItem {
  id                  Int               @id @default(autoincrement())
  purchaseQuotationId Int
  purchaseQuotation   PurchaseQuotation @relation(fields: [purchaseQuotationId], references: [id], onDelete: Cascade)
  productId           Int?
  product             Product?          @relation(fields: [productId], references: [id])
  description         String?
  quantity            Int               @default(1)
  unitPrice           Float             @default(0)
  total               Float             @default(0)
  itemType            PurchaseItemType  @default(PRODUCT)
  companyId           Int?
  company             Company?          @relation(fields: [companyId], references: [id])
}

model PurchaseReceipt {
  id              Int                   @id @default(autoincrement())
  receiptNumber   String                @unique
  purchaseOrderId Int
  purchaseOrder   PurchaseOrder         @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  status          PurchaseReceiptStatus @default(PENDING)
  receivedDate    DateTime              @default(now())
  companyId       Int?
  company         Company?              @relation(fields: [companyId], references: [id])
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  items           PurchaseReceiptItem[]
  inventoryEntries InventoryEntry[]
  invoices        PurchaseInvoice[]
}

model PurchaseReceiptItem {
  id                Int             @id @default(autoincrement())
  purchaseReceiptId Int
  purchaseReceipt   PurchaseReceipt @relation(fields: [purchaseReceiptId], references: [id], onDelete: Cascade)
  productId         Int?
  product           Product?        @relation(fields: [productId], references: [id])
  quantityReceived  Int             @default(0)
  companyId         Int?
  company           Company?        @relation(fields: [companyId], references: [id])
}

model InventoryEntry {
  id                Int             @id @default(autoincrement())
  purchaseReceiptId Int
  purchaseReceipt   PurchaseReceipt @relation(fields: [purchaseReceiptId], references: [id], onDelete: Cascade)
  entryDate         DateTime        @default(now())
  companyId         Int?
  company           Company?        @relation(fields: [companyId], references: [id])
  items             InventoryEntryItem[]
}

model InventoryEntryItem {
  id               Int            @id @default(autoincrement())
  inventoryEntryId Int
  inventoryEntry   InventoryEntry @relation(fields: [inventoryEntryId], references: [id], onDelete: Cascade)
  productId        Int
  product          Product        @relation(fields: [productId], references: [id])
  quantityAdded    Int            @default(0)
  companyId        Int?
  company          Company?       @relation(fields: [companyId], references: [id])
}

model PurchaseInvoice {
  id                Int                   @id @default(autoincrement())
  invoiceNumber     String
  purchaseOrderId   Int
  purchaseOrder     PurchaseOrder         @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  purchaseReceiptId Int?
  purchaseReceipt   PurchaseReceipt?      @relation(fields: [purchaseReceiptId], references: [id])
  supplierId        Int
  supplier          Supplier              @relation(fields: [supplierId], references: [id])
  status            PurchaseInvoiceStatus @default(DRAFT)
  subtotal          Float                 @default(0)
  taxAmount         Float                 @default(0)
  total             Float                 @default(0)
  issueDate         DateTime              @default(now())
  dueDate           DateTime?
  companyId         Int?
  company           Company?              @relation(fields: [companyId], references: [id])
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  payables          AccountsPayable[]
}

model AccountsPayable {
  id                Int             @id @default(autoincrement())
  purchaseInvoiceId Int
  purchaseInvoice   PurchaseInvoice @relation(fields: [purchaseInvoiceId], references: [id], onDelete: Cascade)
  amount            Float           @default(0)
  paidAmount        Float           @default(0)
  status            PayableStatus   @default(PENDING)
  dueDate           DateTime
  companyId         Int?
  company           Company?        @relation(fields: [companyId], references: [id])
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  payments          PurchasePayment[]
}

model PurchasePayment {
  id                Int                   @id @default(autoincrement())
  accountsPayableId Int
  accountsPayable   AccountsPayable       @relation(fields: [accountsPayableId], references: [id], onDelete: Cascade)
  amount            Float
  paymentDate       DateTime              @default(now())
  paymentMethod     PurchasePaymentMethod @default(TRANSFER)
  reference         String?
  companyId         Int?
  company           Company?              @relation(fields: [companyId], references: [id])
  createdAt         DateTime              @default(now())
}
`;
if (!schema.includes('model PurchaseRequest')) {
  schema += '\n' + modelsToAdd;
}

// 3. Update PurchaseOrder
schema = schema.replace(
  '  supplier         Supplier            @relation(fields: [supplierId], references: [id])\n  lines            PurchaseOrderLine[]',
  `  supplier         Supplier            @relation(fields: [supplierId], references: [id])
  lines            PurchaseOrderLine[]
  purchaseRequestId Int?
  purchaseRequest  PurchaseRequest?    @relation(fields: [purchaseRequestId], references: [id])
  quotationId      Int?
  quotation        PurchaseQuotation?  @relation(fields: [quotationId], references: [id])
  subtotal         Float               @default(0)
  taxAmount        Float               @default(0)
  notes            String?             @db.Text
  terms            String?             @db.Text
  receipts         PurchaseReceipt[]
  invoices         PurchaseInvoice[]`
);

// 4. Update PurchaseOrderLine
schema = schema.replace(
  '  product         Product?      @relation(fields: [productId], references: [id])',
  `  product         Product?      @relation(fields: [productId], references: [id])
  description     String?
  itemType        PurchaseItemType @default(PRODUCT)
  taxRate         Float            @default(0)
  receivedQuantity Int             @default(0)`
);

// 5. Update Company for relations
const companyRelations = `
  purchaseRequests PurchaseRequest[]
  purchaseRequestItems PurchaseRequestItem[]
  purchaseApprovalConfigs PurchaseApprovalConfig[]
  purchaseApprovals PurchaseApproval[]
  purchaseQuotations PurchaseQuotation[]
  purchaseQuotationItems PurchaseQuotationItem[]
  purchaseReceipts PurchaseReceipt[]
  purchaseReceiptItems PurchaseReceiptItem[]
  inventoryEntries InventoryEntry[]
  inventoryEntryItems InventoryEntryItem[]
  purchaseInvoices PurchaseInvoice[]
  accountsPayables AccountsPayable[]
  purchasePayments PurchasePayment[]
`;
if (!schema.includes('purchaseRequests PurchaseRequest[]')) {
  schema = schema.replace('  invoiceCounters    InvoiceCounter[]', '  invoiceCounters    InvoiceCounter[]\n' + companyRelations);
}

// 6. Update User for relations
if (!schema.includes('purchaseRequests PurchaseRequest[]')) {
  schema = schema.replace('  notifications   Notification[]', '  notifications   Notification[]\n  purchaseRequests PurchaseRequest[]\n  purchaseApprovals PurchaseApproval[]');
}

fs.writeFileSync(schemaPath, schema, 'utf-8');
console.log('Schema updated successfully');
