import { useEffect, useRef, useState } from 'react';
import styles from './InstallPrompt.module.css';

/** Chrome/Edge/Android fire this; Safari never does. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'flutterby.installDismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari's pre-standard flag.
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ masquerades as macOS but is touch-first.
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

type Mode = 'hidden' | 'native' | 'ios';

/**
 * A gentle "install for offline recording" toast.
 *
 * On Chromium the browser hands us a real install prompt (beforeinstallprompt).
 * iPhones have no install API at all — the only route is Safari's own
 * Share → "Add to Home Screen", so there we show step-by-step instructions.
 */
export function InstallPrompt(): React.ReactElement | null {
  const [mode, setMode] = useState<Mode>('hidden');
  const [showIosSteps, setShowIosSteps] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstall = (e: Event): void => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setMode('native');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS never fires the event — offer instructions after a polite delay
    // (kept clear of the location prompt on first load).
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => setMode((m) => (m === 'hidden' ? 'ios' : m)), 6000);
    }

    const onInstalled = (): void => setMode('hidden');
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (showIosSteps) dialog?.showModal();
    return () => dialog?.close();
  }, [showIosSteps]);

  const dismiss = (): void => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setMode('hidden');
    setShowIosSteps(false);
  };

  const install = async (): Promise<void> => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') setMode('hidden');
  };

  if (mode === 'hidden') return null;

  return (
    <>
      <div className={styles.toast} role="region" aria-label="Install the app">
        <img className={styles.toastIcon} src="/icon-192.png" alt="" width="36" height="36" />
        <div className={styles.toastBody}>
          <strong className={styles.toastTitle}>Install Flutterby</strong>
          <span className={styles.toastDetail}>
            Works offline — record anywhere, upload when you're back in signal.
          </span>
        </div>
        {mode === 'native' ? (
          <button type="button" className={styles.cta} onClick={() => void install()}>
            Install
          </button>
        ) : (
          <button type="button" className={styles.cta} onClick={() => setShowIosSteps(true)}>
            Show me how
          </button>
        )}
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Not now">
          ✕
        </button>
      </div>

      {showIosSteps && (
        <dialog
          ref={dialogRef}
          className={styles.iosDialog}
          aria-labelledby="ios-install-title"
          onCancel={(e) => {
            e.preventDefault();
            setShowIosSteps(false);
          }}
        >
          <h2 id="ios-install-title" className={styles.iosTitle}>
            Add Flutterby to your Home Screen
          </h2>
          <ol className={styles.steps}>
            <li>
              Open this page in <strong>Safari</strong> (installing only works from Safari).
            </li>
            <li>
              Tap the <strong>Share</strong> button{' '}
              <span className={styles.shareGlyph} aria-hidden="true">
                ⎋
              </span>{' '}
              — the square with an arrow, at the bottom of the screen.
            </li>
            <li>
              Scroll down and tap <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong>. Flutterby appears like an app — and works with no signal.
            </li>
          </ol>
          <div className={styles.iosActions}>
            <button type="button" className={styles.cta} onClick={() => setShowIosSteps(false)}>
              Got it
            </button>
            <button type="button" className={styles.later} onClick={dismiss}>
              Don't show again
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
