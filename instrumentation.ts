export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const fs = await import('fs');
    const path = await import('path');
    const { generateSqlInsert } = await import('./lib/sql-generator');
    
    // Ejecutar cada minuto para revisar configuraciones de respaldos
    cron.schedule('* * * * *', async () => {
      try {
        const { prisma } = await import('./lib/prisma');
        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMinute = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Lunes, 7=Domingo

        const settings = await prisma.companySetting.findMany({
          where: {
            OR: [
              { backupFrequency: 'DAILY', backupTime: currentTime },
              { backupFrequency: 'WEEKLY', backupTime: currentTime, backupDay: currentDay }
            ]
          }
        });

        for (const setting of settings) {
          if (!setting.backupPath) continue;

          console.log(`[BACKUP] Generando respaldo automático para la empresa ${setting.companyId}...`);
          
          const tenantTables = [
            'User', 'ProductGroup', 'Category', 'Supplier', 'Product', 
            'Customer', 'Opportunity', 'PurchaseOrder', 'PurchaseOrderLine', 
            'Expense', 'Sale', 'SaleDetail', 'AuditLog', 'LoginHistory', 
            'UserSession', 'Discount', 'Lead', 'Contact', 'Activity', 'Quote', 
            'InvoiceCounter', 'CompanySetting', 'CompanyModule'
          ];
          
          let sqlDump = `-- Respaldo de Base de Datos GNS SarriaTech\n`;
          sqlDump += `-- Generado el: ${new Date().toISOString()}\n`;
          sqlDump += `-- Tipo de Respaldo: INQUILINO AUTOMÁTICO (ID: ${setting.companyId})\n\n`;
          sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
          
          const company = await prisma.company.findUnique({ where: { id: setting.companyId } });
          if (company) {
            sqlDump += generateSqlInsert('Company', [company]);
          }

          for (const table of tenantTables) {
            const data = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].findMany({
              where: { companyId: setting.companyId }
            });
            sqlDump += generateSqlInsert(table, data);
          }

          sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;

          const fileName = `backup_tenant_${setting.companyId}_${new Date().toISOString().slice(0,10).replace(/-/g, '')}_${currentHour}${currentMinute}.sql`;
          const filePath = path.join(setting.backupPath, fileName);
          
          try {
            // Asegurarse de que el directorio existe
            if (!fs.existsSync(setting.backupPath)) {
              fs.mkdirSync(setting.backupPath, { recursive: true });
            }
            fs.writeFileSync(filePath, sqlDump, 'utf8');
            console.log(`[BACKUP] Respaldo guardado exitosamente en: ${filePath}`);
          } catch (err) {
            console.error(`[BACKUP ERROR] No se pudo guardar el archivo en la ruta: ${setting.backupPath}`, err);
          }
        }
      } catch (error) {
        console.error('[BACKUP CRON ERROR]', error);
      }
    });
    
    console.log('[CRON] Tareas programadas de respaldo inicializadas.');
  }
}
