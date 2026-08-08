import { useTranslation } from 'react-i18next';
import Button from '../Button/Button';
import styles from './Pagination.module.scss';

// Built once and reused across every list view (see 04-architecture-conventions.md).
export default function Pagination({ page, limit, totalItems, totalPages, onPageChange }) {
  const { t } = useTranslation();

  if (totalItems === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className={styles.wrapper}>
      <span className={styles.summary}>
        {t('pagination.summary', { start, end, total: totalItems })}
      </span>
      <div className={styles.controls}>
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t('pagination.previous')}
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t('pagination.next')}
        </Button>
      </div>
    </div>
  );
}
