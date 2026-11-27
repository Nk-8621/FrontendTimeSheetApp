import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import styles from './DatePicker.module.css';

/* ---------- date helpers (local dates as YYYY-MM-DD, like <input type="date">) ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toIso = (dt: Date) => iso(dt.getFullYear(), dt.getMonth(), dt.getDate());
const addDaysIso = (s: string, n: number) => {
  const dt = parse(s);
  dt.setDate(dt.getDate() + n);
  return toIso(dt);
};
const todayIso = () => toIso(new Date());
const isValidIso = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function formatLong(s: string) {
  return parse(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** 6 x 7 grid of ISO dates for the month view, weeks starting Monday. */
function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Mon = 0
  const start = new Date(year, month, 1 - lead);
  return Array.from({ length: 42 }, (_, i) => toIso(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)));
}

/* ---------- calendar panel ---------- */

interface CalendarProps {
  value?: string;
  min?: string;
  max?: string;
  /** Optional range to shade (e.g. the selected week, or Reports from-to). */
  rangeStart?: string;
  rangeEnd?: string;
  /** Week mode: hovering / picking highlights the whole Mon-Sun week. */
  weekMode?: boolean;
  onPick: (value: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

function Calendar({ value, min, max, rangeStart, rangeEnd, weekMode, onPick, onClear, onClose }: CalendarProps) {
  const today = todayIso();
  const initial = isValidIso(value) ? value : today;
  const [view, setView] = useState(() => ({ y: parse(initial).getFullYear(), m: parse(initial).getMonth() }));
  const [focus, setFocus] = useState(initial);
  const [hoverWeek, setHoverWeek] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => monthGrid(view.y, view.m), [view]);
  const disabled = (d: string) => (isValidIso(min) && d < min) || (isValidIso(max) && d > max);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const lo = Math.min(isValidIso(min) ? parse(min).getFullYear() : now - 10, view.y);
    const hi = Math.max(isValidIso(max) ? parse(max).getFullYear() : now + 5, view.y);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  }, [min, max, view.y]);

  const shiftMonth = (n: number) =>
    setView((v) => {
      const dt = new Date(v.y, v.m + n, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() };
    });

  // Keep the keyboard-focused day visible and focused.
  useEffect(() => {
    const dt = parse(focus);
    if (dt.getFullYear() !== view.y || dt.getMonth() !== view.m) setView({ y: dt.getFullYear(), m: dt.getMonth() });
  // Only follow `focus` here - changing the month dropdown must not snap back.
  }, [focus]);
  useEffect(() => {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focus}"]`)?.focus({ preventScroll: true });
  }, [focus, view]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in moves) {
      e.preventDefault();
      setFocus((f) => addDaysIso(f, moves[e.key]));
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      const dt = parse(focus);
      dt.setMonth(dt.getMonth() + (e.key === 'PageUp' ? -1 : 1));
      setFocus(toIso(dt));
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      const dow = (parse(focus).getDay() + 6) % 7;
      setFocus(addDaysIso(focus, e.key === 'Home' ? -dow : 6 - dow));
    }
  };

  // Week mode: the hovered (or selected) week is shaded as a range.
  const weekOf = (d: string) => addDaysIso(d, -((parse(d).getDay() + 6) % 7));
  const shadeStart = weekMode && hoverWeek ? hoverWeek : rangeStart;
  const shadeEnd = weekMode && hoverWeek ? addDaysIso(hoverWeek, 6) : rangeEnd;
  const inShade = (d: string) => isValidIso(shadeStart) && isValidIso(shadeEnd) && d >= shadeStart && d <= shadeEnd;

  return (
    <div className={styles.cal} role="dialog" aria-label="Choose date" onMouseLeave={() => setHoverWeek(null)}>
      <div className={styles.head}>
        <button type="button" className={styles.navBtn} onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <Icon name="chevronLeft" />
        </button>
        <label className={styles.selWrap}>
          <span className={styles.srOnly}>Month</span>
          <select className={styles.sel} value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
          <Icon name="chevronDown" className={styles.selChev} />
        </label>
        <label className={`${styles.selWrap} ${styles.year}`}>
          <span className={styles.srOnly}>Year</span>
          <select className={styles.sel} value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Icon name="chevronDown" className={styles.selChev} />
        </label>
        <button type="button" className={styles.navBtn} onClick={() => shiftMonth(1)} aria-label="Next month">
          <Icon name="chevronRight" />
        </button>
      </div>

      <div className={styles.grid} ref={gridRef} role="grid" onKeyDown={onKeyDown}>
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`${styles.wd} ${i >= 5 ? styles.wkndHd : ''}`} role="columnheader">{w}</div>
        ))}
        {days.map((d, i) => {
          const dt = parse(d);
          const outside = dt.getMonth() !== view.m;
          const off = disabled(d);
          const col = i % 7;
          const shaded = inShade(d);
          const cls = [
            styles.day,
            outside ? styles.outside : '',
            col >= 5 ? styles.wknd : '',
            d === today ? styles.today : '',
            d === value ? styles.selected : '',
            shaded ? styles.inRange : '',
            shaded && d === shadeStart ? styles.rangeStart : '',
            shaded && d === shadeEnd ? styles.rangeEnd : '',
          ].join(' ');
          return (
            <button
              key={d}
              type="button"
              role="gridcell"
              data-day={d}
              className={cls}
              disabled={off}
              tabIndex={d === focus ? 0 : -1}
              aria-selected={d === value}
              aria-current={d === today ? 'date' : undefined}
              aria-label={formatLong(d)}
              onMouseEnter={() => weekMode && !off && setHoverWeek(weekOf(d))}
              onClick={() => onPick(d)}
            >
              {dt.getDate()}
            </button>
          );
        })}
      </div>

      <div className={styles.foot}>
        <span className={styles.legend}>
          <i className={styles.todayDot} /> Today
          <i className={styles.wkndDot} /> Weekend
        </span>
        <div className={styles.footBtns}>
          {onClear && (
            <button type="button" className={styles.footBtn} onClick={() => { onClear(); onClose(); }}>Clear</button>
          )}
          <button
            type="button"
            className={styles.footBtn}
            disabled={disabled(today)}
            onClick={() => { setFocus(today); onPick(today); }}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- popover: positions the calendar next to its trigger ---------- */

const POP_W = 336;
const POP_H_ESTIMATE = 390;
const GAP = 6;    // space between field and calendar
const EDGE = 8;   // minimum space to the viewport edge

interface PopPos {
  top: number;
  left: number;
  width: number;
  maxHeight?: number;
  side: 'below' | 'above';
}

/** Calendar popover rendered into <body> (so no card, drawer or dialog with
 * overflow: hidden can clip it), positioned with fixed coordinates next to
 * its trigger. Opens below when it fits, otherwise above; if neither side
 * has room it uses the larger side and scrolls inside. Always kept fully
 * inside the viewport, and re-positioned on scroll / resize. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopPos | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(POP_W, vw - EDGE * 2);
    // Natural height of the calendar (scrollHeight ignores a max-height cap).
    const inner = popRef.current?.firstElementChild as HTMLElement | null;
    const h = inner ? inner.scrollHeight : POP_H_ESTIMATE;

    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    let next: PopPos;
    if (h <= below) {
      next = { top: r.bottom + GAP, left: 0, width, side: 'below' };
    } else if (h <= above) {
      next = { top: r.top - GAP - h, left: 0, width, side: 'above' };
    } else if (h <= vh - EDGE * 2) {
      // Fits the window but not fully above or below the field: shift it up
      // just enough to stay fully visible (overlapping the field) - no scrolling.
      next = { top: Math.max(EDGE, Math.min(r.bottom + GAP, vh - EDGE - h)), left: 0, width, side: 'below' };
    } else {
      // Window shorter than the calendar itself: use the full height and scroll.
      next = { top: EDGE, left: 0, width, side: 'below', maxHeight: vh - EDGE * 2 };
    }

    // Horizontal: align with the field's left edge, then keep inside the viewport.
    let left = r.left;
    if (left + width > vw - EDGE) left = r.right - width;
    next.left = Math.min(Math.max(EDGE, left), vw - width - EDGE);
    // Never above the top edge (tiny viewports).
    next.top = Math.max(EDGE, next.top);

    setPos((p) =>
      p && p.top === next.top && p.left === next.left && p.width === next.width && p.maxHeight === next.maxHeight && p.side === next.side ? p : next,
    );
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    // Second pass once the calendar is in the DOM and its real height is known.
    const raf = requestAnimationFrame(place);
    const onMove = () => place();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, place]);

  const panel = (content: ReactNode) =>
    open && pos
      ? createPortal(
          <div
            ref={popRef}
            className={`${styles.pop} ${pos.side === 'above' ? styles.popUp : ''}`}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className={styles.popInner} style={pos.maxHeight ? { maxHeight: pos.maxHeight, overflowY: 'auto' } : undefined}>
              {content}
            </div>
          </div>,
          document.body,
        )
      : null;

  return { open, setOpen, triggerRef, panel };
}

/* ---------- DatePicker: drop-in replacement for <input type="date"> ---------- */

interface DatePickerProps {
  value: string;
  /** Same shape as an input change event, so existing handlers
   * (`e => setX(e.target.value)`) keep working unchanged. */
  onChange: (e: { target: { value: string } }) => void;
  min?: string;
  max?: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Allow clearing the date (default: true, like the native input). */
  clearable?: boolean;
  rangeStart?: string;
  rangeEnd?: string;
  className?: string;
  'aria-label'?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  disabled,
  placeholder = 'Select date',
  clearable = true,
  rangeStart,
  rangeEnd,
  className,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const { open, setOpen, triggerRef, panel } = usePopover();
  const autoId = useId();
  const has = isValidIso(value);

  return (
    <>
      <button
        type="button"
        id={id ?? autoId}
        ref={(el) => { triggerRef.current = el; }}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${className ?? ''}`}
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <Icon name="calendar" className={styles.trigIcon} />
        <span className={has ? styles.trigVal : styles.trigPh}>{has ? formatLong(value) : placeholder}</span>
        <Icon name="chevronDown" className={styles.trigChev} />
      </button>
      {panel(
        <Calendar
          value={has ? value : undefined}
          min={min}
          max={max}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onPick={(d) => {
            onChange({ target: { value: d } });
            // Lets an enclosing form drawer know a value changed (unsaved-changes check).
            triggerRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
            setOpen(false);
            triggerRef.current?.focus();
          }}
          onClear={clearable && has ? () => onChange({ target: { value: '' } }) : undefined}
          onClose={() => setOpen(false)}
        />,
      )}
    </>
  );
}

/* ---------- WeekPicker trigger: opens the calendar in week mode ---------- */

interface WeekPickerProps {
  weekStart: string;
  onPick: (weekStart: string) => void;
  children: ReactNode; // the visible label inside the trigger
  className?: string;
  openClassName?: string;
}

/** Wraps a week label so clicking it opens the calendar; picking any day
 * selects that day's Mon-Sun week. */
export function WeekPickerTrigger({ weekStart, onPick, children, className, openClassName }: WeekPickerProps) {
  const { open, setOpen, triggerRef, panel } = usePopover();
  return (
    <>
      <button
        type="button"
        ref={(el) => { triggerRef.current = el; }}
        className={`${className ?? ''} ${open ? openClassName ?? '' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Pick a week"
      >
        {children}
      </button>
      {panel(
        <Calendar
          value={undefined}
          rangeStart={weekStart}
          rangeEnd={addDaysIso(weekStart, 6)}
          weekMode
          onPick={(d) => {
            onPick(addDaysIso(d, -((parse(d).getDay() + 6) % 7)));
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />,
      )}
    </>
  );
}
