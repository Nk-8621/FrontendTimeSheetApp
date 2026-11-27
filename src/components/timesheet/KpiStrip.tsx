import { Icon } from '../ui/Icon';
import styles from './KpiStrip.module.css';

interface KpiStripProps {
  totalHours: number;
  capacityHours: number;
  billableHours: number;
  partialBillableHours: number;
  leaveDays: number;
  holidayDays: number;
  wfhDays: number;
}

const fmt = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '0');
/** Whole-number percentage of part in total (0 when total is 0). */
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);

export function KpiStrip({ totalHours, capacityHours, billableHours, partialBillableHours }: KpiStripProps) {
  const nonBillable = totalHours - billableHours - partialBillableHours;
  const gap = Math.max(0, capacityHours - totalHours);
  // Billable, partial and non-billable are shares of the logged hours (they add up to 100%);
  // logged and gap are shares of the week's capacity.
  const pctOfCap = pct(totalHours, capacityHours);
  const pctBillable = pct(billableHours, totalHours);
  const pctPartial = pct(partialBillableHours, totalHours);
  const pctNonBillable = totalHours ? 100 - pctBillable - pctPartial : 0;
  const pctGap = pct(gap, capacityHours);

  const cards = [
    { cls: styles.a, icon: 'clock', label: 'Logged this week', value: fmt(totalHours), unit: ` / ${fmt(capacityHours)} h`, pct: pctOfCap, note: 'of available capacity' },
    { cls: styles.g, icon: 'coins', label: 'Billable', value: fmt(billableHours), unit: 'h', pct: pctBillable, note: 'of logged hours' },
    { cls: styles.p, icon: 'halfCircle', label: 'Partial billable', value: fmt(partialBillableHours), unit: 'h', pct: pctPartial, note: 'of logged hours' },
    { cls: '', icon: 'minusCircle', label: 'Non-billable', value: fmt(nonBillable), unit: 'h', pct: pctNonBillable, note: 'of logged hours' },
    { cls: totalHours < capacityHours ? styles.w : styles.g, icon: 'target', label: 'Gap to capacity', value: fmt(gap), unit: 'h', pct: pctGap, note: 'of capacity still to log' },
  ];

  return (
    <div className={styles.kpis}>
      {cards.map((c) => (
        <div key={c.label} className={`${styles.kpi} ${c.cls}`}>
          <div className={styles.k}>
            <span className={styles.tile}><Icon name={c.icon} /></span>
            {c.label}
          </div>
          <div className={styles.v}>
            {c.value}
            <small>{c.unit}</small>
            <span className={styles.pct}>{c.pct}%</span>
          </div>
          <div className={styles.d}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}
