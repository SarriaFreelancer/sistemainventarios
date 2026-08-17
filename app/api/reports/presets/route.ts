import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { companyId, role, id: userId } = session.user as { companyId?: string; role?: string; id?: string };
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('reportType');

    if (!reportType) {
      return NextResponse.json({ error: 'Tipo de reporte requerido' }, { status: 400 });
    }

    const companyFilter = role === 'SUPERADMIN' || !companyId ? {} : { companyId: Number(companyId) };

    const presets = await prisma.reportPreset.findMany({
      where: {
        ...companyFilter,
        reportType,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ presets });
  } catch (error) {
    console.error('[REPORT_PRESETS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener plantillas de reportes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { companyId, id: userId } = session.user as { companyId?: string; id?: string };
    const body = await request.json();
    const { reportType, name, fields } = body;

    if (!reportType || !name || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'Datos de plantilla inválidos' }, { status: 400 });
    }

    const preset = await prisma.reportPreset.create({
      data: {
        reportType,
        name: name.trim(),
        fields,
        companyId: companyId ? Number(companyId) : null,
        userId: userId ? Number(userId) : null,
      },
    });

    return NextResponse.json({ preset, message: 'Plantilla guardada con éxito' });
  } catch (error) {
    console.error('[REPORT_PRESETS_POST]', error);
    return NextResponse.json({ error: 'Error al guardar la plantilla' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { companyId, role } = session.user as { companyId?: string; role?: string };
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de plantilla requerido' }, { status: 400 });
    }

    const presetId = Number(id);
    const existing = await prisma.reportPreset.findUnique({ where: { id: presetId } });

    if (!existing) {
      return NextResponse.json({ error: 'Plantilla no encontrada' }, { status: 404 });
    }

    if (role !== 'SUPERADMIN' && companyId && existing.companyId !== Number(companyId)) {
      return NextResponse.json({ error: 'Sin permisos para eliminar esta plantilla' }, { status: 403 });
    }

    await prisma.reportPreset.delete({ where: { id: presetId } });

    return NextResponse.json({ success: true, message: 'Plantilla eliminada con éxito' });
  } catch (error) {
    console.error('[REPORT_PRESETS_DELETE]', error);
    return NextResponse.json({ error: 'Error al eliminar la plantilla' }, { status: 500 });
  }
}
