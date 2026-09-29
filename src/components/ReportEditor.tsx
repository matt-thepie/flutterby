import { useState } from 'react';
import type { Butterfly, Report, ReportPatch } from '../types/models';
import { combineToIso, toDateInput, toTimeInput } from '../lib/datetime';
import { ReportDetails, type ReportMeta } from './ReportDetails';
import { SpeciesSearch } from './SpeciesSearch';
import { SexControl } from './SexControl';
import { LifeStageControl } from './LifeStageControl';
import type { LifeStage, Sex, SightingPosition } from '../types/models';
import styles from './ReportEditor.module.css';

interface EditLine extends SightingPosition {
  /** Local key — the same species can appear at several positions. */
  key: string;
  speciesId: number;
  count: number;
  commonName: string;
  notes: string;
  sex: Sex | null;
  lifeStage: LifeStage | null;
}

const hasPosition = (l: SightingPosition): boolean => l.latitude != null || l.gridRef != null;

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
      key: crypto.randomUUID(),
      speciesId: s.speciesId,
      count: s.count,
      commonName: s.commonName,
      notes: s.notes ?? '',
      sex: s.sex,
      lifeStage: s.lifeStage,
      gridRef: s.gridRef ?? null,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      accuracyM: s.accuracyM ?? null,
    })),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const patchLine = (key: string, patch: Partial<EditLine>): void => {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const setCount = (key: string, count: number): void => {
    if (count <= 0) setLines((current) => current.filter((l) => l.key !== key));
    else patchLine(key, { count });
  };

  // A hand-corrected grid ref replaces the GPS fix: drop the coordinates so
  // they can't disagree with (or, on export, override) what was typed.
  const setGridRef = (key: string, gridRef: string): void => {
    patchLine(key, { gridRef: gridRef || null, latitude: null, longitude: null, accuracyM: null });
  };

  // Added after the fact, so there's no position to stamp: the new sighting
  // takes the report's location unless a grid ref is typed in.
  const addSpecies = (butterfly: Butterfly, count: number): void => {
    setLines((current) => {
      const existing = current.find((l) => l.speciesId === butterfly.id && !hasPosition(l));
      if (existing) {
        return current.map((l) => (l === existing ? { ...l, count: l.count + count } : l));
      }
      return [
        ...current,
        {
          key: crypto.randomUUID(),
          speciesId: butterfly.id,
          count,
          commonName: butterfly.commonName,
          notes: '',
          sex: null,
          lifeStage: null,
          gridRef: null,
          latitude: null,
          longitude: null,
          accuracyM: null,
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
        gridRef: l.gridRef?.trim() || null,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracyM: l.accuracyM,
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
          <li key={line.key} className={styles.line}>
            <div className={styles.lineMain}>
              <span className={styles.name}>{line.commonName}</span>
              <span className={styles.stepper} role="group" aria-label={`Count of ${line.commonName}`}>
                <button
                  type="button"
                  className={styles.step}
                  onClick={() => setCount(line.key, line.count - 1)}
                  aria-label={`One fewer ${line.commonName}`}
                >
                  −
                </button>
                <output className={styles.count}>{line.count}</output>
                <button
                  type="button"
                  className={styles.step}
                  onClick={() => setCount(line.key, line.count + 1)}
                  aria-label={`One more ${line.commonName}`}
                >
                  +
                </button>
              </span>
              <SexControl
                value={line.sex}
                onChange={(next) => patchLine(line.key, { sex: next })}
                speciesName={line.commonName}
              />
            </div>
            <input
              type="text"
              className={styles.gridRef}
              value={line.gridRef ?? ''}
              placeholder={
                line.latitude != null && line.longitude != null
                  ? `${line.latitude.toFixed(5)}, ${line.longitude.toFixed(5)}`
                  : `Grid ref — ${meta.gridRef.trim() || 'same as report'}`
              }
              onChange={(e) => setGridRef(line.key, e.target.value)}
              aria-label={`Grid reference of ${line.commonName}`}
              autoComplete="off"
              spellCheck={false}
            />
            <LifeStageControl
              value={line.lifeStage}
              onChange={(next) => patchLine(line.key, { lifeStage: next })}
              speciesName={line.commonName}
            />
            <input
              type="text"
              className={styles.note}
              value={line.notes}
              placeholder={`Comment on this ${line.commonName.toLowerCase()}…`}
              onChange={(e) => patchLine(line.key, { notes: e.target.value })}
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
