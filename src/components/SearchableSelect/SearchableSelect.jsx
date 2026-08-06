import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../Input/Input';
import styles from './SearchableSelect.module.scss';

// A select box with an inline search field — typing filters `loadOptions`
// (debounced), clicking a result selects it. Used wherever a plain <select>
// would otherwise need to list every row up front (patients, doctors).
export default function SearchableSelect({ id, label, placeholder, value, onSelect, loadOptions, disabled, emptyMessage = 'Tidak ada hasil.' }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    loadOptions(debouncedQuery).then((results) => {
      if (isCurrent) setOptions(results);
    });
    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, isOpen, loadOptions]);

  function handleFocus() {
    setQuery('');
    setIsOpen(true);
  }

  function handleSelect(option) {
    onSelect(option);
    setIsOpen(false);
    setQuery('');
  }

  return (
    <div className={styles.wrapper}>
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        value={isOpen ? query : value?.label || ''}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        autoComplete="off"
      />
      {isOpen && (
        <div className={styles.results}>
          {options.length === 0 ? (
            <div className={styles.empty}>{emptyMessage}</div>
          ) : (
            options.map((option) => (
              // onMouseDown (not onClick) fires before the input's onBlur closes the dropdown.
              <button key={option.id} type="button" className={styles.resultItem} onMouseDown={() => handleSelect(option)}>
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
