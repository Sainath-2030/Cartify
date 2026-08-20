import { forwardRef } from 'react';

const Input = forwardRef(function Input({ error, className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={`input-field ${error ? 'input-field-error' : ''} ${className}`}
      {...rest}
    />
  );
});

export default Input;
