import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { useNotifications } from '../hooks/api/useNotifications';

export function NotificationsPage() {
  const { data: notifications, isError } = useNotifications();

  return (
    <>
      <PageHeader crumb="Setup" title="Notifications" />
      <div className="page-content">
        {isError && <Banner kind="reject">Couldn't load notifications — check that the backend API is reachable.</Banner>}

        {notifications?.map((n) => <NotificationCard key={n.id} notification={n} />)}
      </div>
    </>
  );
}