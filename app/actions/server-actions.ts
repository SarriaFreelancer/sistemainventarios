"use server";

import { platformDb, encryptPassword } from "@/lib/db-manager";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/auth";

export async function getServers() {
  const session = await getAuthSession();
  if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN')) {
    throw new Error('No autorizado');
  }

  const isSuperAdmin = session.user.role === 'SUPERADMIN';
  
  // Superadmin only sees global servers (ownerId = null). Admins only see their own servers.
  const whereClause = isSuperAdmin ? { ownerId: null } : { ownerId: Number(session.user.companyId) };

  try {
    const servers = await platformDb.server.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        companies: {
          select: { id: true, name: true, databaseName: true, databaseType: true }
        },
        _count: {
          select: { companies: true }
        }
      }
    });
    const serversWithStatus = await Promise.all(
      servers.map(async (s) => {
        let isOnline = false;
        if (s.active) {
          try {
            const net = await import('net');
            isOnline = await new Promise<boolean>((resolve) => {
              const socket = new net.Socket();
              socket.setTimeout(2500);
              socket.on('connect', () => {
                socket.destroy();
                resolve(true);
              });
              socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
              });
              socket.on('error', () => {
                socket.destroy();
                resolve(false);
              });
              socket.connect(s.port, s.host);
            });
          } catch (err) {
            isOnline = false;
          }
        }
        return {
          ...s,
          isOnline
        };
      })
    );

    return serversWithStatus;
  } catch (error: any) {
    console.error('Error fetching servers:', error);
    return [];
  }
}

export async function testServerConnection(data: {
  engine: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  ssl?: boolean;
}) {
  const session = await getAuthSession();
  if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN')) {
    return { success: false, error: 'No autorizado' };
  }

  const { host, port, username, password, engine } = data;

  if (!host || !port || !username) {
    return { success: false, error: 'Faltan parámetros de conexión (Host, Puerto o Usuario)' };
  }

  try {
    const net = await import('net');
    
    const testResult = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const socket = new net.Socket();
      let hasResponded = false;

      const finish = (success: boolean, error?: string) => {
        if (hasResponded) return;
        hasResponded = true;
        socket.destroy();
        resolve({ success, error });
      };

      socket.setTimeout(4000); // 4 segundos timeout

      socket.on('connect', () => {
        const eng = (engine || '').toUpperCase();
        
        if (eng === 'POSTGRESQL') {
          // Send PostgreSQL SSLRequest (Length 8, Code 80877103)
          const sslReq = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]);
          socket.write(sslReq);
        } else if (eng === 'SQLSERVER' || eng === 'AZURE_SQL') {
          // Send TDS Pre-Login packet header (Packet type 12, status 1, length 8)
          const tdsPrelogin = Buffer.from([0x12, 0x01, 0x00, 0x08, 0x00, 0x00, 0x01, 0x00]);
          socket.write(tdsPrelogin);
        }
      });

      socket.on('data', (dataBuffer) => {
        const eng = (engine || '').toUpperCase();

        if (eng === 'MYSQL' || eng === 'AWS_SQL') {
          // MySQL Server Handshake Initial Packet starts with protocol version (typically 10 / 0x0A)
          if (dataBuffer.length > 4 && (dataBuffer[4] === 10 || dataBuffer[4] === 9)) {
            finish(true);
          } else {
            finish(false, `El servidor en ${host}:${port} respondió, pero no corresponde al protocolo de MySQL.`);
          }
        } else if (eng === 'POSTGRESQL') {
          // PostgreSQL responds to SSLRequest with 'S' (SSL supported), 'N' (SSL not supported), or ErrorResponse ('E')
          const firstChar = String.fromCharCode(dataBuffer[0]);
          if (['S', 'N', 'E', 'R'].includes(firstChar)) {
            finish(true);
          } else {
            finish(false, `El puerto ${port} respondió, pero la respuesta no pertenece a un servidor PostgreSQL (Respondió 0x${dataBuffer[0].toString(16)}).`);
          }
        } else if (eng === 'SQLSERVER' || eng === 'AZURE_SQL') {
          // SQL Server responds with TDS Pre-login ACK (Type 0x04 or 0x12)
          if (dataBuffer.length >= 4 && (dataBuffer[0] === 0x04 || dataBuffer[0] === 0x12)) {
            finish(true);
          } else {
            finish(false, `El puerto ${port} respondió, pero la respuesta no pertenece a Microsoft SQL Server.`);
          }
        } else {
          // Fallback para otros motores
          finish(true);
        }
      });

      socket.on('timeout', () => {
        finish(false, `Tiempo de espera agotado (4s) conectando a ${host}:${port}.`);
      });

      socket.on('error', (err: any) => {
        finish(false, `Error de red al conectar a ${host}:${port}: ${err.message || 'Conexión rechazada'}`);
      });

      socket.connect(Number(port), host);
    });

    if (!testResult.success) {
      return { 
        success: false, 
        error: testResult.error || `El servicio en el puerto ${port} no coincide con el motor ${engine}.` 
      };
    }

    return { 
      success: true, 
      message: `¡Conexión y protocolo verificados con éxito! El servicio responde correctamente al motor ${engine}.` 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Fallo al probar la conexión con el servidor' 
    };
  }
}

export async function createServer(data: any) {
  const session = await getAuthSession();
  if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN')) {
    return { success: false, error: 'No autorizado' };
  }

  // 1. Probar conexión antes de guardar
  const connTest = await testServerConnection({
    engine: data.engine,
    host: data.host,
    port: Number(data.port),
    username: data.username,
    password: data.password,
    ssl: data.ssl
  });

  if (!connTest.success) {
    return {
      success: false,
      error: `Prueba de conexión fallida: ${connTest.error}`
    };
  }

  try {
    const encryptedPassword = encryptPassword(data.password);
    
    // If it's an ADMIN, lock the ownerId to their companyId
    const ownerId = session.user.role === 'ADMIN' ? Number(session.user.companyId) : null;
    
    await platformDb.server.create({
      data: {
        name: data.name,
        engine: data.engine,
        host: data.host,
        port: Number(data.port),
        username: data.username,
        password: encryptedPassword,
        ssl: Boolean(data.ssl),
        active: Boolean(data.active),
        ownerId: ownerId,
      }
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating server:', error);
    return { success: false, error: 'Error al registrar servidor' };
  }
}

export async function updateServer(id: string, data: any) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const updateData: any = {
      name: data.name,
      engine: data.engine,
      host: data.host,
      port: Number(data.port),
      username: data.username,
      ssl: Boolean(data.ssl),
      active: Boolean(data.active),
    };

    if (data.password) {
      updateData.password = encryptPassword(data.password);
    }

    await platformDb.server.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating server:', error);
    return { success: false, error: 'Error al actualizar servidor' };
  }
}

export async function deleteServer(id: string) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Verificar si hay empresas asociadas
    const count = await platformDb.company.count({ where: { serverId: id } });
    if (count > 0) {
      return { success: false, error: 'No se puede eliminar porque tiene empresas asociadas' };
    }

    await platformDb.server.delete({
      where: { id }
    });

    revalidatePath('/dashboard/settings/servers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting server:', error);
    return { success: false, error: 'Error al eliminar servidor' };
  }
}
