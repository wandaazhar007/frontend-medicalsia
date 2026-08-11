import styles from './Button.module.scss';

// variant: 'primary' | 'secondary' | 'danger' | 'dangerOutline' | 'ghost'
export default function Button({ variant = 'primary', children, ...rest }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`} {...rest}>
      {children}
    </button>
  );
}
