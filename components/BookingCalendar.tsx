'use client';

import { useRef, useState } from 'react';
import type { Slot } from '@/types';
import { gsap, useGSAP } from '@/lib/gsap';
import { SlotCard } from './SlotCard';

interface BookingCalendarProps {
  slots: Slot[];
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function BookingCalendar({ slots, businessSlug, disableBooking, brandColor }: BookingCalendarProps) {
  const brand = brandColor ?? '#818cf8';
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? '');
  const slotsContainerRef = useRef<HTMLDivElement>(null);

  const daySlots = slots.filter((s) => s.date === selectedDate);

  useGSAP(() => {
    if (slotsContainerRef.current && slotsContainerRef.current.children.length > 0) {
      gsap.from(slotsContainerRef.current.children, {
        y: 12,
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [selectedDate] });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dates.map((date) => {
          const d = new Date(date + 'T00:00:00');
          const isSelected = date === selectedDate;
          const hasOpen = slots.some((s) => s.date === date && s.status === 'open');
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className="flex flex-col items-center px-4 py-3 rounded-xl border text-sm shrink-0 transition-all"
              style={isSelected ? {
                backgroundColor: hexAlpha(brand, 0.08),
                borderColor: hexAlpha(brand, 0.5),
                color: brand,
              } : undefined}
            >
              <span className="font-medium capitalize">
                {d.toLocaleDateString('es-AR', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold">{d.getDate()}</span>
              {hasOpen && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ backgroundColor: brand }} />
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="text-slate-700 font-semibold mb-4 capitalize">{formatDate(selectedDate)}</h3>
        <div ref={slotsContainerRef} className="flex flex-col gap-3">
          {daySlots.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay turnos para este día.</p>
          ) : (
            daySlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} businessSlug={businessSlug} disableBooking={disableBooking} brandColor={brand} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
