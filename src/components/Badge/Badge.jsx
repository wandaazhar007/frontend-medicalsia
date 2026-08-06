import styles from './Badge.module.scss';

// variant: 'success' | 'warning' | 'danger' | 'info'
// This is the only way status is shown anywhere in the app — do not build
// one-off status treatments per module (see 06-design-system.md).
export default function Badge({ variant = 'info', children }) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
