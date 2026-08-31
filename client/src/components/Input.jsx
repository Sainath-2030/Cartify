import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    required = false,
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ink">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`input-field ${Icon ? 'pl-9' : ''} ${error ? 'input-field-error' : ''} ${className}`}
          {...props}
        />
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

export default Input;
