import { useEffect } from 'react';
import Card from '../Card/Card';
import styles from './Modal.module.scss';

// Generic confirm/dialog shell — dark blurred backdrop, closes on backdrop
// click or Escape. Reused across the app wherever a blocking modal is needed
// (logout confirmation today, more to come).
export default function Modal({ isOpen, onClose, title, titleClassName, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <Card className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && <h2 className={`${styles.title} ${titleClassName || ''}`}>{title}</h2>}
        {children}
      </Card>
    </div>
  );
}
