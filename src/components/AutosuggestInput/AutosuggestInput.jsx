import { useEffect, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import Input from '../Input/Input';
import styles from './AutosuggestInput.module.scss';

// Like SearchableSelect, but the typed text is always the value — picking a
// suggestion just fills the text (and reports the picked item via
// `onSuggestionSelect`, e.g. for cascading province->city->district->village
// lookups). Unlike SearchableSelect, blurring without picking anything keeps
// whatever the user typed instead of discarding it — needed here because
// `patients` stores plain free text and must stay editable for addresses
// that aren't in the suggestion dataset.
export default function AutosuggestInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSuggestionSelect,
  loadSuggestions,
  disabled,
  error,
  ...rest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    loadSuggestions(debouncedValue).then((results) => {
      if (isCurrent) setSuggestions(results);
    });
    return () => {
      isCurrent = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue, isOpen]);

  function handleSelect(item) {
    onSuggestionSelect(item);
    setIsOpen(false);
  }

  return (
    <div className={styles.wrapper}>
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        disabled={disabled}
        error={error}
        autoComplete="off"
        {...rest}
      />
      {isOpen && suggestions.length > 0 && (
        <div className={styles.results}>
          {suggestions.map((item) => (
            // onMouseDown (not onClick) fires before the input's onBlur closes the dropdown.
            <button key={item.kode} type="button" className={styles.resultItem} onMouseDown={() => handleSelect(item)}>
              {item.nama}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
