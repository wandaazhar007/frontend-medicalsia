import Button from '../Button/Button';
import styles from './Pagination.module.scss';

// Built once and reused across every list view (see 04-architecture-conventions.md).
export default function Pagination({ page, limit, totalItems, totalPages, onPageChange }) {
  if (totalItems === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className={styles.wrapper}>
      <span className={styles.summary}>
        Menampilkan {start}–{end} dari {totalItems}
      </span>
      <div className={styles.controls}>
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
