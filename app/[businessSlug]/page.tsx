'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { fetchBusiness, fetchServices, fetchSlots } from '@/lib/api-client';
import type { Business, Service, Slot } from '@/types';
import { getPlanStatus } from '@/lib/plan-utils';
import { Navbar } from '@/components/layout/Navbar';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BusinessPage() {
  const { businessSlug } = useParams() as { businessSlug: string };
  const [business, setBusiness] = useState<Business | null | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    fetchBusiness(businessSlug).then(setBusiness).catch(() => setBusiness(null));
  }, [businessSlug]);

  useEffect(() => {
    if (!business?.id) return;
    fetchServices(business.id)
      .then((svcs) => {
        setServices(svcs);
        if (svcs.length > 0) setSelectedServiceId(svcs[0].id);
      })
      .catch(console.error)
      .finally(() => setServicesLoading(false));
  }, [business?.id]);

  useEffect(() => {
    if (!selectedServiceId) return;
    setSlotsLoading(true);
    fetchSlots(selectedServiceId)
      .then(setSlots)
      .catch(console.error)
      .finally(() => setSlotsLoading(false));
  }, [selectedServiceId]);

  const businessLoading = business === undefined;

  if (businessLoading) {
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

  if (!business.mpAccessToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Navbar />
        <p className="text-6xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Negocio no disponible</h1>
        <p className="text-slate-500 mb-6">Este negocio aún no está listo para recibir reservas.</p>
        <Link href="/"><Button>Ver otros negocios</Button></Link>
      </div>
    );
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const planStatus = business ? getPlanStatus(business) : null;
  const isTrial = planStatus?.inTrial === true;

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

        {servicesLoading ? (
          <div className="flex gap-2 mb-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-10 w-28 rounded-xl" />)}
          </div>
        ) : services.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-slate-400">Este negocio aún no tiene servicios disponibles.</p>
          </Card>
        ) : (
          <>
            {/* Service tabs — only shown if multiple services */}
            {services.length > 1 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedServiceId === svc.id
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    {svc.name}
                  </button>
                ))}
              </div>
            )}

            <Card className="p-6">
              {selectedService && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">{selectedService.name}</h2>
                  {selectedService.description && (
                    <p className="text-slate-500 text-sm mt-1">{selectedService.description}</p>
                  )}
                  <p className="text-slate-400 text-xs mt-1">
                    {selectedService.slotDuration} min · desde ${selectedService.basePrice.toLocaleString('es-AR')}
                  </p>
                </div>
              )}
              {isTrial ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-1">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-medium text-sm">Reservas no disponibles</p>
                  <p className="text-slate-400 text-xs max-w-xs">Este negocio está en período de prueba. Las reservas estarán habilitadas cuando active su plan.</p>
                </div>
              ) : slotsLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-slate-400">No hay turnos disponibles para este servicio.</p>
              ) : (
                <BookingCalendar slots={slots} businessSlug={business.slug} />
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
