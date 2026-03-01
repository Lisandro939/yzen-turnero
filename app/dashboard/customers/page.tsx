'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchBookings } from '@/lib/api-client';
import type { Booking } from '@/types';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CustomersPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessId) return;
    fetchBookings(user.businessId)
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.businessId]);

  const customerMap = new Map<string, { name: string; email: string; phone: string; count: number }>();
  for (const b of bookings) {
    if (customerMap.has(b.customerEmail)) {
      customerMap.get(b.customerEmail)!.count++;
    } else {
      customerMap.set(b.customerEmail, { name: b.customerName, email: b.customerEmail, phone: b.customerPhone, count: 1 });
    }
  }
  const customers = [...customerMap.values()];

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>
        <p className="text-slate-400 mt-1">
          {loading ? '—' : `${customers.length} cliente${customers.length !== 1 ? 's' : ''} en total`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1.5" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">Todavía no tenés clientes registrados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customers.map((c) => (
            <Card key={c.email} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-800 font-semibold">{c.name}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{c.email}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{c.phone}</p>
                </div>
                <span className="text-xs font-medium text-indigo-500 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                  {c.count} turno{c.count !== 1 ? 's' : ''}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
