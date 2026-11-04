import React from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

export default function Search({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  style = {},
  autoFocus = false,
  ariaLabel = 'Search'
}) {
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e);
    }
  };

  const handleClear = () => {
    if (typeof onClear === 'function') {
      onClear();
    } else if (typeof onChange === 'function') {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div
      className={`crm-search-box ${className}`.trim()}
      style={{ ...style }}
    >
      <SearchIcon
        size={16}
        className="crm-search-icon"
        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
      />
      <input
        type="text"
        className="crm-search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            borderRadius: '4px',
            flexShrink: 0,
            transition: 'color 0.15s ease'
          }}
          aria-label="Clear search input"
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}

export { Search as SearchBar };
