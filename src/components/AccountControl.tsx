import { useEffect, useState } from 'react';
import { signIn, signOut, useSession } from '../lib/auth-client';
import { api } from '../lib/api';
import styles from './AccountControl.module.css';

type Provider = 'google' | 'facebook' | 'apple';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

export function AccountControl(): React.ReactElement | null {
  const { data } = useSession();
  const [providers, setProviders] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getConfig()
      .then((config) => active && setProviders(config.providers))
      .catch(() => {
        /* no config → login simply isn't offered; the app stays anonymous */
      });
    return () => {
      active = false;
    };
  }, []);

  const user = data?.user ?? null;

  if (user) {
    return (
      <div className={styles.account}>
        <span className={styles.who} title={user.email}>
          {user.name || user.email}
        </span>
        <button type="button" className={styles.link} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  // Login is optional and only useful for multi-device sync — if no providers
  // are configured, show nothing at all.
  if (providers.length === 0) return null;

  return (
    <div className={styles.account}>
      {open ? (
        <div className={styles.providers} role="group" aria-label="Sign in with">
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.provider}
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void signIn.social({ provider: p as Provider, callbackURL: window.location.href });
              }}
            >
              {PROVIDER_LABELS[p] ?? p}
            </button>
          ))}
          <button
            type="button"
            className={styles.cancel}
            onClick={() => setOpen(false)}
            aria-label="Cancel sign in"
          >
            ✕
          </button>
        </div>
      ) : (
        <button type="button" className={styles.signIn} onClick={() => setOpen(true)}>
          Sign in to sync
        </button>
      )}
    </div>
  );
}
