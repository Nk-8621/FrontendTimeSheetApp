import { useMsal } from '@azure/msal-react';
import styles from './AzureUserBadge.module.css';

export function AzureUserBadge() {
  const { instance, accounts } = useMsal();
  const account = accounts[0];

  return (
    <div className={styles.badge}>
      <span className={styles.name}>{account?.name ?? account?.username}</span>
      <button className={styles.signOut} onClick={() => instance.logoutRedirect()}>
        Sign out
      </button>
    </div>
  );
}
