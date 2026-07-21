import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf-8');

// 1. Add Enums & Models to the END of the file
const newSchemaContent = `
enum PurchaseRequestStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  CANCELLED
}

enum PurchaseRequestPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum PurchaseQuotationStatus {
  DRAFT
  SENT
  RECEIVED
  SELECTED
  REJECTED
}

enum PurchaseReceiptStatus {
  PENDING
  PARTIAL
  COMPLETE
  CANCELLED
}

enum PurchaseInvoiceStatus {
  DRAFT
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

enum PayableStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum PurchasePaymentMethod {
  CASH
  TRANSFER
  CHECK
  CREDIT_CARD
  OTHER
}

enum PurchaseItemType {
  PRODUCT
  SERVICE
}

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

if (!schema.includes('PurchaseRequestStatus')) {
  schema += '\n' + newSchemaContent;
}

// Helper to inject fields before the closing brace of a model
function injectIntoModel(modelName, newFields) {
  const regex = new RegExp(\`model \${modelName} \\\{[\\\\s\\\\S]*?\\\}\`, 'g');
  schema = schema.replace(regex, (match) => {
    if (match.includes(newFields.trim().split('\\n')[0])) return match; // Avoid duplicates
    return match.replace(/\\\}$/, newFields + '\\n}');
  });
}

// 2. Update PurchaseOrder
injectIntoModel('PurchaseOrder', \`
  purchaseRequestId Int?
  purchaseRequest  PurchaseRequest?    @relation(fields: [purchaseRequestId], references: [id])
  quotationId      Int?
  quotation        PurchaseQuotation?  @relation(fields: [quotationId], references: [id])
  subtotal         Float               @default(0)
  taxAmount        Float               @default(0)
  notes            String?             @db.Text
  terms            String?             @db.Text
  receipts         PurchaseReceipt[]
  invoices         PurchaseInvoice[]\`);

// 3. Update PurchaseOrderLine
injectIntoModel('PurchaseOrderLine', \`
  description     String?
  itemType        PurchaseItemType @default(PRODUCT)
  taxRate         Float            @default(0)
  receivedQuantity Int             @default(0)\`);

// 4. Update Company
injectIntoModel('Company', \`
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
  purchasePayments PurchasePayment[]\`);

// 5. Update User
injectIntoModel('User', \`
  purchaseRequests PurchaseRequest[]
  purchaseApprovals PurchaseApproval[]\`);

fs.writeFileSync(schemaPath, schema, 'utf-8');
console.log('Schema updated successfully');
