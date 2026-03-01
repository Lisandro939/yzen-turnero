import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={3}
        className={`w-full bg-white border ${error ? 'border-rose-300' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
