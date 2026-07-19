import { platformDb, encryptPassword } from './lib/db-manager.js';

async function restore() {
  try {
    // 1. Create Server
    const server = await platformDb.server.create({
      data: {
        name: 'Servidor Local (Restaurado)',
        engine: 'MYSQL',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: encryptPassword('root'),
        ssl: false,
        active: true
      }
    });
    console.log('Server created:', server.id);

    // 2. Update Company (Kadesh S.A.S id: 3)
    const company = await platformDb.company.update({
      where: { id: 3 },
      data: {
        serverId: server.id,
        databaseName: 'base_prueba',
        databaseType: 'DEDICATED'
      }
    });
    console.log('Company updated:', company.name, 'mapped to', company.databaseName);
  } catch (e) {
    console.error(e);
  } finally {
    await platformDb.$disconnect();
  }
}

restore();
