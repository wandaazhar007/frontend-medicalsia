import { useTranslation } from 'react-i18next';
import styles from './Footer.module.scss';

// Hidden on mobile via CSS (Footer.module.scss) — below $breakpoint-tablet,
// Sidebar gives way to BottomNav and vertical space is already tight there.
export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {t('footer.copyright', { year })}
    </footer>
  );
}
