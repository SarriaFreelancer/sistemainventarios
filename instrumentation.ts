export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = await import('node-cron');
    const fs = await import('fs');
    const path = await import('path');
    const { generateSqlInsert } = await import('./lib/sql-generator');

    // Helper para obtener la hora (HH:mm) y día de la semana (1=Lunes ... 7=Domingo) en la zona horaria de la empresa
    function getCompanyCurrentTimeAndDay(timezone?: string | null) {
      const targetTz = timezone && timezone.trim() ? timezone.trim() : 'America/Bogota';
      const now = new Date();
      try {
        const dtf = new Intl.DateTimeFormat('en-US', {
          timeZone: targetTz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'short'
        });
        const parts = dtf.formatToParts(now);
        const h = parts.find(p => p.type === 'hour')?.value.padStart(2, '0') || '00';
        const m = parts.find(p => p.type === 'minute')?.value.padStart(2, '0') || '00';
        const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
        const dayName = parts.find(p => p.type === 'weekday')?.value || 'Mon';
        return {
          currentTime: `${h}:${m}`,
          currentDay: dayMap[dayName] || 1,
          stamp: `${h}${m}`
        };
      } catch (e) {
        // Fallback si la timezone es inválida
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const currentDay = now.getDay() === 0 ? 7 : now.getDay();
        return {
          currentTime: `${h}:${m}`,
          currentDay,
          stamp: `${h}${m}`
        };
      }
    }

    // Ejecutar cada minuto para revisar configuraciones de respaldos
    cron.schedule('* * * * *', async () => {
      try {
        let prismaClient: any;
        try {
          prismaClient = (await import('./lib/prisma')).prisma;
        } catch {
          return;
        }
        if (!prismaClient) return;

        // Obtener todas las configuraciones con respaldos automáticos
        const allAutoSettings = await prismaClient.companySetting.findMany({
          where: {
            backupFrequency: { in: ['DAILY', 'WEEKLY'] }
          }
        });

        for (const setting of allAutoSettings) {
          const { currentTime, currentDay, stamp } = getCompanyCurrentTimeAndDay(setting.timezone);

          const isDailyMatch = setting.backupFrequency === 'DAILY' && setting.backupTime === currentTime;
          const isWeeklyMatch = setting.backupFrequency === 'WEEKLY' && setting.backupTime === currentTime && Number(setting.backupDay) === currentDay;

          if (!isDailyMatch && !isWeeklyMatch) {
            continue;
          }

          console.log(`[BACKUP] Generando respaldo automático para la empresa ${setting.companyId} (Hora local: ${currentTime}, Día: ${currentDay})...`);

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

          // Obtener datos de todas las tablas en paralelo
          const tableResults = await Promise.all(
            tenantTables.map(table => {
              const modelKey = table.charAt(0).toLowerCase() + table.slice(1);
              const model = (prismaClient as any)[modelKey];
              if (model && typeof model.findMany === 'function') {
                return model.findMany({ where: { companyId: setting.companyId } });
              }
              return Promise.resolve([]);
            })
          );

          for (let i = 0; i < tenantTables.length; i++) {
            sqlDump += generateSqlInsert(tenantTables[i], tableResults[i]);
          }

          sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;

          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const fileName = `backup_tenant_${setting.companyId}_${dateStr}_${stamp}.sql`;

          // Resolver carpeta de guardado con fallback seguro
          let targetDir = setting.backupPath && setting.backupPath.trim() ? setting.backupPath.trim() : path.join(process.cwd(), 'backups');

          try {
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
          } catch (dirErr) {
            // Si la ruta configurada falla (por ejemplo ruta de Windows en servidor Linux), usar fallback a ./backups
            console.warn(`[BACKUP WARN] No se pudo crear/acceder a la ruta '${targetDir}'. Usando carpeta local del servidor './backups'...`);
            targetDir = path.join(process.cwd(), 'backups');
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
          }

          const filePath = path.join(targetDir, fileName);

          try {
            fs.writeFileSync(filePath, sqlDump, 'utf8');
            console.log(`[BACKUP] Respaldo guardado exitosamente en: ${filePath}`);

            // Notificar a administradores y superadmins de la empresa
            if (setting.enableNotifications) {
              const companyAdmins = await prismaClient.user.findMany({
                where: {
                  OR: [
                    { companyId: setting.companyId, role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
                    { role: { name: 'SUPERADMIN' } }
                  ]
                }
              });

              for (const admin of companyAdmins) {
                await prismaClient.notification.create({
                  data: {
                    userId: admin.id,
                    companyId: setting.companyId,
                    title: 'Respaldo Automático Exitoso',
                    message: `El respaldo de base de datos se ha completado correctamente y guardado en ${filePath}`,
                    type: 'SUCCESS'
                  }
                }).catch(() => {});
              }
            }
          } catch (err: any) {
            console.error(`[BACKUP ERROR] No se pudo guardar el archivo en la ruta: ${filePath}`, err);
            if (setting.enableNotifications) {
              const companyAdmins = await prismaClient.user.findMany({
                where: {
                  OR: [
                    { companyId: setting.companyId, role: { name: { in: ['ADMIN', 'SUPERADMIN'] } } },
                    { role: { name: 'SUPERADMIN' } }
                  ]
                }
              });

              for (const admin of companyAdmins) {
                await prismaClient.notification.create({
                  data: {
                    userId: admin.id,
                    companyId: setting.companyId,
                    title: 'Error en Respaldo Automático',
                    message: `No se pudo guardar el archivo de respaldo: ${err?.message || 'Error de escritura'}. Ruta intentada: ${filePath}`,
                    type: 'ERROR'
                  }
                }).catch(() => {});
              }
            }
          }
        }
      } catch (error) {
        console.error('[BACKUP CRON ERROR]', error);
      }
    });

    // Ejecutar cada hora para monitorear empresas con período de prueba vencido
    cron.schedule('0 * * * *', async () => {
      try {
        let prismaClient: any;
        try {
          prismaClient = (await import('./lib/prisma')).prisma;
        } catch {
          return;
        }
        if (!prismaClient) return;

        const expiredTrials: any[] = await prismaClient.$queryRawUnsafe(
          'SELECT id, name, trialEndsAt FROM `Company` WHERE isTrial = 1 AND trialEndsAt < NOW() AND status = "ACTIVE"'
        );

        if (expiredTrials && expiredTrials.length > 0) {
          console.log(`[TRIAL CRON] Se detectaron ${expiredTrials.length} empresas con período de prueba vencido:`, expiredTrials.map((c: any) => `${c.name} (ID: ${c.id})`));
        }
      } catch (err) {
        console.error('[TRIAL CRON ERROR]', err);
      }
    });

    console.log('[CRON] Tareas programadas de respaldo y prueba inicializadas.');
  }
}
