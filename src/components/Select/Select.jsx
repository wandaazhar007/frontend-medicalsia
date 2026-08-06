import styles from './Select.module.scss';

export default function Select({ label, id, children, ...rest }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <select id={id} className={styles.select} {...rest}>
        {children}
      </select>
    </div>
  );
}
