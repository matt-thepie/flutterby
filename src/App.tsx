import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api';
import { useRecorder } from './lib/recorder';
import { useSession } from './lib/auth-client';
import { useGeolocation } from './hooks/useGeolocation';
import { useButterflies } from './hooks/useButterflies';
import { useSightings } from './hooks/useSightings';
import { LocationBar } from './components/LocationBar';
import { AccountControl } from './components/AccountControl';
import { ButterflyGrid } from './components/ButterflyGrid';
import { SpeciesSearch } from './components/SpeciesSearch';
import { RecentSightings } from './components/RecentSightings';
import { Snackbar, type SnackbarState } from './components/Snackbar';
import type { Butterfly, GridSpecies, Sighting } from './types/models';
import styles from './App.module.css';

export default function App(): React.ReactElement {
  const recorder = useRecorder();
  const geo = useGeolocation();
  const butterflies = useButterflies(recorder.id);
  const sightings = useSightings(recorder.id);
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

  // Optional sign-in: when a recorder signs in, claim this device's anonymous
  // sightings for their account, then reload so the view reflects all devices.
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const { refreshTop } = butterflies;
  const { refresh: refreshSightings } = sightings;
  const linkedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (userId) {
      if (linkedUserRef.current === userId) return;
      linkedUserRef.current = userId;
      api
        .linkDevice(recorder.id)
        .catch(() => {
          /* linking is best-effort; the sightings still load below */
        })
        .finally(() => {
          refreshTop();
          refreshSightings();
        });
    } else {
      linkedUserRef.current = null;
      refreshTop();
      refreshSightings();
    }
  }, [userId, recorder.id, refreshTop, refreshSightings]);

  // The primary grid adapts: a recorder's regulars once they have history,
  // otherwise the common, garden-friendly starter set.
  const gridSpecies: GridSpecies[] = useMemo(() => {
    if (butterflies.top.length > 0) return butterflies.top;
    return butterflies.species.filter((s) => s.sortOrder < 500);
  }, [butterflies.top, butterflies.species]);

  const gridHeading = butterflies.top.length > 0 ? 'Your regulars' : 'Common butterflies';

  const handleLog = async (species: Butterfly, count: number): Promise<void> => {
    try {
      const row = await api.createSighting({
        speciesId: species.id,
        count,
        recorderId: recorder.id,
        recorderName: recorder.name || null,
        gridRef: geo.gridRef?.text ?? null,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracyM: geo.accuracyM,
      });

      const sighting: Sighting = {
        id: row.id,
        speciesId: species.id,
        commonName: species.commonName,
        scientificName: species.scientificName,
        count: row.count,
        gridRef: row.gridRef,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracyM: row.accuracyM,
        notes: row.notes,
        observedAt: row.observedAt,
      };

      sightings.addLocal(sighting);
      butterflies.refreshTop();
      setSnackbar({
        message: `Logged ${count} ${species.commonName}${count > 1 ? 's' : ''}`,
        sightingId: row.id,
      });
    } catch (err) {
      setSnackbar({ message: `Couldn't save — ${(err as Error).message}`, sightingId: null });
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    sightings.removeLocal(id);
    setSnackbar(null);
    try {
      await api.deleteSighting(id, recorder.id);
      butterflies.refreshTop();
    } catch {
      sightings.refresh();
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

      <LocationBar geo={geo} />

      <main className={styles.main}>
        {butterflies.error && (
          <p className={styles.error} role="alert">
            Couldn't load the butterfly list: {butterflies.error}
          </p>
        )}

        <section className={styles.section} aria-labelledby="grid-heading">
          <h2 id="grid-heading" className={styles.sectionTitle}>
            {gridHeading}
          </h2>
          {butterflies.loading ? (
            <p className={styles.hint}>Loading butterflies…</p>
          ) : (
            <ButterflyGrid species={gridSpecies} onLog={handleLog} />
          )}
        </section>

        <section className={styles.section} aria-labelledby="search-heading">
          <h2 id="search-heading" className={styles.sectionTitle}>
            Log another species
          </h2>
          <SpeciesSearch species={butterflies.species} onLog={handleLog} />
        </section>

        <section className={styles.section} aria-labelledby="recent-heading">
          <h2 id="recent-heading" className={styles.sectionTitle}>
            Recent sightings
          </h2>
          <RecentSightings sightings={sightings.recents} onDelete={handleDelete} />
        </section>
      </main>

      <Snackbar snackbar={snackbar} onUndo={handleDelete} onDismiss={() => setSnackbar(null)} />
    </div>
  );
}
