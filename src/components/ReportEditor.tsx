import { useState } from 'react';
import type { Butterfly, Report, ReportPatch } from '../types/models';
import { combineToIso, toDateInput, toTimeInput } from '../lib/datetime';
import { ReportDetails, type ReportMeta } from './ReportDetails';
import { SpeciesSearch } from './SpeciesSearch';
import styles from './ReportEditor.module.css';

interface EditLine {
  speciesId: number;
  count: number;
  commonName: string;
}

interface Props {
  report: Report;
  species: Butterfly[];
  saving: boolean;
  onSave: (patch: Omit<ReportPatch, 'recorderId'>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function ReportEditor({
  report,
  species,
  saving,
  onSave,
  onCancel,
  onDelete,
}: Props): React.ReactElement {
  const observed = new Date(report.observedAt);
  const [meta, setMeta] = useState<ReportMeta>({
    date: toDateInput(observed),
    time: toTimeInput(observed),
    gridRef: report.gridRef ?? '',
    locationName: report.locationName ?? '',
  });
  const [lines, setLines] = useState<EditLine[]>(
    report.sightings.map((s) => ({
      speciesId: s.speciesId,
      count: s.count,
      commonName: s.commonName,
    })),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const setCount = (speciesId: number, count: number): void => {
    setLines((current) =>
      count <= 0
        ? current.filter((l) => l.speciesId !== speciesId)
        : current.map((l) => (l.speciesId === speciesId ? { ...l, count } : l)),
    );
  };

  const addSpecies = (butterfly: Butterfly, count: number): void => {
    setLines((current) => {
      const existing = current.find((l) => l.speciesId === butterfly.id);
      if (existing) {
        return current.map((l) =>
          l.speciesId === butterfly.id ? { ...l, count: l.count + count } : l,
        );
      }
      return [...current, { speciesId: butterfly.id, count, commonName: butterfly.commonName }];
    });
  };

  const save = (): void => {
    onSave({
      observedAt: combineToIso(meta.date, meta.time),
      gridRef: meta.gridRef.trim() || null,
      locationName: meta.locationName.trim() || null,
      sightings: lines.map((l) => ({ speciesId: l.speciesId, count: l.count })),
    });
  };

  return (
    <div className={styles.editor}>
      <ReportDetails meta={meta} onChange={setMeta} />

      <ul className={styles.lines}>
        {lines.length === 0 && (
          <li className={styles.emptyLines}>No species — saving now will keep the visit with none.</li>
        )}
        {lines.map((line) => (
          <li key={line.speciesId} className={styles.line}>
            <span className={styles.name}>{line.commonName}</span>
            <span className={styles.stepper} role="group" aria-label={`Count of ${line.commonName}`}>
              <button
                type="button"
                className={styles.step}
                onClick={() => setCount(line.speciesId, line.count - 1)}
                aria-label={`One fewer ${line.commonName}`}
              >
                −
              </button>
              <output className={styles.count}>{line.count}</output>
              <button
                type="button"
                className={styles.step}
                onClick={() => setCount(line.speciesId, line.count + 1)}
                aria-label={`One more ${line.commonName}`}
              >
                +
              </button>
            </span>
          </li>
        ))}
      </ul>

      <SpeciesSearch species={species} onLog={addSpecies} />

      <div className={styles.actions}>
        <button type="button" className={styles.save} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Cancel
        </button>
        {confirmingDelete ? (
          <button type="button" className={styles.deleteConfirm} onClick={onDelete}>
            Really delete?
          </button>
        ) : (
          <button
            type="button"
            className={styles.delete}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete report
          </button>
        )}
      </div>
    </div>
  );
}
