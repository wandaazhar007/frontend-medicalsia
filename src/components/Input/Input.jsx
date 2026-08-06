import styles from './Input.module.scss';

export default function Input({ label, id, ...rest }) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className={styles.input} {...rest} />
    </div>
  );
}
