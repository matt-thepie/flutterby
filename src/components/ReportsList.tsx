import { useState } from 'react';
import type { Butterfly, Report, ReportPatch } from '../types/models';
import { ReportEditor } from './ReportEditor';
import styles from './ReportsList.module.css';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

interface Props {
  reports: Report[];
  species: Butterfly[];
  loading: boolean;
  savingId: string | null;
  onSave: (report: Report, patch: Omit<ReportPatch, 'recorderId'>) => Promise<void>;
  onDelete: (report: Report) => void;
}

function summarise(report: Report): string {
  const total = report.sightings.reduce((sum, s) => sum + s.count, 0);
  const names = report.sightings.map((s) => (s.count > 1 ? `${s.count}× ${s.commonName}` : s.commonName));
  const shown = names.slice(0, 3).join(', ');
  const more = names.length > 3 ? ` +${names.length - 3} more` : '';
  return `${total} butterfl${total === 1 ? 'y' : 'ies'} — ${shown}${more}`;
}

export function ReportsList({
  reports,
  species,
  loading,
  savingId,
  onSave,
  onDelete,
}: Props): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) return <p className={styles.empty}>Loading your reports…</p>;
  if (reports.length === 0) {
    return <p className={styles.empty}>No reports yet — switch to Log and record your first visit.</p>;
  }

  return (
    <ul className={styles.list}>
      {reports.map((report) => {
        const when = new Date(report.observedAt);
        const editing = editingId === report.id;

        return (
          <li key={report.id} className={styles.item}>
            <div className={styles.summaryRow}>
              <div className={styles.info}>
                <span className={styles.when}>
                  {dateFmt.format(when)} · {timeFmt.format(when)}
                </span>
                <span className={styles.where}>
                  {report.gridRef ?? 'no grid ref'}
                  {report.locationName ? ` · ${report.locationName}` : ''}
                </span>
                <span className={styles.species}>{summarise(report)}</span>
              </div>
              <button
                type="button"
                className={styles.edit}
                aria-expanded={editing}
                onClick={() => setEditingId(editing ? null : report.id)}
              >
                {editing ? 'Close' : 'Edit'}
              </button>
            </div>

            {editing && (
              <ReportEditor
                report={report}
                species={species}
                saving={savingId === report.id}
                onSave={async (patch) => {
                  await onSave(report, patch);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                onDelete={() => {
                  setEditingId(null);
                  onDelete(report);
                }}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
