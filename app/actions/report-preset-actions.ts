'use client';

import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';

// Server action functions or API helper functions to persist report presets in MySQL database via Prisma

export async function fetchReportPresetsAction(reportType: string) {
  try {
    const res = await fetch(`/api/reports/presets?reportType=${encodeURIComponent(reportType)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.presets || [];
  } catch (err) {
    console.error('[FETCH_REPORT_PRESETS_ERROR]', err);
    return [];
  }
}

export async function saveReportPresetAction(reportType: string, name: string, fields: string[]) {
  try {
    const res = await fetch('/api/reports/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType, name, fields }),
    });
    if (!res.ok) throw new Error('Error al guardar la plantilla');
    return await res.json();
  } catch (err) {
    console.error('[SAVE_REPORT_PRESET_ERROR]', err);
    throw err;
  }
}

export async function deleteReportPresetAction(id: number) {
  try {
    const res = await fetch(`/api/reports/presets?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar la plantilla');
    return await res.json();
  } catch (err) {
    console.error('[DELETE_REPORT_PRESET_ERROR]', err);
    throw err;
  }
}
