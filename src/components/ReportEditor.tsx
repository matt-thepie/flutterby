import { useState } from 'react';
import type { Butterfly, Report, ReportPatch } from '../types/models';
import { combineToIso, toDateInput, toTimeInput } from '../lib/datetime';
import { ReportDetails, type ReportMeta } from './ReportDetails';
import { SpeciesSearch } from './SpeciesSearch';
import { SexControl } from './SexControl';
import { LifeStageControl } from './LifeStageControl';
import type { LifeStage, Sex } from '../types/models';
import styles from './ReportEditor.module.css';

interface EditLine {
  speciesId: number;
  count: number;
  commonName: string;
  notes: string;
  sex: Sex | null;
  lifeStage: LifeStage | null;
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
    recorderName: report.recorderName ?? '',
  });
  const [lines, setLines] = useState<EditLine[]>(
    report.sightings.map((s) => ({
      speciesId: s.speciesId,
      count: s.count,
      commonName: s.commonName,
      notes: s.notes ?? '',
      sex: s.sex,
      lifeStage: s.lifeStage,
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

  const setNotes = (speciesId: number, notes: string): void => {
    setLines((current) => current.map((l) => (l.speciesId === speciesId ? { ...l, notes } : l)));
  };

  const setSex = (speciesId: number, sex: Sex | null): void => {
    setLines((current) => current.map((l) => (l.speciesId === speciesId ? { ...l, sex } : l)));
  };

  const setLifeStage = (speciesId: number, lifeStage: LifeStage | null): void => {
    setLines((current) => current.map((l) => (l.speciesId === speciesId ? { ...l, lifeStage } : l)));
  };

  const addSpecies = (butterfly: Butterfly, count: number): void => {
    setLines((current) => {
      const existing = current.find((l) => l.speciesId === butterfly.id);
      if (existing) {
        return current.map((l) =>
          l.speciesId === butterfly.id ? { ...l, count: l.count + count } : l,
        );
      }
      return [
        ...current,
        {
          speciesId: butterfly.id,
          count,
          commonName: butterfly.commonName,
          notes: '',
          sex: null,
          lifeStage: null,
        },
      ];
    });
  };

  const save = (): void => {
    onSave({
      observedAt: combineToIso(meta.date, meta.time),
      gridRef: meta.gridRef.trim() || null,
      locationName: meta.locationName.trim() || null,
      recorderName: meta.recorderName.trim() || null,
      sightings: lines.map((l) => ({
        speciesId: l.speciesId,
        count: l.count,
        notes: l.notes.trim() || null,
        sex: l.sex,
        lifeStage: l.lifeStage,
      })),
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
            <div className={styles.lineMain}>
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
              <SexControl
                value={line.sex}
                onChange={(next) => setSex(line.speciesId, next)}
                speciesName={line.commonName}
              />
            </div>
            <LifeStageControl
              value={line.lifeStage}
              onChange={(next) => setLifeStage(line.speciesId, next)}
              speciesName={line.commonName}
            />
            <input
              type="text"
              className={styles.note}
              value={line.notes}
              placeholder={`Comment on this ${line.commonName.toLowerCase()}…`}
              onChange={(e) => setNotes(line.speciesId, e.target.value)}
              aria-label={`Comment on ${line.commonName}`}
            />
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
