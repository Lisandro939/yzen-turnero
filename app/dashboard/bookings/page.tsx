'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchBookings, fetchSlots } from '@/lib/api-client';
import type { Booking, Slot } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessId) return;
    Promise.all([
      fetchBookings(user.businessId),
      fetchSlots(user.businessId),
    ])
      .then(([b, s]) => { setBookings(b); setSlots(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.businessId]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Reservas</h1>
        <p className="text-slate-400 mt-1">Todas las reservas recibidas</p>
      </div>

      {loading ? (
        <Card className="overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex gap-8">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-5 py-4 border-b border-slate-100 flex items-center gap-8">
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1.5" />
                <Skeleton className="h-3 w-24 sm:hidden" />
              </div>
              <div className="flex-1 hidden sm:block">
                <Skeleton className="h-4 w-40 mb-1.5" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1.5" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No hay reservas aún.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-5 py-3 text-slate-500 text-sm font-medium">Cliente</th>
                <th className="text-left px-5 py-3 text-slate-500 text-sm font-medium hidden sm:table-cell">Contacto</th>
                <th className="text-left px-5 py-3 text-slate-500 text-sm font-medium">Turno</th>
                <th className="text-left px-5 py-3 text-slate-500 text-sm font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking, i) => {
                const slot = slots.find((s) => s.id === booking.slotId);
                return (
                  <tr key={booking.id} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-5 py-4">
                      <p className="text-slate-800 font-medium">{booking.customerName}</p>
                      <p className="text-slate-400 text-xs sm:hidden">{booking.customerEmail}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-slate-600 text-sm">{booking.customerEmail}</p>
                      <p className="text-slate-400 text-xs">{booking.customerPhone}</p>
                    </td>
                    <td className="px-5 py-4">
                      {slot ? (
                        <>
                          <p className="text-slate-600 text-sm">{slot.date}</p>
                          <p className="text-slate-400 text-xs">{slot.startTime} – {slot.endTime}</p>
                        </>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4"><Badge status={booking.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
