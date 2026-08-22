export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const fs = await import('fs');
    const path = await import('path');
    const { generateSqlInsert } = await import('./lib/sql-generator');

    // Ejecutar cada 5 minutos para revisar configuraciones de respaldos
    cron.schedule('*/5 * * * *', async () => {
      try {
        let prismaClient: any;
        try {
          prismaClient = (await import('./lib/prisma')).prisma;
        } catch {
          return;
        }
        if (!prismaClient) return;

        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMinute = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;
        const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Lunes, 7=Domingo

        const settings = await prismaClient.companySetting.findMany({
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

          const company = await prismaClient.company.findUnique({ where: { id: setting.companyId } });
          if (company) {
            sqlDump += generateSqlInsert('Company', [company]);
          }

          // Obtener datos de todas las tablas en paralelo para acelerar el backup
          const tableResults = await Promise.all(
            tenantTables.map(table =>
              (prismaClient as any)[table.charAt(0).toLowerCase() + table.slice(1)].findMany({
                where: { companyId: setting.companyId }
              })
            )
          );
          for (let i = 0; i < tenantTables.length; i++) {
            sqlDump += generateSqlInsert(tenantTables[i], tableResults[i]);
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

            // Notificar a los admins
            if (setting.enableNotifications) {
              const admins = await prismaClient.user.findMany({
                where: { companyId: setting.companyId, role: { name: 'ADMIN' } }
              });
              for (const admin of admins) {
                await prismaClient.notification.create({
                  data: {
                    userId: admin.id,
                    companyId: setting.companyId,
                    title: 'Respaldo Automático Exitoso',
                    message: `El respaldo de base de datos se ha completado correctamente y guardado en ${filePath}`,
                    type: 'SUCCESS'
                  }
                });
              }
            }
          } catch (err) {
            console.error(`[BACKUP ERROR] No se pudo guardar el archivo en la ruta: ${setting.backupPath}`, err);
            // Notificar a los admins sobre el error
            if (setting.enableNotifications) {
              const admins = await prismaClient.user.findMany({
                where: { companyId: setting.companyId, role: { name: 'ADMIN' } }
              });
              for (const admin of admins) {
                await prismaClient.notification.create({
                  data: {
                    userId: admin.id,
                    companyId: setting.companyId,
                    title: 'Error en Respaldo Automático',
                    message: `No se pudo guardar el archivo de respaldo en la ruta: ${setting.backupPath}. Verifica los permisos.`,
                    type: 'ERROR'
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('[BACKUP CRON ERROR]', error);
      }
    });

    console.log('[CRON] Tareas programadas de respaldo inicializadas.');
  }
}
