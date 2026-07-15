import { useState } from 'react';
import type { DraftReport } from '../hooks/useDraftReport';
import styles from './DraftPanel.module.css';

interface Props {
  draft: DraftReport;
  saving: boolean;
  onSave: () => void;
}

/** The species tallied so far this visit, with a save action. Sticky at the bottom. */
export function DraftPanel({ draft, saving, onSave }: Props): React.ReactElement | null {
  const [openNote, setOpenNote] = useState<number | null>(null);

  if (draft.lines.length === 0) return null;

  return (
    <section className={styles.panel} aria-label="This report">
      <ul className={styles.lines}>
        {draft.lines.map(({ species, count, notes }) => {
          const noteOpen = openNote === species.id || Boolean(notes);
          return (
            <li key={species.id} className={styles.line}>
              <div className={styles.lineMain}>
                <span className={styles.name}>{species.commonName}</span>
                <span
                  className={styles.stepper}
                  role="group"
                  aria-label={`Count of ${species.commonName}`}
                >
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => draft.setCount(species.id, count - 1)}
                    aria-label={`One fewer ${species.commonName}`}
                  >
                    −
                  </button>
                  <output className={styles.count}>{count}</output>
                  <button
                    type="button"
                    className={styles.step}
                    onClick={() => draft.setCount(species.id, count + 1)}
                    aria-label={`One more ${species.commonName}`}
                  >
                    +
                  </button>
                </span>
                <button
                  type="button"
                  className={styles.noteToggle}
                  data-active={Boolean(notes)}
                  onClick={() => setOpenNote(noteOpen && !notes ? null : species.id)}
                  aria-label={`Comment on ${species.commonName}`}
                  aria-expanded={noteOpen}
                >
                  💬
                </button>
                <button
                  type="button"
                  className={styles.remove}
                  onClick={() => draft.remove(species.id)}
                  aria-label={`Remove ${species.commonName}`}
                >
                  ✕
                </button>
              </div>
              {noteOpen && (
                <input
                  type="text"
                  className={styles.note}
                  value={notes ?? ''}
                  placeholder={`Comment on this ${species.commonName.toLowerCase()}…`}
                  onChange={(e) => draft.setNotes(species.id, e.target.value)}
                  aria-label={`Comment on ${species.commonName}`}
                />
              )}
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.save} onClick={onSave} disabled={saving}>
        {saving
          ? 'Saving…'
          : `Mark as done — ${draft.lines.length} species, ${draft.totalIndividuals} butterflies`}
      </button>
    </section>
  );
}
