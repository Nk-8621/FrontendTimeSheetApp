import type { DayTypeDto } from '../../api/types';
import { DAY_NAMES, DAY_TYPE_LABELS } from '../../types/meridian';
import { Card } from '../ui/Card';

interface DayTypesCardProps {
  dayTypes: DayTypeDto[];
}

const dayMonth = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
};

export function DayTypesCard({ dayTypes }: DayTypesCardProps) {
  return (
    <Card title="Day types" sub="Leave & holiday are read-only sources">
      <table style={{ margin: '-6px 0', fontSize: 11.5, color: 'var(--slate2)' }}>
        <tbody>
          {dayTypes.map((dt, i) => (
            <tr key={dt.date}>
              <td style={{ width: 74 }} className="num">{dayMonth(dt.date)}</td>
              <td style={{ width: 34, color: 'var(--slate)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {DAY_NAMES[i]}
              </td>
              <td>
                {DAY_TYPE_LABELS[dt.dayType].label}
                {dt.dayType === 'L' && <span style={{ color: 'var(--slate)' }}> — synced from Keka, or an approved/pending full-day leave request</span>}
                {dt.dayType === 'LH' && <span style={{ color: 'var(--slate)' }}> — half-day leave request</span>}
              </td>
              <td style={{ textAlign: 'right', color: 'var(--ink2)' }} className="num">
                {dt.capacityHours ? `${dt.capacityHours} h` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
