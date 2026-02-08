import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-700 text-slate-100
            appearance-none cursor-pointer border border-slate-600
            focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
            hover:bg-slate-600 transition-colors
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-slate-800 text-slate-100">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-800 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-sm text-red-400 animate-fadeIn">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
