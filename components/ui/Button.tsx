import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-150 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50';

  const variants = {
    primary: 'bg-indigo-300 text-white enabled:hover:bg-indigo-400 enabled:active:bg-indigo-500',
    secondary: 'bg-slate-100 text-slate-700 enabled:hover:bg-slate-200 border border-slate-200',
    ghost: 'text-slate-500 enabled:hover:text-slate-800 enabled:hover:bg-slate-100',
    danger: 'bg-rose-100 text-rose-600 enabled:hover:bg-rose-200 border border-rose-200',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-9 py-4 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="animate-spin h-4 w-4" />
          Procesando...
        </span>
      ) : children}
    </button>
  );
}
