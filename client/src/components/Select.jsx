import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    options = [],
    children,
    className = '',
    required = false,
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-semibold text-ink">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`select-field ${error ? 'input-field-error' : ''} ${className}`}
          {...props}
        >
          {children ? (
            children
          ) : (
            options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-xs text-error">{error}</p>
      )}

      {!error && helperText && (
        <p className="mt-1 text-xs text-muted">{helperText}</p>
      )}
    </div>
  );
});

export default Select;
