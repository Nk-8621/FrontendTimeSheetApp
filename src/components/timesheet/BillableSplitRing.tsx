import styles from './KpiStrip.module.css';

interface BillableSplitRingProps {
  billableHours: number;
  partialBillableHours: number;
  nonBillableHours: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** KPI card with a ring chart of billable / partial billable / non-billable
 * hours and a small legend with the hours behind each slice. */
export function BillableSplitRing({ billableHours, partialBillableHours, nonBillableHours }: BillableSplitRingProps) {
  const total = billableHours + partialBillableHours + nonBillableHours;
  const pct = (hours: number) => (total ? Math.round((hours / total) * 100) : 0);

  // Each slice is a dashed circle: its dash length is its share of the ring,
  // and it starts where the previous slice ended.
  const slices = [
    { label: 'Billable', hours: billableHours, color: 'var(--oxide)' },
    { label: 'Partial billable', hours: partialBillableHours, color: 'var(--violet)' },
    { label: 'Non-billable', hours: nonBillableHours, color: 'var(--ruleStrong)' },
  ];
  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = total ? (slice.hours / total) * CIRCUMFERENCE : 0;
    const arc = { ...slice, length, offset };
    offset += length;
    return arc;
  });

  const summary = `Billable split: ${pct(billableHours)}% billable, ${pct(partialBillableHours)}% partial billable, ${pct(nonBillableHours)}% non-billable`;

  return (
    <div className={`${styles.kpi} ${styles.ring}`}>
      <svg width="96" height="96" viewBox="0 0 104 104" role="img" aria-label={summary}>
        <g transform="rotate(-90 52 52)" fill="none" strokeWidth="14">
          <circle cx="52" cy="52" r={RADIUS} stroke="var(--rule)" />
          {arcs.map((arc) => arc.length > 0 && (
            <circle
              key={arc.label}
              cx="52"
              cy="52"
              r={RADIUS}
              stroke={arc.color}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </g>
        <text x="52" y="52" textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--ink)">{pct(billableHours)}%</text>
        <text x="52" y="68" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--slate)">billable</text>
      </svg>
      <div className={styles.ringLegend}>
        <div className={styles.k}>Billable split</div>
        {slices.map((slice) => (
          <div key={slice.label} className={styles.ringRow}>
            <span className={styles.ringSwatch} style={{ background: slice.color }} />
            {slice.label}
            <b>{slice.hours.toFixed(0)} h</b>
          </div>
        ))}
      </div>
    </div>
  );
}
