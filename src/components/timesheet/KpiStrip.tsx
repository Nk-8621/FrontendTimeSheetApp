import styles from './KpiStrip.module.css';

interface KpiStripProps {
  totalHours: number;
  capacityHours: number;
  billableHours: number;
  leaveDays: number;
  holidayDays: number;
  wfhDays: number;
}

const fmt = (n: number) => (n ? (Math.round(n * 100) / 100).toString() : '0');

export function KpiStrip({ totalHours, capacityHours, billableHours, leaveDays, holidayDays, wfhDays }: KpiStripProps) {
  const nonBillable = totalHours - billableHours;
  const pctOfCap = capacityHours ? Math.round((totalHours / capacityHours) * 100) : 0;
  const pctBillable = totalHours ? Math.round((billableHours / totalHours) * 100) : 0;
  const gap = Math.max(0, capacityHours - totalHours);

  return (
    <div className={styles.kpis}>
      <div className={`${styles.kpi} ${styles.a}`}>
        <div className={styles.k}>Logged this week</div>
        <div className={styles.v}>
          {fmt(totalHours)}
          <small> / {fmt(capacityHours)} h</small>
        </div>
        <div className={styles.d}>{pctOfCap}% of available capacity</div>
      </div>

      <div className={`${styles.kpi} ${styles.g}`}>
        <div className={styles.k}>Billable</div>
        <div className={styles.v}>
          {fmt(billableHours)}
          <small> h</small>
        </div>
        <div className={styles.d}>{pctBillable}% of logged hours</div>
      </div>

      <div className={styles.kpi}>
        <div className={styles.k}>Non-billable</div>
        <div className={styles.v}>
          {fmt(nonBillable)}
          <small> h</small>
        </div>
        <div className={styles.d}>Pre-sales, training, admin</div>
      </div>

      <div className={`${styles.kpi} ${totalHours < capacityHours ? styles.w : styles.g}`}>
        <div className={styles.k}>Gap to capacity</div>
        <div className={styles.v}>
          {fmt(gap)}
          <small> h</small>
        </div>
        <div className={styles.d}>
          {leaveDays} leave · {holidayDays} holiday · {wfhDays} WFH
        </div>
      </div>
    </div>
  );
}
