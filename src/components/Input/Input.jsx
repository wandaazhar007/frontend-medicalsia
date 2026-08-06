import styles from './Input.module.scss';

export default function Input({ label, id, error, suffix, className = '', ...rest }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        <input
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''} ${suffix ? styles.hasSuffix : ''} ${className}`}
          aria-invalid={error ? 'true' : undefined}
          {...rest}
        />
        {suffix && <div className={styles.suffix}>{suffix}</div>}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
