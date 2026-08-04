import { PageHeader } from '../components/layout/PageHeader';
import styles from './PlaceholderPage.module.css';

interface PlaceholderPageProps {
  crumb?: string;
  title: string;
  description: string;
}

export function PlaceholderPage({ crumb, title, description }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader crumb={crumb ?? title} title={title} />
      <div className="page-content">
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
    </>
  );
}
