import type { ApprovalEventDto } from '../../api/types';
import { Card } from '../ui/Card';
import styles from './ApprovalTrail.module.css';

interface ApprovalTrailProps {
  trail: ApprovalEventDto[];
  leadName: string;
  l2Name: string;
  /** True when this employee's reporting line has no Level 1 step (see
   * WeekApprovalService.DetermineApprovalRoutingAsync). */
  skipsLevel1?: boolean;
}

const STATUS_CSS: Record<string, string> = { Ok: 'ok', Pending: 'pd', Rejected: 'rj' };

export function ApprovalTrail({ trail, leadName, l2Name, skipsLevel1 = false }: ApprovalTrailProps) {
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
          {skipsLevel1
            ? <>Not submitted yet. On submit this goes straight to <b>{l2Name}</b> for approval — there's no Level 1 step for your reporting line.</>
            : <>Not submitted yet. On submit this goes to <b>{leadName}</b> (Level 1), then <b>{l2Name}</b> (Level 2).</>}
        </div>
      )}
    </Card>
  );
}
