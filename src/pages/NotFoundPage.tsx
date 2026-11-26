import { Link, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Icon } from '../components/ui/Icon';
import controls from '../styles/controls.module.css';

/** Shown for any URL that isn't a page in the app (typo, old bookmark),
 * instead of an empty panel. */
export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <>
      <PageHeader title="Page not found" subtitle={<>There's no page at <code>{pathname}</code>. It may have moved, or the link may be mistyped.</>} />
      <div className="page-content">
        <Link to="/" className={`${controls.btn} ${controls.pri}`}>
          <Icon name="arrowRight" />
          Go to home
        </Link>
      </div>
    </>
  );
}
