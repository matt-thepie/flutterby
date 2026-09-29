import { useState } from 'react';
import type { DraftReport } from '../hooks/useDraftReport';
import type { SightingPosition } from '../types/models';
import { SexControl } from './SexControl';
import { LifeStageControl } from './LifeStageControl';
import styles from './DraftPanel.module.css';

interface Props {
  draft: DraftReport;
  saving: boolean;
  onSave: () => void;
  /** Where the recorder is standing right now, if there's a live fix. */
  currentPosition: SightingPosition | null;
}

function positionLabel(position: SightingPosition | null, fallbackGridRef: string): string {
  if (!position) return fallbackGridRef ? `${fallbackGridRef} (report)` : 'No position';
  const where =
    position.gridRef ??
    `${position.latitude?.toFixed(5)}, ${position.longitude?.toFixed(5)}`;
  return position.accuracyM != null ? `${where} ±${Math.round(position.accuracyM)} m` : where;
}

/** The butterflies logged so far this visit, with a save action. Sticky at the bottom. */
export function DraftPanel({
  draft,
  saving,
  onSave,
  currentPosition,
}: Props): React.ReactElement | null {
  const [openNote, setOpenNote] = useState<string | null>(null);

  if (draft.lines.length === 0) return null;

  const fallbackGridRef = draft.meta.gridRef.trim();

  return (
    <section className={styles.panel} aria-label="This report">
      <ul className={styles.lines}>
        {draft.lines.map(({ id, species, count, notes, sex, lifeStage, position }) => {
          const hasExtras = Boolean(notes) || Boolean(sex) || Boolean(lifeStage);
          const detailsOpen = openNote === id || hasExtras;
          const canMoveHere =
            currentPosition != null &&
            (position == null ||
              position.latitude !== currentPosition.latitude ||
              position.longitude !== currentPosition.longitude);
          return (
            <li key={id} className={styles.line}>
              <div className={styles.lineMain}>
                <span className={styles.what}>
                  <span className={styles.name}>{species.commonName}</span>
                  <span className={styles.position} data-missing={!position && !fallbackGridRef}>
                    {positionLabel(position, fallbackGridRef)}
                  </span>
                </span>
                <span
                  className={styles.stepper}
                  role="group"
                  aria-label={`Count of ${species.commonName}`}
                >
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => draft.setCount(id, count - 1)}
                    aria-label={`One fewer ${species.commonName}`}
                  >
                    −
                  </button>
                  <output className={styles.count}>{count}</output>
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => draft.setCount(id, count + 1)}
                    aria-label={`One more ${species.commonName}`}
                  >
                    +
                  </button>
                </span>
                <button
                  type="button"
                  className={styles.noteToggle}
                  data-active={hasExtras}
                  onClick={() => setOpenNote(detailsOpen && !hasExtras ? null : id)}
                  aria-label={`Details for ${species.commonName}`}
                  aria-expanded={detailsOpen}
                >
                  ⋯
                </button>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => draft.remove(id)}
                  aria-label={`Remove ${species.commonName}`}
                >
                  ✕
                </button>
              </div>
              {detailsOpen && (
                <div className={styles.details}>
                  {canMoveHere && (
                    <button
                      type="button"
                      className={styles.moveHere}
                      onClick={() => draft.setPosition(id, currentPosition)}
                    >
                      Set position to where I am now
                    </button>
                  )}
                  <LifeStageControl
                    value={lifeStage ?? null}
                    onChange={(next) => draft.setLifeStage(id, next)}
                    speciesName={species.commonName}
                  />
                  <SexControl
                    value={sex ?? null}
                    onChange={(next) => draft.setSex(id, next)}
                    speciesName={species.commonName}
                  />
                  <input
                    type="text"
                    className={styles.note}
                    value={notes ?? ''}
                    placeholder={`Comment on this ${species.commonName.toLowerCase()}…`}
                    onChange={(e) => draft.setNotes(id, e.target.value)}
                    aria-label={`Comment on ${species.commonName}`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.save} onClick={onSave} disabled={saving}>
        {saving
          ? 'Saving…'
          : `Mark as done — ${draft.speciesCount} species, ${draft.totalIndividuals} butterflies`}
      </button>
    </section>
  );
}
