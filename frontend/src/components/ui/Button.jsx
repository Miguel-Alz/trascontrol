import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'btn-gradient text-white',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
  ghost: 'hover:bg-slate-800 text-slate-400 hover:text-white',
  outline: 'border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
