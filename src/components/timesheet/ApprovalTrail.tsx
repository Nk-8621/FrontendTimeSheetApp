import type { ApprovalEventDto } from '../../api/types';
import { Card } from '../ui/Card';
import styles from './ApprovalTrail.module.css';

interface ApprovalTrailProps {
  trail: ApprovalEventDto[];
  leadName: string;
  l2Name: string;
}

const STATUS_CSS: Record<string, string> = { Ok: 'ok', Pending: 'pd', Rejected: 'rj' };

export function ApprovalTrail({ trail, leadName, l2Name }: ApprovalTrailProps) {
  return (
    <Card title="Approval trail" sub="2 levels">
      {trail.length > 0 ? (
        <div className={styles.trail}>
          {trail.map((ev, i) => (
            <div key={i} className={`${styles.ev} ${ev.status ? styles[STATUS_CSS[ev.status]] : ''}`}>
              <div className={styles.t}>{ev.text}</div>
              <div className={styles.m}>{ev.meta}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          Not submitted yet. On submit this goes to <b>{leadName}</b> (Level 1), then <b>{l2Name}</b> (Level 2).
        </div>
      )}
    </Card>
  );
}
