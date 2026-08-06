import { useEffect, useState } from 'react';

// Delays reflecting `value` until the caller has stopped changing it for
// `delayMs` — used to drive live search without a submit button.
export function useDebounce(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debounced;
}
