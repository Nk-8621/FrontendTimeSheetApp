import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
   * instead of sliding in from the right - used for Add / Edit Task.
   * 'centerSmall' (Nov 2026) is the same centered box, narrower and only as
   * tall as its form - for short Master Data forms. */
  size?: 'normal' | 'wide' | 'center' | 'centerSmall';
}

/** Both centered sizes open, animate and close the same way. */
const isCentered = (size: DrawerOptions['size']) => size === 'center' || size === 'centerSmall';

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
  const drawerRef = useRef<HTMLElement>(null);
  // 'on' is added one frame after the box is placed, so it can grow from its start point.
  const [shown, setShown] = useState(false);
  // What the box shows. Kept for a moment after closing so a centered box
  // shrinks back with its content, then cleared when the animation ends.
  const [content, setContent] = useState<DrawerOptions | null>(null);

  // POP-OUT (Nov 2026): where the last click happened - a centered box grows
  // out of the button that opened it, and shrinks back into it when closed.
  const lastClick = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => { lastClick.current = { x: e.clientX, y: e.clientY }; };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  const openDrawer = useCallback((opts: DrawerOptions) => {
    lastSize.current = opts.size ?? 'normal';
    const box = drawerRef.current;
    if (isCentered(opts.size) && box) {
      // Start point = the click (or the middle of the screen if opened by keyboard),
      // stored as an offset from the screen centre for the CSS to use.
      const from = lastClick.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      box.style.setProperty('--pop-x', `${from.x - window.innerWidth / 2}px`);
      box.style.setProperty('--pop-y', `${from.y - window.innerHeight / 2}px`);
      setShown(false);
      setDrawer(opts);
      setContent(opts);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setDrawer(opts);
      setContent(opts);
      setShown(true);
    }
  }, []);
  const closeDrawer = useCallback(() => {
    setDrawer(null);
    if (!isCentered(lastSize.current)) setContent(null);
  }, []);

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
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${lastSize.current === 'wide' ? styles.wide : ''} ${isCentered(lastSize.current) ? `${styles.center} center-box` : ''} ${lastSize.current === 'centerSmall' ? styles.small : ''} ${drawer && shown ? styles.on : ''}`}
        onTransitionEnd={(e) => { if (e.target === e.currentTarget && !drawer) setContent(null); }}
      >
        {content && (
          <>
            <div className={styles.head}>
              <div>
                <h3>{content.title}</h3>
                {content.subtitle && <div className={styles.sub}>{content.subtitle}</div>}
              </div>
              <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Close">
                &times;
              </button>
            </div>
            <div className={styles.body}>{content.body}</div>
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
