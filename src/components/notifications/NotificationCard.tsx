import type { NotificationDto } from '../../api/types';
import { useMarkNotificationRead } from '../../hooks/api/useNotifications';
import styles from './NotificationCard.module.css';

const KIND_CSS: Record<string, string> = { Warning: 'warn', Info: 'info', Risk: 'risk' };

export function NotificationCard({ notification }: { notification: NotificationDto }) {
  const markRead = useMarkNotificationRead();
  const isUnread = !notification.isBroadcast && !notification.readAt;

  return (
    <div className={`${styles.card} ${styles[KIND_CSS[notification.kind]]} ${isUnread ? styles.unread : ''}`}>
      <div className={styles.body}>
        <div className={styles.title}>{notification.title}</div>
        <div className={styles.message}>{notification.message}</div>
        <div className={styles.meta}>
          {new Date(notification.createdAt).toLocaleString()}
          {notification.isBroadcast && <span className={styles.broadcastTag}>Org-wide</span>}
        </div>
      </div>
      {isUnread && (
        <button className={styles.markRead} onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>
          Mark as read
        </button>
      )}
    </div>
  );
}