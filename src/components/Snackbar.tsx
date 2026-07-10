import { useEffect, useRef } from 'react';
import styles from './Snackbar.module.css';

export interface SnackbarState {
  message: string;
  undoId: string | null;
}

interface Props {
  snackbar: SnackbarState | null;
  onUndo: (id: string) => void;
  onDismiss: () => void;
}

export function Snackbar({ snackbar, onUndo, onDismiss }: Props): React.ReactElement | null {
  // The timer must key on the snackbar itself, not the callback identity —
  // parent re-renders (e.g. live GPS updates) would otherwise reset it forever.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(() => onDismissRef.current(), 6000);
    return () => clearTimeout(timer);
  }, [snackbar]);

  if (!snackbar) return null;

  return (
    <div className={styles.snackbar} role="status">
      <span className={styles.message}>{snackbar.message}</span>
      {snackbar.undoId && (
        <button
          type="button"
          className={styles.undo}
          onClick={() => onUndo(snackbar.undoId as string)}
        >
          Undo
        </button>
      )}
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
