import styles from './Select.module.scss';

export default function Select({ label, id, error, children, ...rest }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className={`${styles.select} ${error ? styles.selectError : ''}`} aria-invalid={error ? 'true' : undefined} {...rest}>
        {children}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
