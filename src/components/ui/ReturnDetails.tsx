import type { ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './ReturnDetails.module.css';

interface ReturnDetailsProps {
  /** Who returned the timesheet. */
  by: string;
  /** Heading, e.g. "Returned to employee" / "Returned for corrections". */
  title: string;
  reason?: string;
  comments?: string;
  /** Optional closing hint, e.g. what the employee should do next. */
  footer?: ReactNode;
}

/** Structured "returned" information: who returned it, the reason as a
 * labelled chip, and the comments as a quoted note. Used on approval cards
 * and on My Timesheet. */
export function ReturnDetails({ by, title, reason, comments, footer }: ReturnDetailsProps) {
  return (
    <section className={styles.box} aria-label={title}>
      <header className={styles.head}>
        <span className={styles.icon}><Icon name="undo" /></span>
        <div className={styles.headText}>
          <div className={styles.title}>{title}</div>
          <div className={styles.by}>by <b>{by}</b></div>
        </div>
      </header>

      <dl className={styles.grid}>
        <dt>Reason</dt>
        <dd>
          <span className={styles.reason}>{reason || 'No reason given'}</span>
        </dd>
        {comments && (
          <>
            <dt>Comments</dt>
            <dd>
              <p className={styles.comment}>
                <Icon name="message" />
                <span>{comments}</span>
              </p>
            </dd>
          </>
        )}
      </dl>

      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
