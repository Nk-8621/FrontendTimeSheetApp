import { PageHeader } from '../layout/PageHeader';
import styles from './KekaSyncNotice.module.css';

// UNDER DEVELOPMENT (Nov 2026): Leave / WFH / On Duty / Comp-Off requests will
// come from KEKA, so the Requests and Request Approval pages show this notice
// instead. To bring the pages back, set REQUESTS_UNDER_DEVELOPMENT to false.
export const REQUESTS_UNDER_DEVELOPMENT = true;

/** Full-page "under development - KEKA sync" message. */
export function KekaSyncNotice({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="page-content">
        <div className={styles.card}>
          <div className={styles.icon} aria-hidden="true">⚠</div>
          <h3 className={styles.heading}>{title} – Under Development</h3>
          <p className={styles.text}>
            Leave, WFH, On Duty and Comp-Off requests will be synchronised with <b>KEKA</b>.
            <br />
            Until then, please apply for them in KEKA.
          </p>
          <span className={styles.tag}>COMING SOON · KEKA SYNC</span>
        </div>
      </div>
    </>
  );
}
