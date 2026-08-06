import styles from './Wordmark.module.scss';

// Companion wordmark shown next to LogoIcon in topbar/sidebar — never used
// alone for favicon/app icon (too small to hold text), see docs/10-logo.md.
export default function Wordmark({ variant = 'light' }) {
  return (
    <span className={styles.wordmark}>
      <span className={variant === 'dark' ? styles.medicalOnDark : styles.medical}>Medical</span>
      <span className={styles.sia}>sia</span>
    </span>
  );
}
