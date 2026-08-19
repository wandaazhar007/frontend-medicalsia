import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Button from '../../../components/Button/Button';
import styles from './AccessDenied.module.scss';

export default function AccessDenied() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <ShieldAlert size={40} className={styles.icon} />
      <p className={styles.message}>{t('accessDenied.message')}</p>
      <Button variant="secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        {t('accessDenied.backButton')}
      </Button>
    </div>
  );
}
