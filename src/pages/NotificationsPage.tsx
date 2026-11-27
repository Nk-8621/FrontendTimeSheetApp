import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { useNotifications } from '../hooks/api/useNotifications';

export function NotificationsPage() {
  const { data: notifications, isError } = useNotifications();

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates about your timesheets and approvals." />
      <div className="page-content">
        <Banner kind="warn"><b>Under development:</b> notifications aren't sent yet. This page will show them once the feature is ready.</Banner>

        {isError && <Banner kind="reject">Couldn't load notifications — check that the backend API is reachable.</Banner>}

        {notifications?.map((n) => <NotificationCard key={n.id} notification={n} />)}
      </div>
    </>
  );
}