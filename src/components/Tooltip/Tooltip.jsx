import { useEffect, useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './Tooltip.module.scss';

// Click-to-toggle info bubble (not hover-only, so it works on touch too).
// Closes on click outside or Escape. `content` can be a plain string or
// any node — pass a translated string from the call site for multi-language
// support, this component holds no text of its own.
export default function Tooltip({ content, ariaLabel = 'Info' }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <span className={styles.wrapper} ref={wrapperRef}>
      <button type="button" className={styles.trigger} onClick={() => setIsOpen((open) => !open)} aria-label={ariaLabel}>
        <CircleAlert size={14} />
      </button>
      {isOpen && <div className={styles.bubble}>{content}</div>}
    </span>
  );
}
