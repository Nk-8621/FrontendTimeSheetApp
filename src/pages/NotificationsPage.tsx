import { PageHeader } from '../components/layout/PageHeader';
import { Banner } from '../components/timesheet/Banner';
import { NotificationCard } from '../components/notifications/NotificationCard';
import { useNotifications } from '../hooks/api/useNotifications';

export function NotificationsPage() {
  const { data: notifications, isLoading, isError } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.isBroadcast && !n.readAt).length ?? 0;

  return (
    <>
      <PageHeader crumb="Setup" title="Notifications" />
      <div className="page-content">
        {isLoading && <Banner>Loading notifications…</Banner>}
        {isError && <Banner kind="reject">Couldn't load notifications — check that the backend API is reachable.</Banner>}

        {notifications && (
          <>
            {unreadCount > 0 && (
              <Banner>{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}.</Banner>
            )}
            {notifications.length === 0 ? (
              <Banner>You're all caught up — nothing here right now.</Banner>
            ) : (
              notifications.map((n) => <NotificationCard key={n.id} notification={n} />)
            )}
          </>
        )}
      </div>
    </>
  );
}