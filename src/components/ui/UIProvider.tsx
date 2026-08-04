import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import styles from './UIProvider.module.css';

interface DrawerOptions {
  title: string;
  subtitle?: string;
  body: ReactNode;
}

interface UIValue {
  openDrawer: (opts: DrawerOptions) => void;
  closeDrawer: () => void;
  toast: (message: string, kind?: 'ok' | 'bad') => void;
}

const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerOptions | null>(null);
  const [toastState, setToastState] = useState<{ message: string; kind?: 'ok' | 'bad' } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const openDrawer = useCallback((opts: DrawerOptions) => setDrawer(opts), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);

  const toast = useCallback((message: string, kind?: 'ok' | 'bad') => {
    setToastState({ message, kind });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastState(null), 2600);
  }, []);

  return (
    <UIContext.Provider value={{ openDrawer, closeDrawer, toast }}>
      {children}

      <div className={`${styles.scrim} ${drawer ? styles.on : ''}`} onClick={closeDrawer} />
      <aside className={`${styles.drawer} ${drawer ? styles.on : ''}`}>
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
