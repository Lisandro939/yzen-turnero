export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />;
}
