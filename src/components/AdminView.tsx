import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Report, SightingLine } from '../types/models';
import { latLonToGridRef } from '../lib/osgrid';
import { RecordsMap, type MapLocation } from './RecordsMap';
import styles from './AdminView.module.css';

interface Props {
  onExit: () => void;
}

interface SightingRow extends SightingLine {
  recorder: string;
  observedAt: string;
  gridRef: string | null;
}

interface LocationGroup {
  key: string;
  label: string;
  gridRef: string | null;
  lat: number | null;
  lon: number | null;
  rows: SightingRow[];
  individuals: number;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const STAGE_LABELS: Record<string, string> = {
  egg: 'egg',
  larva: 'caterpillar',
  pupa: 'chrysalis',
};

/** Group all reports by their place (canonical name, else grid ref, else coords). */
function groupByLocation(reports: Report[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();

  for (const report of reports) {
    const key =
      report.locationName?.trim().toLowerCase() ||
      report.gridRef ||
      (report.latitude != null ? `${report.latitude},${report.longitude}` : 'unknown');

    let group = groups.get(key);
    if (!group) {
      const gridRef =
        report.gridRef ||
        (report.latitude != null && report.longitude != null
          ? (latLonToGridRef(report.latitude, report.longitude)?.text ?? null)
          : null);
      group = {
        key,
        label: report.locationName?.trim() || gridRef || 'Unknown location',
        gridRef,
        lat: report.latitude,
        lon: report.longitude,
        rows: [],
        individuals: 0,
      };
      groups.set(key, group);
    }
    if (group.lat == null && report.latitude != null) {
      group.lat = report.latitude;
      group.lon = report.longitude;
    }
    for (const s of report.sightings) {
      group.rows.push({
        ...s,
        recorder: report.recorderName?.trim() || 'Anonymous',
        observedAt: report.observedAt,
        gridRef: report.gridRef,
      });
      group.individuals += s.count;
    }
  }

  return [...groups.values()].sort((a, b) => b.individuals - a.individuals);
}

export function AdminView({ onExit }: Props): React.ReactElement {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAdminRecords()
      .then(setReports)
      .catch((e: Error) => setError(e.message));
  }, []);

  const groups = useMemo(() => (reports ? groupByLocation(reports) : []), [reports]);
  const mapLocations: MapLocation[] = useMemo(
    () =>
      groups
        .filter((g) => g.lat != null && g.lon != null)
        .map((g) => ({ key: g.key, label: g.label, lat: g.lat!, lon: g.lon!, individuals: g.individuals })),
    [groups],
  );

  const selectedGroup = groups.find((g) => g.key === selected) ?? null;
  const totals = useMemo(() => {
    const individuals = groups.reduce((sum, g) => sum + g.individuals, 0);
    const species = new Set(groups.flatMap((g) => g.rows.map((r) => r.speciesId))).size;
    return { individuals, species, locations: groups.length };
  }, [groups]);

  return (
    <div className={styles.view}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Records</h1>
          {reports && (
            <p className={styles.summary}>
              {totals.individuals} butterflies · {totals.species} species · {totals.locations}{' '}
              locations
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <a className={styles.download} href="/api/admin/export.xlsx">
            Download Excel
          </a>
          <a className={styles.downloadSecondary} href="/api/admin/export.csv">
            CSV
          </a>
          <button type="button" className={styles.exit} onClick={onExit}>
            Back to app
          </button>
        </div>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          Couldn't load records: {error}
        </p>
      )}
      {!reports && !error && <p className={styles.hint}>Loading records…</p>}

      {reports && reports.length === 0 && (
        <p className={styles.hint}>No records logged yet.</p>
      )}

      {reports && reports.length > 0 && (
        <>
          {mapLocations.length > 0 && (
            <RecordsMap locations={mapLocations} selectedKey={selected} onSelect={setSelected} />
          )}

          <div className={styles.body}>
            <ul className={styles.locationList}>
              {groups.map((g) => (
                <li key={g.key}>
                  <button
                    type="button"
                    className={styles.locationButton}
                    aria-current={g.key === selected}
                    onClick={() => setSelected(g.key)}
                  >
                    <span className={styles.locationName}>{g.label}</span>
                    <span className={styles.locationMeta}>
                      {g.gridRef ?? 'no grid ref'} · {g.individuals} butterfl
                      {g.individuals === 1 ? 'y' : 'ies'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.detail}>
              {selectedGroup ? (
                <>
                  <h2 className={styles.detailTitle}>{selectedGroup.label}</h2>
                  <p className={styles.detailMeta}>{selectedGroup.gridRef ?? 'no grid reference'}</p>
                  <ul className={styles.sightingList}>
                    {selectedGroup.rows.map((row, i) => (
                      <li key={`${row.speciesId}-${i}`} className={styles.sighting}>
                        {row.imageUrl ? (
                          <img className={styles.thumb} src={row.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <span className={styles.thumbPlaceholder} aria-hidden="true">
                            🦋
                          </span>
                        )}
                        <div className={styles.sightingBody}>
                          <span className={styles.sightingName}>
                            {row.count} × {row.commonName}
                            {row.sex && (
                              <span className={styles.sex} title={row.sex}>
                                {row.sex === 'male' ? '♂' : '♀'}
                              </span>
                            )}
                            {row.lifeStage && row.lifeStage !== 'adult' && (
                              <span className={styles.stage}>{STAGE_LABELS[row.lifeStage]}</span>
                            )}
                          </span>
                          <span className={styles.sightingMeta}>
                            {dateFmt.format(new Date(row.observedAt))} · {row.recorder}
                          </span>
                          {row.notes && <span className={styles.sightingNote}>“{row.notes}”</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={styles.hint}>Pick a location on the map or list to see what was seen there.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
