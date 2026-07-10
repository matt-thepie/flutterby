import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { signIn } from '../lib/auth-client';
import styles from './NameModal.module.css';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

interface Props {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/**
 * Reports need a recorder name to be worth anything to the county recorder.
 * Asked at "mark as done" if the name is still blank — type it once (it's
 * remembered), or sign in and it's filled from the account automatically,
 * on this and every other device.
 */
export function NameModal({ onSubmit, onCancel }: Props): React.ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getConfig()
      .then((config) => active && setProviders(config.providers))
      .catch(() => {
        /* offline or no providers — manual name entry still works */
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
    else inputRef.current?.focus();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="name-title"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <h2 id="name-title" className={styles.title}>
        Whose sightings are these?
      </h2>
      <p className={styles.copy}>
        Reports need a recorder's name to count — it's saved with this report and remembered for
        next time.
      </p>

      <form className={styles.form} onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          aria-label="Recorder name"
        />
        <button type="submit" className={styles.save} disabled={!name.trim()}>
          Save report
        </button>
      </form>

      {providers.length > 0 && (
        <>
          <p className={styles.divider} role="separator">
            or
          </p>
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.signIn}
              onClick={() =>
                void signIn.social({
                  provider: p as 'google' | 'facebook' | 'apple',
                  callbackURL: window.location.href,
                })
              }
            >
              Sign in with {PROVIDER_LABELS[p] ?? p} — fills your name automatically
            </button>
          ))}
          <p className={styles.hint}>
            Signing in also syncs your reports across devices. Your draft is kept safe while you
            sign in.
          </p>
        </>
      )}

      <button type="button" className={styles.cancel} onClick={onCancel}>
        Back
      </button>
    </dialog>
  );
}
