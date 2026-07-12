import { useEffect, useRef, useState } from 'react';
import type { PlaceSuggestion } from '../hooks/usePlaceSuggestion';
import styles from './PlaceModal.module.css';

interface Props {
  suggestion: PlaceSuggestion | null;
  gridRef: string | null;
  onConfirm: (name: string) => void;
  onSkip: () => void;
  onCancel: () => void;
}

/**
 * "Where was this?" — shown at mark-as-done when the report has no place
 * name. Prefilled with the best guess (a remembered place nearby, or a
 * reverse-geocoded name); the recorder confirms or corrects it, and the
 * confirmed name is remembered as the canonical name for this spot.
 */
export function PlaceModal({
  suggestion,
  gridRef,
  onConfirm,
  onSkip,
  onCancel,
}: Props): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(suggestion?.name ?? '');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onConfirm(trimmed);
    else inputRef.current?.focus();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="place-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="place-title" className={styles.title}>
        Where was this?
      </h2>
      <p className={styles.copy}>
        {suggestion
          ? suggestion.source === 'remembered'
            ? 'Looks like one of your usual spots — confirm or correct it.'
            : 'Best guess from your grid reference — confirm or correct it.'
          : 'Give this spot a name so your reports always call it the same thing.'}
        {gridRef && (
          <>
            {' '}
            <span className={styles.gridref}>({gridRef})</span>
          </>
        )}
      </p>

      <form className={styles.form} onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="e.g. Lamorna Cove"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Place name"
        />
        <button type="submit" className={styles.confirm} disabled={!name.trim()}>
          {suggestion && name.trim() === suggestion.name
            ? "Yes, that's the place"
            : 'Use this name'}
        </button>
      </form>

      <p className={styles.hint}>
        It'll be remembered — next time you're within a kilometre, this name is offered first.
        {suggestion?.source === 'osm' && ' Suggestion © OpenStreetMap contributors.'}
      </p>

      <div className={styles.secondary}>
        <button type="button" className={styles.skip} onClick={onSkip}>
          Save without a place name
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Back
        </button>
      </div>
    </dialog>
  );
}
