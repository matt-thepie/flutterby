import { useEffect } from 'react';
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
  useEffect(() => {
    if (!snackbar) return;
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [snackbar, onDismiss]);

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
    </div>
  );
}
