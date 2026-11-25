import { useRef, useState } from 'react';

// Lightweight searchable dropdown (combobox).
// Supports flat options or grouped options ([{ label, options }]).
// Typing filters the list; selecting commits a value.
// When allowCustom is true, typing a non-matching value and leaving commits it
// as a custom value (acts as "Other"). When false, the previous value is kept.
export default function SearchableSelect({
  id,
  value = '',
  onChange,
  options = [],
  groups = null,
  placeholder = 'Search…',
  inputClass = '',
  allowCustom = true,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dirtyRef = useRef(false);

  const allOptions = groups ? groups.flatMap((g) => g.options) : options;
  const q = query.trim().toLowerCase();
  const matches = (opt) => !q || opt.toLowerCase().includes(q);
  const isKnown = (val) => allOptions.some((o) => o.toLowerCase() === val.trim().toLowerCase());

  const commit = (val) => {
    onChange(val);
    setQuery('');
    setOpen(false);
    dirtyRef.current = false;
  };

  const handleBlur = () => {
    // Delay so option clicks register before the list closes.
    setTimeout(() => {
      // Only act if the user actually edited the text since focus.
      if (dirtyRef.current) {
        const text = query.trim();
        if (!text) {
          onChange('');
        } else if (isKnown(text) || allowCustom) {
          onChange(text);
        }
        // else: invalid entry for a fixed-list field → keep previous value
      }
      setQuery('');
      setOpen(false);
      dirtyRef.current = false;
    }, 120);
  };

  const displayValue = open ? query : value || '';

  const renderOption = (o) => (
    <li key={o}>
      <button
        type="button"
        onClick={() => commit(o)}
        className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 ${
          o === value ? 'font-semibold text-blue-700' : 'text-gray-800'
        }`}
      >
        {o}
      </button>
    </li>
  );

  return (
    <div className="relative">
      <input
        id={id}
        value={displayValue}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setQuery(value || '');
          dirtyRef.current = false;
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          dirtyRef.current = true;
        }}
        onBlur={handleBlur}
        className={`${inputClass} ${value && !open ? 'pr-8' : ''}`}
      />
      {value && !open && (
        <button
          type="button"
          aria-label="Clear selection"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
            setQuery('');
            setOpen(false);
            dirtyRef.current = false;
          }}
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ×
        </button>
      )}
      {open && (
        <ul
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          {groups
            ? groups.map((g) => {
                const opts = g.options.filter(matches);
                if (!opts.length) return null;
                return (
                  <li key={g.label}>
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {g.label}
                    </div>
                    <ul>{opts.map(renderOption)}</ul>
                  </li>
                );
              })
            : allOptions.filter(matches).map(renderOption)}
          {allowCustom && q && !isKnown(q) && (
            <li className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => commit(query.trim())}
                className="block w-full px-3 py-1.5 text-left text-sm text-blue-600 hover:bg-blue-50"
              >
                Use “{query.trim()}”
              </button>
            </li>
          )}
          {!q && allOptions.length === 0 && (
            <li className="px-3 py-1.5 text-sm text-gray-400">No options</li>
          )}
        </ul>
      )}
    </div>
  );
}