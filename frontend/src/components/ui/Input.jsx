import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  className = '',
  type = 'text',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-400">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-2.5 rounded-lg text-white placeholder-slate-500
          input-dark
          ${error ? 'is-invalid' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 animate-fadeIn">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
