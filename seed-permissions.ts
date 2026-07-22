import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const purchasePermissions = [
    { action: 'COMPRAS_VER', resource: 'Compras' },
    { action: 'COMPRAS_CREAR', resource: 'Compras' },
    { action: 'COMPRAS_EDITAR', resource: 'Compras' },
    { action: 'COMPRAS_ELIMINAR', resource: 'Compras' },
    { action: 'COMPRAS_APROBAR_SOLICITUD', resource: 'Compras' },
    { action: 'COMPRAS_APROBAR_ORDEN', resource: 'Compras' },
    { action: 'COMPRAS_RECIBIR_MERCANCIA', resource: 'Compras' },
    { action: 'COMPRAS_REGISTRAR_FACTURA', resource: 'Compras' },
    { action: 'COMPRAS_REGISTRAR_PAGO', resource: 'Compras' },
    { action: 'COMPRAS_EXPORTAR', resource: 'Compras' },
    { action: 'COMPRAS_IMPRIMIR', resource: 'Compras' },
    { action: 'COMPRAS_ADMINISTRAR', resource: 'Compras' },
  ];

  for (const p of purchasePermissions) {
    const existing = await prisma.permission.findFirst({
      where: { action: p.action, resource: p.resource }
    });

    if (!existing) {
      const perm = await prisma.permission.create({
        data: p
      });

      // Link to SUPERADMIN and ADMIN
      const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
      const superadminRole = await prisma.role.findUnique({ where: { name: 'SUPERADMIN' } });

      if (adminRole) {
        await prisma.rolePermission.create({
          data: { roleId: adminRole.id, permissionId: perm.id }
        }).catch(() => {});
      }
      
      if (superadminRole) {
        await prisma.rolePermission.create({
          data: { roleId: superadminRole.id, permissionId: perm.id }
        }).catch(() => {});
      }
    }
  }

  console.log('Permisos de compras insertados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
