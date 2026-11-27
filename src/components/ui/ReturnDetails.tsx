import { useId, useState, type ReactNode } from 'react';
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
  /** Start collapsed: only the title and who returned it show, with a
   * "Show details" button that reveals the reason, comments and footer.
   * Off by default, so the approval cards keep showing everything. */
  collapsible?: boolean;
}

/** Structured "returned" information: who returned it, the reason as a
 * labelled chip, and the comments as a quoted note. Used on approval cards
 * and on My Timesheet. */
export function ReturnDetails({ by, title, reason, comments, footer, collapsible = false }: ReturnDetailsProps) {
  const [expanded, setExpanded] = useState(!collapsible);
  const detailsId = useId();
  const showDetails = !collapsible || expanded;

  return (
    <section className={`${styles.box} ${collapsible && !expanded ? styles.collapsed : ''}`} aria-label={title}>
      <header className={styles.head}>
        <span className={styles.icon}><Icon name="undo" /></span>
        <div className={styles.headText}>
          <div className={styles.title}>{title}</div>
          <div className={styles.by}>by <b>{by}</b></div>
        </div>
        {collapsible && (
          <button
            type="button"
            className={`${styles.toggle} ${expanded ? styles.toggleOpen : ''}`}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={detailsId}
          >
            {expanded ? 'Hide details' : 'Show details'}
            <Icon name="chevronDown" />
          </button>
        )}
      </header>

      {showDetails && (
      <div id={detailsId}>
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
      </div>
      )}
    </section>
  );
}
