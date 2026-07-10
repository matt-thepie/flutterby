import { useId } from 'react';
import styles from './ReportDetails.module.css';

export interface ReportMeta {
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  gridRef: string;
  locationName: string;
}

interface Props {
  meta: ReportMeta;
  onChange: (meta: ReportMeta) => void;
  /** Present when live GPS is available — shows a "use current" reset. */
  liveGridRef?: string | null;
  onUseCurrentLocation?: () => void;
}

/** The where-and-when fields of a report, shared by the Log tab and the editor. */
export function ReportDetails({
  meta,
  onChange,
  liveGridRef,
  onUseCurrentLocation,
}: Props): React.ReactElement {
  const id = useId();
  const set = (patch: Partial<ReportMeta>): void => onChange({ ...meta, ...patch });

  const gridRefIsStale = Boolean(
    liveGridRef && meta.gridRef && liveGridRef !== meta.gridRef && onUseCurrentLocation,
  );

  return (
    <fieldset className={styles.details}>
      <legend className={styles.legend}>Visit details</legend>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Day</span>
          <input
            type="date"
            className={styles.input}
            value={meta.date}
            onChange={(e) => set({ date: e.target.value })}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Time</span>
          <input
            type="time"
            className={styles.input}
            value={meta.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field} htmlFor={`${id}-gridref`}>
          <span className={styles.label}>Grid reference</span>
          <input
            id={`${id}-gridref`}
            type="text"
            className={styles.input}
            data-gridref
            value={meta.gridRef}
            placeholder={liveGridRef ?? 'e.g. SU 6400 0430'}
            onChange={(e) => set({ gridRef: e.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {gridRefIsStale && (
          <button type="button" className={styles.useCurrent} onClick={onUseCurrentLocation}>
            Use current
          </button>
        )}
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Location</span>
        <input
          type="text"
          className={styles.input}
          value={meta.locationName}
          placeholder="e.g. Home garden, Butser Hill…"
          onChange={(e) => set({ locationName: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
