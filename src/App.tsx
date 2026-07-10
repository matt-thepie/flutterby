import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api';
import { useRecorder } from './lib/recorder';
import { useSession } from './lib/auth-client';
import { combineToIso } from './lib/datetime';
import { useGeolocation } from './hooks/useGeolocation';
import { useButterflies } from './hooks/useButterflies';
import { useReports } from './hooks/useReports';
import { useDraftReport } from './hooks/useDraftReport';
import { useUploadQueue } from './hooks/useUploadQueue';
import { AccountControl } from './components/AccountControl';
import { TabBar, type Tab } from './components/TabBar';
import { VisitDetails } from './components/VisitDetails';
import { LocationModal } from './components/LocationModal';
import { InstallPrompt } from './components/InstallPrompt';
import { NameModal } from './components/NameModal';
import { ButterflyGrid } from './components/ButterflyGrid';
import { SpeciesSearch } from './components/SpeciesSearch';
import { DraftPanel } from './components/DraftPanel';
import { ReportsList } from './components/ReportsList';
import { PendingReports } from './components/PendingReports';
import { Snackbar, type SnackbarState } from './components/Snackbar';
import type { GridSpecies, NewReportInput, Report, ReportPatch } from './types/models';
import styles from './App.module.css';

export default function App(): React.ReactElement {
  const recorder = useRecorder();
  const geo = useGeolocation();
  const butterflies = useButterflies(recorder.id);
  const reports = useReports(recorder.id);
  const draft = useDraftReport();

  const [tab, setTab] = useState<Tab>('log');
  const [saving, setSaving] = useState(false);
  const [savingReportId, setSavingReportId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  // Our explanatory prompt goes in front of the browser's location dialog.
  // "No thanks" is remembered; a "Turn on" button in visit details undoes it.
  const [locDeclined, setLocDeclined] = useState(() =>
    Boolean(localStorage.getItem('flutterby.locationDeclined')),
  );
  const [locModalResolved, setLocModalResolved] = useState(false);
  const showLocationModal =
    !geo.started &&
    !locDeclined &&
    !locModalResolved &&
    (geo.permission === 'prompt' || geo.permission === 'unknown');

  const enableLocation = useCallback(() => {
    localStorage.removeItem('flutterby.locationDeclined');
    setLocDeclined(false);
    setLocModalResolved(true);
    geo.start();
  }, [geo]);

  const declineLocation = useCallback(() => {
    localStorage.setItem('flutterby.locationDeclined', '1');
    setLocDeclined(true);
    setLocModalResolved(true);
  }, []);

  const { refreshTop } = butterflies;
  const { refresh: refreshReports } = reports;

  // Finished reports that couldn't reach the server retry automatically; when
  // one lands, refresh so it moves from "in progress" to the findings list.
  const onQueueUploaded = useCallback(() => {
    refreshReports();
    refreshTop();
    setSnackbar({ message: 'Queued report uploaded', undoId: null });
  }, [refreshReports, refreshTop]);
  const queue = useUploadQueue(onQueueUploaded);

  // Optional sign-in: when a recorder signs in, claim this device's anonymous
  // reports for their account, then reload so the view reflects all devices.
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userName = session?.user?.name ?? null;
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

  // Signed in and the draft has no recorder name yet → fill it from the account.
  const { meta, setMeta } = draft;
  useEffect(() => {
    if (userName && !meta.recorderName) {
      setMeta({ ...meta, recorderName: userName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  // A recorder's regulars lead once they have history, with the common
  // starter set following (minus anything already shown as a regular).
  const regulars: GridSpecies[] = butterflies.top;
  const common: GridSpecies[] = useMemo(() => {
    const shown = new Set(regulars.map((s) => s.id));
    return butterflies.species.filter((s) => s.sortOrder < 500 && !shown.has(s.id));
  }, [regulars, butterflies.species]);

  const [askName, setAskName] = useState(false);

  const buildInput = (recorderName: string): NewReportInput => ({
    recorderId: recorder.id,
    recorderName,
    // An untouched grid-ref field means "follow the live GPS reading".
    gridRef: draft.meta.gridRef.trim() || geo.gridRef?.text || null,
    latitude: geo.latitude,
    longitude: geo.longitude,
    accuracyM: geo.accuracyM,
    locationName: draft.meta.locationName.trim() || null,
    observedAt: combineToIso(draft.meta.date, draft.meta.time),
    sightings: draft.lines.map((l) => ({ speciesId: l.species.id, count: l.count })),
  });

  // "Mark as done": the draft stops being an in-progress report. It's uploaded
  // immediately when we can, otherwise queued until the signal returns.
  // A report without a recorder's name is no use to the county recorder, so a
  // missing name detours through the who-are-you modal first.
  const handleMarkDone = async (nameOverride?: string): Promise<void> => {
    if (draft.lines.length === 0) return;
    const recorderName = (nameOverride ?? draft.meta.recorderName).trim();
    if (!recorderName) {
      setAskName(true);
      return;
    }
    if (nameOverride) draft.setMeta({ ...draft.meta, recorderName });

    const input = buildInput(recorderName);
    const summary = `${draft.lines.length} species, ${draft.totalIndividuals} butterflies`;
    recorder.setName(recorderName);
    setSaving(true);

    try {
      if (!navigator.onLine) throw new Error('offline');
      const row = await api.createReport(input);
      draft.clear();
      refreshReports();
      refreshTop();
      setSnackbar({ message: `Report saved — ${summary}`, undoId: row.id });
    } catch {
      queue.add(input);
      draft.clear();
      setSnackbar({
        message: `Report finished — ${summary}. It'll upload when you're back in signal.`,
        undoId: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async (reportId: string): Promise<void> => {
    setSnackbar(null);
    try {
      await api.deleteReport(reportId, recorder.id);
    } finally {
      refreshReports();
      refreshTop();
    }
  };

  const handleEditSave = async (
    report: Report,
    patch: Omit<ReportPatch, 'recorderId'>,
  ): Promise<void> => {
    setSavingReportId(report.id);
    try {
      await api.updateReport(report.id, { ...patch, recorderId: recorder.id });
      refreshReports();
      refreshTop();
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
      refreshReports();
      refreshTop();
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <picture>
          <source srcSet="/logo-full-dark.png" media="(prefers-color-scheme: dark)" />
          <img
            className={styles.logo}
            src="/logo-full.png"
            alt="Flutterby"
            width="240"
            height="96"
          />
        </picture>
        <AccountControl />
      </header>

      <TabBar
        active={tab}
        onChange={setTab}
        reportCount={reports.reports.length + queue.pending.length}
      />

      {tab === 'log' ? (
        <main className={styles.main}>
          <VisitDetails
            meta={draft.meta}
            onChange={draft.setMeta}
            geo={geo}
            onEnableLocation={enableLocation}
          />

          {butterflies.error && (
            <p className={styles.error} role="alert">
              Couldn't load the butterfly list: {butterflies.error}
            </p>
          )}

          <SpeciesSearch species={butterflies.species} onLog={draft.add} />

          {regulars.length > 0 && (
            <section className={styles.section} aria-labelledby="regulars-heading">
              <h2 id="regulars-heading" className={styles.sectionTitle}>
                Your regulars
              </h2>
              <ButterflyGrid species={regulars} onLog={draft.add} />
            </section>
          )}

          <section className={styles.section} aria-labelledby="common-heading">
            <h2 id="common-heading" className={styles.sectionTitle}>
              Common butterflies
            </h2>
            {butterflies.loading ? (
              <p className={styles.hint}>Loading butterflies…</p>
            ) : (
              <ButterflyGrid species={common} onLog={draft.add} />
            )}
          </section>

          <DraftPanel draft={draft} saving={saving} onSave={() => void handleMarkDone()} />
        </main>
      ) : (
        <main className={styles.main}>
          <PendingReports
            draft={draft}
            queued={queue.pending}
            online={navigator.onLine}
            onContinueDraft={() => setTab('log')}
            onRetryQueue={queue.flush}
          />

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

      {showLocationModal && <LocationModal onAllow={enableLocation} onDecline={declineLocation} />}
      {askName && (
        <NameModal
          onSubmit={(name) => {
            setAskName(false);
            void handleMarkDone(name);
          }}
          onCancel={() => setAskName(false)}
        />
      )}
      <InstallPrompt />

      <Snackbar
        snackbar={snackbar}
        onUndo={(id) => void handleUndo(id)}
        onDismiss={() => setSnackbar(null)}
      />
    </div>
  );
}
