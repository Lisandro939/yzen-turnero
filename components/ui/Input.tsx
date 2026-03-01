import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, onWheel, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  function handleWheel(e: React.WheelEvent<HTMLInputElement>) {
    if (props.type === 'number') (e.target as HTMLInputElement).blur();
    onWheel?.(e);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white border ${error ? 'border-rose-300' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors ${className}`}
        onWheel={handleWheel}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
