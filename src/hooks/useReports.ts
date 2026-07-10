import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Report } from '../types/models';

export interface ReportData {
  reports: Report[];
  loading: boolean;
  refresh: () => void;
}

export function useReports(recorderId: string): ReportData {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    api
      .getReports(recorderId)
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [recorderId]);

  useEffect(() => refresh(), [refresh]);

  return { reports, loading, refresh };
}
