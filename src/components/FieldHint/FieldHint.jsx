import { useState } from 'react';
import styles from './FieldHint.module.scss';

// Wraps a (possibly disabled) field and shows a small tooltip above it on
// hover/click, only while `show` is true — used for disabled fields to
// explain why they can't be used yet, e.g. "pick a province first".
//
// While `show` is true, the field itself gets `pointer-events: none` so
// hover/click always land on this wrapper instead — disabled form controls
// are inconsistent about whether they even dispatch those events at all
// (some browsers swallow clicks on a disabled <input> before it bubbles).
export default function FieldHint({ show, message, children }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => show && setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => show && setIsVisible(true)}
    >
      <div className={show ? styles.inert : undefined}>{children}</div>
      {show && isVisible && <div className={styles.bubble}>{message}</div>}
    </div>
  );
}
