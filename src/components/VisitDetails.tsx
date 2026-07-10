import { useEffect, useRef, useState } from 'react';
import type { GeoState } from '../hooks/useGeolocation';
import { ReportDetails, type ReportMeta } from './ReportDetails';
import styles from './VisitDetails.module.css';

interface Props {
  meta: ReportMeta;
  onChange: (meta: ReportMeta) => void;
  geo: GeoState;
  /** Turn location on (clears any earlier "no thanks" and starts the watch). */
  onEnableLocation: () => void;
}

function locationStatus(geo: GeoState): { text: string; tone: 'ok' | 'busy' | 'warn' } {
  if (!geo.started) return { text: 'Location off — grid refs by hand', tone: 'warn' };
  switch (geo.status) {
    case 'ready':
      return geo.gridRef
        ? { text: geo.gridRef.text, tone: 'ok' }
        : { text: 'Outside the British National Grid', tone: 'warn' };
    case 'locating':
      return { text: 'Getting your location…', tone: 'busy' };
    case 'denied':
      return { text: 'Location blocked in browser settings — enter grid refs by hand', tone: 'warn' };
    case 'unavailable':
      return { text: 'No location on this device', tone: 'warn' };
    case 'error':
      return { text: 'Location error — try again', tone: 'warn' };
    default:
      return { text: 'Waiting for location…', tone: 'busy' };
  }
}

/**
 * The visit's where-and-when for the Log tab. Shown expanded first (location
 * is being acquired); once a GPS fix lands it collapses to a one-line summary
 * so the butterflies take the stage. Tap to reopen at any time.
 */
export function VisitDetails({ meta, onChange, geo, onEnableLocation }: Props): React.ReactElement {
  const [open, setOpen] = useState(true);
  const userToggled = useRef(false);
  const status = locationStatus(geo);

  // Auto-collapse exactly once, when the first fix arrives — unless the
  // recorder has already toggled the panel themselves.
  const collapsedOnce = useRef(false);
  useEffect(() => {
    if (geo.status === 'ready' && !collapsedOnce.current && !userToggled.current) {
      collapsedOnce.current = true;
      setOpen(false);
    }
  }, [geo.status]);

  const gridRefShown = meta.gridRef.trim() || geo.gridRef?.text || null;

  return (
    <section className={styles.panel} aria-label="Visit details">
      <button
        type="button"
        className={styles.summary}
        aria-expanded={open}
        onClick={() => {
          userToggled.current = true;
          setOpen((o) => !o);
        }}
      >
        <span className={styles.summaryMain}>
          <span className={styles.gridref} data-tone={status.tone}>
            {gridRefShown ?? status.text}
          </span>
          <span className={styles.summaryDetail}>
            {meta.date.split('-').reverse().join('/')} · {meta.time}
            {meta.locationName ? ` · ${meta.locationName}` : ''}
            {meta.recorderName ? ` · ${meta.recorderName}` : ''}
          </span>
        </span>
        <span className={styles.chevron} data-open={open} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          {(!geo.started || geo.status !== 'ready' || !geo.gridRef) && (
            <p className={styles.status} data-tone={status.tone}>
              {status.text}
              {!geo.started && (
                <button type="button" className={styles.retry} onClick={onEnableLocation}>
                  Turn on
                </button>
              )}
              {geo.started && geo.status === 'error' && (
                <button type="button" className={styles.retry} onClick={geo.start}>
                  Retry
                </button>
              )}
            </p>
          )}
          <ReportDetails
            meta={meta}
            onChange={onChange}
            liveGridRef={geo.gridRef?.text ?? null}
            onUseCurrentLocation={() => onChange({ ...meta, gridRef: '' })}
          />
        </div>
      )}
    </section>
  );
}
