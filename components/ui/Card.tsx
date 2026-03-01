import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable }: CardProps) {
  const hoverClass = hoverable ? 'hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-all duration-200' : '';
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
