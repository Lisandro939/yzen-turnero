'use client';

import { useState } from 'react';
import type { Slot } from '@/types';
import { SlotCard } from './SlotCard';

interface BookingCalendarProps {
  slots: Slot[];
  businessSlug: string;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function BookingCalendar({ slots, businessSlug }: BookingCalendarProps) {
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  const [selectedDate, setSelectedDate] = useState(dates[0] ?? '');

  const daySlots = slots.filter((s) => s.date === selectedDate);

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
              className={`flex flex-col items-center px-4 py-3 rounded-xl border text-sm shrink-0 transition-all ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                  : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-slate-800'
              }`}
            >
              <span className="font-medium capitalize">
                {d.toLocaleDateString('es-AR', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold">{d.getDate()}</span>
              {hasOpen && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="text-slate-700 font-semibold mb-4 capitalize">{formatDate(selectedDate)}</h3>
        <div className="flex flex-col gap-3">
          {daySlots.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay turnos para este día.</p>
          ) : (
            daySlots.map((slot) => (
              <SlotCard key={slot.id} slot={slot} businessSlug={businessSlug} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
