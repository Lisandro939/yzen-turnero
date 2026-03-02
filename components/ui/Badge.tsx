interface BadgeProps {
  status: 'open' | 'booked' | 'blocked' | 'cancelled' | 'confirmed' | 'pending' | 'approved' | 'rejected';
  className?: string;
}

export function Badge({ status, className = '' }: BadgeProps) {
  const styles: Record<string, string> = {
    open: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    booked: 'bg-amber-100 text-amber-700 border border-amber-200',
    blocked: 'bg-slate-100 text-slate-500 border border-slate-200',
    cancelled: 'bg-rose-100 text-rose-600 border border-rose-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    rejected: 'bg-rose-100 text-rose-600 border border-rose-200',
  };

  const labels: Record<string, string> = {
    open: 'Disponible',
    booked: 'Reservado',
    blocked: 'Bloqueado',
    cancelled: 'Cancelado',
    confirmed: 'Confirmado',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]} ${className}`}>
      {labels[status]}
    </span>
  );
}
