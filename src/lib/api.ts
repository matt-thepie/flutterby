import type {
  Butterfly,
  NewReportInput,
  Report,
  ReportPatch,
  ReportRow,
  TopButterfly,
} from '../types/models';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const qs = (params: Record<string, string | number>): string =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();

export const api = {
  getButterflies: (): Promise<Butterfly[]> => request('/api/butterflies'),

  getTopButterflies: (recorderId: string, limit = 12): Promise<TopButterfly[]> =>
    request(`/api/butterflies/top?${qs({ recorderId, limit })}`),

  getReports: (recorderId: string, limit = 50): Promise<Report[]> =>
    request(`/api/reports?${qs({ recorderId, limit })}`),

  createReport: (input: NewReportInput): Promise<ReportRow> =>
    request('/api/reports', { method: 'POST', body: JSON.stringify(input) }),

  updateReport: (id: string, patch: ReportPatch): Promise<ReportRow> =>
    request(`/api/reports/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),

  deleteReport: (id: string, recorderId: string): Promise<void> =>
    request(`/api/reports/${id}?${qs({ recorderId })}`, { method: 'DELETE' }),

  getConfig: (): Promise<{ providers: string[] }> => request('/api/config'),

  suggestPlace: (
    recorderId: string,
    lat: number,
    lon: number,
  ): Promise<{
    suggestion: { name: string; source: 'remembered' | 'osm'; distanceM?: number } | null;
    nearby: Array<{ name: string; distanceM: number }>;
  }> => request(`/api/places/suggest?${qs({ recorderId, lat, lon })}`),

  // Claim this device's anonymous reports for the signed-in account.
  linkDevice: (recorderId: string): Promise<{ linked: number }> =>
    request('/api/link', { method: 'POST', body: JSON.stringify({ recorderId }) }),

  getAdminSession: (): Promise<{ isAdmin: boolean; email: string | null }> =>
    request('/api/admin/session'),

  getAdminRecords: (): Promise<Report[]> => request('/api/admin/records'),
};
