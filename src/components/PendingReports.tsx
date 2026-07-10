import type { DraftReport } from '../hooks/useDraftReport';
import type { QueuedReport } from '../lib/queue';
import styles from './PendingReports.module.css';

const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

interface Props {
  draft: DraftReport;
  queued: QueuedReport[];
  online: boolean;
  onContinueDraft: () => void;
  onRetryQueue: () => void;
}

/**
 * The not-yet-findings: the visit currently being recorded, and finished
 * reports still waiting for signal to upload. Empty → renders nothing.
 */
export function PendingReports({
  draft,
  queued,
  online,
  onContinueDraft,
  onRetryQueue,
}: Props): React.ReactElement | null {
  const hasDraft = draft.lines.length > 0;
  if (!hasDraft && queued.length === 0) return null;

  return (
    <section className={styles.pending} aria-labelledby="pending-heading">
      <h2 id="pending-heading" className={styles.heading}>
        In progress
      </h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Report</th>
            <th scope="col">Species</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className={styles.visuallyHidden}>Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {hasDraft && (
            <tr>
              <td>
                <span className={styles.what}>
                  {draft.meta.locationName || draft.meta.gridRef || 'Current visit'}
                </span>
                <span className={styles.when}>
                  started {draft.startedAt ? timeFmt.format(new Date(draft.startedAt)) : '—'}
                </span>
              </td>
              <td>
                {draft.lines.length} sp. / {draft.totalIndividuals}
              </td>
              <td>
                <span className={styles.badge} data-kind="draft">
                  recording
                </span>
              </td>
              <td>
                <button type="button" className={styles.action} onClick={onContinueDraft}>
                  Continue
                </button>
              </td>
            </tr>
          )}
          {queued.map((entry) => (
            <tr key={entry.queueId}>
              <td>
                <span className={styles.what}>
                  {entry.input.locationName || entry.input.gridRef || 'Report'}
                </span>
                <span className={styles.when}>
                  finished {timeFmt.format(new Date(entry.queuedAt))}
                </span>
              </td>
              <td>
                {entry.input.sightings.length} sp. /{' '}
                {entry.input.sightings.reduce((sum, s) => sum + s.count, 0)}
              </td>
              <td>
                <span className={styles.badge} data-kind="queued">
                  {online ? 'uploading…' : 'waiting for signal'}
                </span>
              </td>
              <td>
                <button type="button" className={styles.action} onClick={onRetryQueue}>
                  Retry
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
