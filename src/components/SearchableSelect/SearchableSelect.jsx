import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../Input/Input';
import styles from './SearchableSelect.module.scss';

// A select box with an inline search field — typing filters `loadOptions`
// (debounced), clicking a result selects it. Used wherever a plain <select>
// would otherwise need to list every row up front (patients, doctors).
//
// `searchingMessage` (optional) swaps the dropdown hint to a "searching..."
// state while a query is debouncing/in flight — only while the caller
// supplies it, so call sites that don't pass it keep the old behaviour.
// `onAddNew`/`addNewLabel` (optional) render a link in place of the empty
// state once a non-empty query genuinely comes back with no matches (e.g.
// "+ Add new patient"), instead of just the empty message.
export default function SearchableSelect({
  id,
  label,
  placeholder,
  value,
  onSelect,
  loadOptions,
  disabled,
  emptyMessage = 'Tidak ada hasil.',
  searchingMessage,
  onAddNew,
  addNewLabel,
  error,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery !== '' && (query !== debouncedQuery || isFetching);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    setIsFetching(true);
    loadOptions(debouncedQuery).then((results) => {
      if (isCurrent) {
        setOptions(results);
        setIsFetching(false);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, isOpen, loadOptions]);

  function handleFocus() {
    setQuery('');
    setIsOpen(true);
  }

  // Typing again after already having a selection means the user is
  // replacing it — clear it right away so a value they never confirmed a
  // new pick for doesn't silently stay selected underneath the new text.
  function handleChange(e) {
    setQuery(e.target.value);
    if (value) {
      onSelect(null);
    }
  }

  function handleSelect(option) {
    onSelect(option);
    setIsOpen(false);
    setQuery('');
  }

  let dropdownContent;
  if (isSearching && searchingMessage) {
    dropdownContent = <div className={styles.empty}>{searchingMessage}</div>;
  } else if (options.length === 0) {
    dropdownContent = onAddNew && trimmedQuery !== '' ? (
      <button type="button" className={styles.addNew} onMouseDown={onAddNew}>{addNewLabel}</button>
    ) : (
      <div className={styles.empty}>{emptyMessage}</div>
    );
  } else {
    dropdownContent = options.map((option) => (
      // onMouseDown (not onClick) fires before the input's onBlur closes the dropdown.
      <button key={option.id} type="button" className={styles.resultItem} onMouseDown={() => handleSelect(option)}>
        {option.label}
      </button>
    ));
  }

  return (
    <div className={styles.wrapper}>
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        value={isOpen ? query : value?.label || ''}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        error={error}
        autoComplete="off"
      />
      {isOpen && <div className={styles.results}>{dropdownContent}</div>}
    </div>
  );
}
