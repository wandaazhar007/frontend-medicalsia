import { useCallback, useEffect, useState } from 'react';
import styles from './ConnectionStatus.module.scss';

const RETRY_INTERVAL_MS = 7000;

// Wraps the whole app. Not an offline mode — transactions still require a
// live connection — this only makes disconnects visible and recoverable
// instead of a raw browser error or a blank screen.
export default function ConnectionStatus({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const pingBackend = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`, { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    const reachable = navigator.onLine && (await pingBackend());
    setIsRetrying(false);
    setIsOnline((wasOnline) => {
      if (!wasOnline && reachable) {
        // Lets pages re-fetch whatever data failed to load while disconnected.
        window.dispatchEvent(new CustomEvent('medicalsia:connection-restored'));
      }
      return reachable;
    });
  }, [pingBackend]);

  useEffect(() => {
    retry();

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', retry);
    window.addEventListener('offline', handleOffline);
    const intervalId = setInterval(retry, RETRY_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [retry]);

  return (
    <>
      {!isOnline && (
        <div className={styles.banner} role="alert">
          <span>No internet connection</span>
          <button className={styles.retryButton} onClick={retry} disabled={isRetrying}>
            {isRetrying ? 'Mencoba...' : 'Coba Lagi'}
          </button>
        </div>
      )}
      {children}
    </>
  );
}
