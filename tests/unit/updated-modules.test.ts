import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('1. Módulo Integraciones API REST & Trial Lock', () => {
  function checkApiTrialAccess({
    isTrial,
    isExpired,
    apiAccessApproved,
    userRole,
  }: {
    isTrial: boolean;
    isExpired: boolean;
    apiAccessApproved: boolean;
    userRole: string;
  }) {
    const isSuperAdmin = userRole === 'SUPERADMIN';
    const isAdmin = userRole === 'ADMIN';

    // Bloqueo por prueba gratuita activa y no aprobada
    const isTrialLocked = !isSuperAdmin && isTrial && !apiAccessApproved;

    // Solo ADMIN puede solicitar activación
    const canRequest = isTrialLocked && isAdmin;

    // Solo ADMIN y SUPERADMIN pueden crear llaves cuando no está bloqueado
    const canManageKeys = (isSuperAdmin || isAdmin) && !isTrialLocked;

    return { isTrialLocked, canRequest, canManageKeys };
  }

  function validateJustification(justification: string): { valid: boolean; error?: string } {
    if (!justification || justification.trim().length < 15) {
      return {
        valid: false,
        error: 'Debes proporcionar una justificación detallada (mínimo 15 caracteres).',
      };
    }
    return { valid: true };
  }

  it('debe bloquear el acceso a API REST en cuenta Trial si no está aprobada', () => {
    const result = checkApiTrialAccess({
      isTrial: true,
      isExpired: false,
      apiAccessApproved: false,
      userRole: 'ADMIN',
    });
    assert.equal(result.isTrialLocked, true);
    assert.equal(result.canRequest, true);
    assert.equal(result.canManageKeys, false);
  });

  it('debe permitir solicitar acceso a ADMIN pero NO a USER', () => {
    const adminAccess = checkApiTrialAccess({
      isTrial: true,
      isExpired: false,
      apiAccessApproved: false,
      userRole: 'ADMIN',
    });
    assert.equal(adminAccess.canRequest, true);

    const userAccess = checkApiTrialAccess({
      isTrial: true,
      isExpired: false,
      apiAccessApproved: false,
      userRole: 'USER',
    });
    assert.equal(userAccess.canRequest, false);
    assert.equal(userAccess.canManageKeys, false);
  });

  it('debe desbloquear el módulo cuando apiAccessApproved es true para ADMIN', () => {
    const result = checkApiTrialAccess({
      isTrial: true,
      isExpired: false,
      apiAccessApproved: true,
      userRole: 'ADMIN',
    });
    assert.equal(result.isTrialLocked, false);
    assert.equal(result.canManageKeys, true);
  });

  it('Superadmin siempre tiene acceso irrestricto al módulo de APIs', () => {
    const result = checkApiTrialAccess({
      isTrial: true,
      isExpired: false,
      apiAccessApproved: false,
      userRole: 'SUPERADMIN',
    });
    assert.equal(result.isTrialLocked, false);
    assert.equal(result.canManageKeys, true);
  });

  it('debe validar que la justificación tenga al menos 15 caracteres', () => {
    const short = validateJustification('Para pruebas');
    assert.equal(short.valid, false);
    assert.ok(short.error);

    const valid = validateJustification('Integración con ERP contable externo para sincronizar facturas');
    assert.equal(valid.valid, true);
    assert.equal(valid.error, undefined);
  });
});

describe('2. Módulo de Sesiones Activas & Casteo de Tipos', () => {
  function parseSessionCompanyId(companyId: any): number | null {
    if (companyId === undefined || companyId === null || companyId === '') return null;
    const parsed = Number(companyId);
    return isNaN(parsed) ? null : parsed;
  }

  function filterSessionsForUser(
    sessions: Array<{ id: number; companyId: number | null; userEmail: string }>,
    currentCompanyId: number | null,
    isSuperAdmin: boolean
  ) {
    if (isSuperAdmin) return sessions;
    if (!currentCompanyId) return [];
    return sessions.filter((s) => s.companyId === currentCompanyId);
  }

  it('debe convertir companyId string (NextAuth) a número de Prisma correctamente', () => {
    assert.equal(parseSessionCompanyId('42'), 42);
    assert.equal(parseSessionCompanyId('105'), 105);
    assert.equal(parseSessionCompanyId(null), null);
    assert.equal(parseSessionCompanyId(undefined), null);
    assert.equal(parseSessionCompanyId('invalid'), null);
  });

  it('debe aislar las sesiones activas por empresa para Admin y permitir vista global a Superadmin', () => {
    const allSessions = [
      { id: 1, companyId: 10, userEmail: 'admin10@empresa.com' },
      { id: 2, companyId: 10, userEmail: 'cajero10@empresa.com' },
      { id: 3, companyId: 20, userEmail: 'admin20@otra.com' },
    ];

    const admin10Sessions = filterSessionsForUser(allSessions, 10, false);
    assert.equal(admin10Sessions.length, 2);
    assert.ok(admin10Sessions.every((s) => s.companyId === 10));

    const superAdminSessions = filterSessionsForUser(allSessions, null, true);
    assert.equal(superAdminSessions.length, 3);
  });
});

describe('3. Permisos Granulares de Módulos por Usuario', () => {
  function parseAllowedModuleIds(raw: any): number[] | undefined {
    if (!raw) return undefined;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        return parsed.map((id) => Number(id)).filter((id) => !isNaN(id));
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  function resolveUserAllowedModules(
    baseModules: Array<{ id: number; name: string; href: string }>,
    userPreferences: { allowedModuleIds?: number[] } | null | undefined,
    userRole: string
  ) {
    if (userRole === 'SUPERADMIN') return baseModules;

    if (userPreferences && Array.isArray(userPreferences.allowedModuleIds)) {
      const allowedSet = new Set(userPreferences.allowedModuleIds.map(Number));
      return baseModules.filter((m) => allowedSet.has(m.id));
    }

    return baseModules;
  }

  it('debe parsear correctamente un JSON string de allowedModuleIds', () => {
    const raw = '[1, 2, 5, 8]';
    const parsed = parseAllowedModuleIds(raw);
    assert.deepEqual(parsed, [1, 2, 5, 8]);
  });

  it('debe filtrar los módulos del usuario según allowedModuleIds configurados', () => {
    const companyModules = [
      { id: 1, name: 'Dashboard', href: '/dashboard' },
      { id: 2, name: 'Productos', href: '/dashboard/products' },
      { id: 3, name: 'Ventas', href: '/dashboard/sales' },
      { id: 4, name: 'Finanzas', href: '/dashboard/finances' },
    ];

    // Usuario con solo acceso a Dashboard y Ventas
    const userModules = resolveUserAllowedModules(
      companyModules,
      { allowedModuleIds: [1, 3] },
      'USER'
    );
    assert.equal(userModules.length, 2);
    assert.deepEqual(userModules.map((m) => m.name), ['Dashboard', 'Ventas']);
  });

  it('debe mantener todos los módulos si el usuario no tiene restricción específica en preferencias', () => {
    const companyModules = [
      { id: 1, name: 'Dashboard', href: '/dashboard' },
      { id: 2, name: 'Productos', href: '/dashboard/products' },
    ];

    const userModules = resolveUserAllowedModules(companyModules, null, 'USER');
    assert.equal(userModules.length, 2);
  });

  it('Superadmin siempre tiene acceso completo a todos los módulos sin filtrar', () => {
    const allModules = [
      { id: 1, name: 'Dashboard', href: '/dashboard' },
      { id: 2, name: 'Productos', href: '/dashboard/products' },
      { id: 99, name: 'Auditoría', href: '/dashboard/audit' },
    ];

    const superAdminModules = resolveUserAllowedModules(
      allModules,
      { allowedModuleIds: [1] },
      'SUPERADMIN'
    );
    assert.equal(superAdminModules.length, 3);
  });
});

describe('4. Branding Dinámico en Reportes PDF & Sincronización de Empresa', () => {
  function getReportBranding(companyName?: string | null): string {
    const name = (companyName || '').trim();
    return name ? name : 'GNS - Gestión de Negocios Sarria';
  }

  it('debe usar el nombre real de la empresa del cliente en los reportes', () => {
    assert.equal(getReportBranding('Ferretería El Progreso SAS'), 'Ferretería El Progreso SAS');
    assert.equal(getReportBranding('Boutique Dulche Dorelle'), 'Boutique Dulche Dorelle');
  });

  it('debe usar el fallback por defecto si la empresa no tiene nombre definido', () => {
    assert.equal(getReportBranding(''), 'GNS - Gestión de Negocios Sarria');
    assert.equal(getReportBranding(null), 'GNS - Gestión de Negocios Sarria');
    assert.equal(getReportBranding(undefined), 'GNS - Gestión de Negocios Sarria');
  });
});
