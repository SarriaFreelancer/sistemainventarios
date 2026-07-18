import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateSqlInsert } from '@/lib/sql-generator';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'auto'; // 'auto', 'shared', 'dedicated'
    const targetCompanyId = searchParams.get('companyId');

    const userRole = session.user.role;
    const userCompanyId = session.user.companyId ? Number(session.user.companyId) : null;

    let backupCompanyId: number | null = null;
    let isFullSharedBackup = false;
    let isDedicatedBackup = false;

    if (userRole === 'SUPERADMIN') {
      if (type === 'shared') {
        isFullSharedBackup = true;
      } else if (type === 'dedicated' && targetCompanyId) {
        isDedicatedBackup = true;
        backupCompanyId = Number(targetCompanyId);
      } else {
        isFullSharedBackup = true;
      }
    } else if (userRole === 'ADMIN') {
      if (!userCompanyId) return new NextResponse('Forbidden: No Company ID', { status: 403 });
      backupCompanyId = userCompanyId;
    } else {
      return new NextResponse('Forbidden: Role not authorized for backups', { status: 403 });
    }

    // Definir qué tablas respaldar. Si es Full Shared, respaldamos TODO (incluyendo roles, módulos, etc).
    // Si es por companyId (Admin o Dedicada seleccionada por superadmin), filtramos por companyId.
    
    // Tablas globales (solo para Full Shared)
    const globalTables = ['Role', 'Module', 'RoleModule'];
    
    // Tablas de tenant (con companyId)
    const tenantTables = [
      'User', 'ProductGroup', 'Category', 'Supplier', 'Product', 
      'Customer', 'Opportunity', 'PurchaseOrder', 'PurchaseOrderLine', 
      'Expense', 'Sale', 'SaleDetail', 'AuditLog', 'LoginHistory', 
      'UserSession', 'Discount', 'Lead', 'Contact', 'Activity', 'Quote', 
      'InvoiceCounter', 'CompanySetting', 'CompanyModule'
    ];

    let sqlDump = `-- Respaldo de Base de Datos GNS SarriaTech\n`;
    sqlDump += `-- Generado el: ${new Date().toISOString()}\n`;
    sqlDump += `-- Tipo de Respaldo: ${isFullSharedBackup ? 'COMPLETA COMPARTIDA' : 'INQUILINO (ID: ' + backupCompanyId + ')'}\n\n`;

    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    if (isFullSharedBackup) {
      // Exportar Empresas Globales
      const companies = await prisma.company.findMany();
      sqlDump += generateSqlInsert('Company', companies);

      for (const table of globalTables) {
        const data = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].findMany();
        sqlDump += generateSqlInsert(table, data);
      }

      for (const table of tenantTables) {
        const data = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].findMany();
        sqlDump += generateSqlInsert(table, data);
      }
    } else {
      // Exportar solo la Empresa objetivo
      const company = await prisma.company.findUnique({ where: { id: backupCompanyId! } });
      if (company) {
        sqlDump += generateSqlInsert('Company', [company]);
      }

      for (const table of tenantTables) {
        const data = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].findMany({
          where: { companyId: backupCompanyId! }
        });
        sqlDump += generateSqlInsert(table, data);
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;

    const blob = new Blob([sqlDump], { type: 'text/plain' });
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="backup_${isFullSharedBackup ? 'shared_full' : 'tenant_' + backupCompanyId}_${new Date().toISOString().slice(0,10)}.sql"`,
      },
    });

  } catch (error) {
    console.error('Backup Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
