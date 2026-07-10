import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api';
import { useRecorder } from './lib/recorder';
import { useSession } from './lib/auth-client';
import { combineToIso, toDateInput, toTimeInput } from './lib/datetime';
import { useGeolocation } from './hooks/useGeolocation';
import { useButterflies } from './hooks/useButterflies';
import { useReports } from './hooks/useReports';
import { useDraftReport } from './hooks/useDraftReport';
import { LocationBar } from './components/LocationBar';
import { AccountControl } from './components/AccountControl';
import { TabBar, type Tab } from './components/TabBar';
import { ReportDetails, type ReportMeta } from './components/ReportDetails';
import { ButterflyGrid } from './components/ButterflyGrid';
import { SpeciesSearch } from './components/SpeciesSearch';
import { DraftPanel } from './components/DraftPanel';
import { ReportsList } from './components/ReportsList';
import { Snackbar, type SnackbarState } from './components/Snackbar';
import type { GridSpecies, Report, ReportPatch } from './types/models';
import styles from './App.module.css';

function freshMeta(): ReportMeta {
  const now = new Date();
  return { date: toDateInput(now), time: toTimeInput(now), gridRef: '', locationName: '' };
}

export default function App(): React.ReactElement {
  const recorder = useRecorder();
  const geo = useGeolocation();
  const butterflies = useButterflies(recorder.id);
  const reports = useReports(recorder.id);
  const draft = useDraftReport();

  const [tab, setTab] = useState<Tab>('log');
  const [meta, setMeta] = useState<ReportMeta>(freshMeta);
  const [saving, setSaving] = useState(false);
  const [savingReportId, setSavingReportId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  // Optional sign-in: when a recorder signs in, claim this device's anonymous
  // reports for their account, then reload so the view reflects all devices.
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const { refreshTop } = butterflies;
  const { refresh: refreshReports } = reports;
  const linkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId) {
      if (linkedUserRef.current === userId) return;
      linkedUserRef.current = userId;
      api
        .linkDevice(recorder.id)
        .catch(() => {
          /* linking is best-effort; the reports still load below */
        })
        .finally(() => {
          refreshTop();
          refreshReports();
        });
    } else {
      linkedUserRef.current = null;
      refreshTop();
      refreshReports();
    }
  }, [userId, recorder.id, refreshTop, refreshReports]);

  // The primary grid adapts: a recorder's regulars once they have history,
  // otherwise the common, garden-friendly starter set.
  const gridSpecies: GridSpecies[] = useMemo(() => {
    if (butterflies.top.length > 0) return butterflies.top;
    return butterflies.species.filter((s) => s.sortOrder < 500);
  }, [butterflies.top, butterflies.species]);

  const gridHeading = butterflies.top.length > 0 ? 'Your regulars' : 'Common butterflies';

  const handleSaveDraft = async (): Promise<void> => {
    if (draft.lines.length === 0) return;
    setSaving(true);
    try {
      const row = await api.createReport({
        recorderId: recorder.id,
        recorderName: recorder.name || null,
        // An untouched grid-ref field means "follow the live GPS reading".
        gridRef: meta.gridRef.trim() || geo.gridRef?.text || null,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracyM: geo.accuracyM,
        locationName: meta.locationName.trim() || null,
        observedAt: combineToIso(meta.date, meta.time),
        sightings: draft.lines.map((l) => ({ speciesId: l.species.id, count: l.count })),
      });

      draft.clear();
      setMeta(freshMeta());
      reports.refresh();
      butterflies.refreshTop();
      setSnackbar({
        message: `Report saved — ${draft.lines.length} species, ${draft.totalIndividuals} butterflies`,
        undoId: row.id,
      });
    } catch (err) {
      setSnackbar({ message: `Couldn't save — ${(err as Error).message}`, undoId: null });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async (reportId: string): Promise<void> => {
    setSnackbar(null);
    try {
      await api.deleteReport(reportId, recorder.id);
    } finally {
      reports.refresh();
      butterflies.refreshTop();
    }
  };

  const handleEditSave = async (
    report: Report,
    patch: Omit<ReportPatch, 'recorderId'>,
  ): Promise<void> => {
    setSavingReportId(report.id);
    try {
      await api.updateReport(report.id, { ...patch, recorderId: recorder.id });
      reports.refresh();
      butterflies.refreshTop();
    } catch (err) {
      setSnackbar({ message: `Couldn't save — ${(err as Error).message}`, undoId: null });
    } finally {
      setSavingReportId(null);
    }
  };

  const handleDelete = async (report: Report): Promise<void> => {
    try {
      await api.deleteReport(report.id, recorder.id);
      setSnackbar({ message: 'Report deleted', undoId: null });
    } catch (err) {
      setSnackbar({ message: `Couldn't delete — ${(err as Error).message}`, undoId: null });
    } finally {
      reports.refresh();
      butterflies.refreshTop();
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            🦋
          </span>
          <h1 className={styles.title}>Flutterby</h1>
        </div>
        <div className={styles.headerRight}>
          <AccountControl />
          <label className={styles.recorder}>
            <span className={styles.recorderLabel}>Recorder</span>
            <input
              className={styles.recorderInput}
              type="text"
              placeholder="Your name"
              defaultValue={recorder.name}
              onBlur={(e) => recorder.setName(e.target.value)}
              autoComplete="name"
            />
          </label>
        </div>
      </header>

      <TabBar active={tab} onChange={setTab} reportCount={reports.reports.length} />

      {tab === 'log' ? (
        <main className={styles.main}>
          <LocationBar geo={geo} />

          <ReportDetails
            meta={meta}
            onChange={setMeta}
            liveGridRef={geo.gridRef?.text ?? null}
            onUseCurrentLocation={() => setMeta((m) => ({ ...m, gridRef: '' }))}
          />

          {butterflies.error && (
            <p className={styles.error} role="alert">
              Couldn't load the butterfly list: {butterflies.error}
            </p>
          )}

          <section className={styles.section} aria-labelledby="grid-heading">
            <SpeciesSearch species={butterflies.species} onLog={draft.add} />
            <h2 id="grid-heading" className={styles.sectionTitle}>
              {gridHeading}
            </h2>
            {butterflies.loading ? (
              <p className={styles.hint}>Loading butterflies…</p>
            ) : (
              <ButterflyGrid species={gridSpecies} onLog={draft.add} />
            )}
          </section>

          <DraftPanel draft={draft} saving={saving} onSave={() => void handleSaveDraft()} />
        </main>
      ) : (
        <main className={styles.main}>
          <section className={styles.section} aria-labelledby="reports-heading">
            <h2 id="reports-heading" className={styles.sectionTitle}>
              Your reports
            </h2>
            <ReportsList
              reports={reports.reports}
              species={butterflies.species}
              loading={reports.loading}
              savingId={savingReportId}
              onSave={handleEditSave}
              onDelete={(report) => void handleDelete(report)}
            />
          </section>
        </main>
      )}

      <Snackbar
        snackbar={snackbar}
        onUndo={(id) => void handleUndo(id)}
        onDismiss={() => setSnackbar(null)}
      />
    </div>
  );
}
