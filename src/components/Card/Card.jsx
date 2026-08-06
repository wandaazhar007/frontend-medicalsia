import styles from './Card.module.scss';

export default function Card({ children, className = '', ...rest }) {
  return (
    <div className={`${styles.card} ${className}`} {...rest}>
      {children}
    </div>
  );
}
