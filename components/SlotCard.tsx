import Link from 'next/link';
import type { Slot } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SlotCardProps {
  slot: Slot;
  businessSlug: string;
  disableBooking?: boolean;
  brandColor?: string;
}

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isPast(date: string, startTime: string): boolean {
  return new Date(`${date}T${startTime}:00`) <= new Date();
}

export function SlotCard({ slot, businessSlug, disableBooking, brandColor }: SlotCardProps) {
  const brand = brandColor ?? '#818cf8';
  const isOpen = slot.status === 'open';
  const canBook = isOpen && !isPast(slot.date, slot.startTime);

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${!canBook ? 'border-slate-100 bg-slate-50/50 opacity-60' : ''}`}
      style={canBook ? {
        borderColor: hexAlpha(brand, 0.35),
        backgroundColor: hexAlpha(brand, 0.05),
      } : undefined}
    >
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
        <span className="text-sm font-medium" style={{ color: brand }}>
          ${slot.price.toLocaleString('es-AR')}
        </span>
      </div>

      {canBook && (
        disableBooking ? (
          <Button size="sm" disabled style={{ backgroundColor: brand }}>Reservar</Button>
        ) : (
          <Link href={`/${businessSlug}/book?slotId=${slot.id}`}>
            <Button size="sm" style={{ backgroundColor: brand }}>Reservar</Button>
          </Link>
        )
      )}
    </div>
  );
}
