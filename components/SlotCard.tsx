import Link from 'next/link';
import type { Slot } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SlotCardProps {
  slot: Slot;
  businessSlug: string;
}

function isPast(date: string, startTime: string): boolean {
  return new Date(`${date}T${startTime}:00`) <= new Date();
}

export function SlotCard({ slot, businessSlug }: SlotCardProps) {
  const isOpen = slot.status === 'open';
  const canBook = isOpen && !isPast(slot.date, slot.startTime);

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
      canBook
        ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 hover:bg-indigo-50'
        : 'border-slate-100 bg-slate-50/50 opacity-60'
    }`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-800 font-semibold">
            {slot.startTime} – {slot.endTime}
          </span>
          <Badge status={slot.status} />
        </div>
        {slot.service && (
          <span className="text-slate-500 text-sm">{slot.service}</span>
        )}
        <span className="text-indigo-500 text-sm font-medium">
          ${slot.price.toLocaleString('es-AR')}
        </span>
      </div>

      {canBook && (
        <Link href={`/${businessSlug}/book?slotId=${slot.id}`}>
          <Button size="sm">Reservar</Button>
        </Link>
      )}
    </div>
  );
}
