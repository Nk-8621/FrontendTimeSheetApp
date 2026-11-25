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

  return (
    <div className={styles.kpis}>
      <div className={`${styles.kpi} ${styles.a}`}>
        <div className={styles.k}>Logged this week</div>
        <div className={styles.v}>
          {fmt(totalHours)}
          <small> / {fmt(capacityHours)} h</small>
          <span className={styles.pct}>{pctOfCap}%</span>
        </div>
        <div className={styles.d}>of available capacity</div>
      </div>

      <div className={`${styles.kpi} ${styles.g}`}>
        <div className={styles.k}>Billable</div>
        <div className={styles.v}>
          {fmt(billableHours)}
          <small> h</small>
          <span className={styles.pct}>{pctBillable}%</span>
        </div>
        <div className={styles.d}>of logged hours</div>
      </div>

      <div className={`${styles.kpi} ${styles.p}`}>
        <div className={styles.k}>Partial billable</div>
        <div className={styles.v}>
          {fmt(partialBillableHours)}
          <small> h</small>
          <span className={styles.pct}>{pctPartial}%</span>
        </div>
        <div className={styles.d}>of logged hours</div>
      </div>

      <div className={styles.kpi}>
        <div className={styles.k}>Non-billable</div>
        <div className={styles.v}>
          {fmt(nonBillable)}
          <small> h</small>
          <span className={styles.pct}>{pctNonBillable}%</span>
        </div>
        <div className={styles.d}>of logged hours</div>
      </div>

      <div className={`${styles.kpi} ${totalHours < capacityHours ? styles.w : styles.g}`}>
        <div className={styles.k}>Gap to capacity</div>
        <div className={styles.v}>
          {fmt(gap)}
          <small> h</small>
          <span className={styles.pct}>{pctGap}%</span>
        </div>
        <div className={styles.d}>of capacity</div>
      </div>
    </div>
  );
}
