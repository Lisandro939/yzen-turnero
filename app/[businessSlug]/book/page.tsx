'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchBusiness, fetchSlot } from '@/lib/api-client';
import type { Business, Slot } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { BookingForm } from '@/components/BookingForm';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BookPage() {
  const { businessSlug } = useParams() as { businessSlug: string };
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slotId') ?? '';
  const [business, setBusiness] = useState<Business | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slotId) return;
    Promise.all([
      fetchBusiness(businessSlug),
      fetchSlot(slotId).catch(() => null),
    ])
      .then(([biz, s]) => {
        setBusiness(biz);
        if (!s) setNotFound(true);
        else setSlot(s);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slotId, businessSlug]);

  if (!loading && (notFound || !slot)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Navbar />
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Turno no encontrado</h1>
        <p className="text-slate-500 mb-6">El turno que buscás no existe o ya no está disponible.</p>
        <Link href="/"><Button>Volver al inicio</Button></Link>
      </div>
    );
  }

  if (loading || !business || !slot) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 max-w-lg mx-auto px-4 pb-24">
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-12 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const brand = business.brandColor ?? '#818cf8';

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${brand}26` }}>
      <Navbar />
      <div className="pt-24 max-w-lg mx-auto px-4 pb-24">
        <div className="mb-6">
          <p className="text-slate-400 text-sm">{business.name}</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Completá tu reserva</h1>
        </div>
        <BookingForm slot={slot} businessSlug={businessSlug} business={business} />
      </div>
    </div>
  );
}
