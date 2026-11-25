import { useState } from 'react';
import { getCategoryAttributes } from '../../constants/categoryAttributes.js';
import SearchableSelect from '../ui/SearchableSelect.jsx';

const OTHER = '__other__';

function AttributeField({ field, value, attributes, onChange, inputClass }) {
  const [custom, setCustom] = useState(false);
  const isSelect = field.type === 'select';

  const options = field.options || [];
  const dependencyValue = field.dependsOn ? attributes[field.dependsOn] : undefined;
  const groups = field.resolveGroups
    ? field.resolveGroups(attributes)
    : field.optionsBy
    ? field.optionsBy[dependencyValue] || field.optionsBy.default || []
    : field.groups || null;
  const allOptions = groups ? groups.flatMap((g) => g.options) : options;

  if (isSelect && field.searchable) {
    return (
      <SearchableSelect
        id={`attr-${field.key}`}
        value={value || ''}
        onChange={onChange}
        options={options}
        groups={groups}
        placeholder={`Search ${field.label.toLowerCase()}…`}
        inputClass={inputClass}
      />
    );
  }

  if (!isSelect) {
    return (
      <input
        id={`attr-${field.key}`}
        type={field.type === 'number' ? 'number' : 'text'}
        value={value || ''}
        placeholder={field.placeholder || ''}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  }

  const valueIsCustom = Boolean(value) && value !== OTHER && !allOptions.includes(value);
  const showCustom = custom || valueIsCustom;
  const selectValue = showCustom ? OTHER : value || '';

  return (
    <>
      <select
        id={`attr-${field.key}`}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setCustom(true);
            onChange('');
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
        className={`${inputClass} bg-gray-50`}
      >
        <option value="">Select {field.label.toLowerCase()}</option>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
        <option value={OTHER}>Other (type manually)</option>
      </select>
      {showCustom && (
        <input
          type="text"
          value={value && value !== OTHER ? value : ''}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} mt-2`}
        />
      )}
    </>
  );
}

// Renders the dynamic, category-specific attributes for a listing form.
// `attributes` is a key/value object; `onChange` receives the updated object.
export default function CategoryAttributesFields({ category, attributes = {}, onChange }) {
  if (!category) return null;
  const fields = getCategoryAttributes(category).filter((f) => !f.hidden);
  if (!fields.length) return null;

  const setField = (key, value) => {
    onChange({ ...attributes, [key]: value });
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.key} className="sm:col-span-2">
          <label htmlFor={`attr-${f.key}`} className="mb-1.5 block text-sm font-medium text-gray-700">
            {f.label}
          </label>
          <AttributeField
            field={f}
            value={attributes[f.key]}
            attributes={attributes}
            onChange={(v) => setField(f.key, v)}
            inputClass={inputClass}
          />
        </div>
      ))}
    </div>
  );
}