'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { fetchSlots } from '@/lib/api-client';
import type { Slot } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BusinessPage() {
  const { businessSlug } = useParams() as { businessSlug: string };
  const { businesses, businessesLoading } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const business = businesses.find((b) => b.slug === businessSlug);

  useEffect(() => {
    if (!business) return;
    fetchSlots(business.id)
      .then(setSlots)
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
  }, [business?.id]);

  if (businessesLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 max-w-4xl mx-auto px-4 pb-24">
          <Skeleton className="h-52 sm:h-64 rounded-2xl mb-6" />
          <div className="mb-8">
            <Skeleton className="h-5 w-24 mb-3 rounded-full" />
            <Skeleton className="h-9 w-72 mb-3" />
            <Skeleton className="h-5 w-96 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Navbar />
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Negocio no encontrado</h1>
        <p className="text-slate-500 mb-6">No existe un negocio con ese nombre.</p>
        <Link href="/"><Button>Volver al inicio</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-24">
        {business.imageUrl ? (
          <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden mb-6">
            <Image src={business.imageUrl} alt={business.name} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="h-40 sm:h-52 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
            <span className="text-7xl">🏪</span>
          </div>
        )}

        <div className="mb-8">
          <span className="inline-block text-xs font-medium text-indigo-500 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full mb-3">
            {business.category}
          </span>
          <h1 className="text-3xl font-bold text-slate-800">{business.name}</h1>
          <p className="text-slate-500 mt-2">{business.description}</p>
          <p className="text-slate-400 text-sm mt-1">por {business.ownerName}</p>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Turnos disponibles</h2>
          {slotsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-slate-400">No hay turnos disponibles en este momento.</p>
          ) : (
            <BookingCalendar slots={slots} businessSlug={business.slug} />
          )}
        </Card>
      </div>
    </div>
  );
}
