import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog';
import styles from './UIProvider.module.css';

interface DrawerOptions {
  title: string;
  subtitle?: string;
  body: ReactNode;
  /** 'wide' is for a guided, multi-section flow that needs room for a live
   * summary alongside its fields (e.g. the guided project setup flow) —
   * every other drawer keeps the normal fixed width.
   * 'center' (Nov 2026) opens it as a box in the middle of the screen
   * instead of sliding in from the right - used for Add / Edit Task. */
  size?: 'normal' | 'wide' | 'center';
}

interface UIValue {
  openDrawer: (opts: DrawerOptions) => void;
  closeDrawer: () => void;
  toast: (message: string, kind?: 'ok' | 'bad') => void;
  /** Shows the in-app confirmation box; resolves true for the confirm button,
   * false for Cancel / Esc / click outside. Use instead of window.confirm. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerOptions | null>(null);
  const [toastState, setToastState] = useState<{ message: string; kind?: 'ok' | 'bad' } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOptions | null>(null);
  // Answers the promise returned by confirm() once the user clicks a button.
  const confirmResolve = useRef<((ok: boolean) => void) | null>(null);

  // Remembers the last size so a centered box fades out in place when closed
  // (instead of switching to the right-hand drawer while it closes).
  const lastSize = useRef<DrawerOptions['size']>('normal');
  const openDrawer = useCallback((opts: DrawerOptions) => {
    lastSize.current = opts.size ?? 'normal';
    setDrawer(opts);
  }, []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const toast = useCallback((message: string, kind?: 'ok' | 'bad') => {
    setToastState({ message, kind });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastState(null), 2600);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setConfirmOpts(opts);
    return new Promise<boolean>((resolve) => { confirmResolve.current = resolve; });
  }, []);
  const closeConfirm = useCallback((ok: boolean) => {
    confirmResolve.current?.(ok);
    confirmResolve.current = null;
    setConfirmOpts(null);
  }, []);
  const confirmYes = useCallback(() => closeConfirm(true), [closeConfirm]);
  const confirmNo = useCallback(() => closeConfirm(false), [closeConfirm]);

  return (
    <UIContext.Provider value={{ openDrawer, closeDrawer, toast, confirm }}>
      {children}

      <div className={`${styles.scrim} ${drawer ? styles.on : ''}`} onClick={closeDrawer} />
      <aside className={`${styles.drawer} ${lastSize.current === 'wide' ? styles.wide : ''} ${lastSize.current === 'center' ? styles.center : ''} ${drawer ? styles.on : ''}`}>
        {drawer && (
          <>
            <div className={styles.head}>
              <div>
                <h3>{drawer.title}</h3>
                {drawer.subtitle && <div className={styles.sub}>{drawer.subtitle}</div>}
              </div>
              <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Close">
                &times;
              </button>
            </div>
            <div className={styles.body}>{drawer.body}</div>
          </>
        )}
      </aside>

      {confirmOpts && <ConfirmDialog {...confirmOpts} onConfirm={confirmYes} onCancel={confirmNo} />}

      {toastState && (
        <div className={`${styles.toast} ${toastState.kind ? styles[toastState.kind] : ''}`}>
          {toastState.message}
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
