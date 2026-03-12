'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { fetchBusiness, fetchServices, fetchSlots } from '@/lib/api-client';
import { gsap, useGSAP } from '@/lib/gsap';
import type { Business, Service, Slot } from '@/types';
import { Navbar } from '@/components/layout/Navbar';
import { BookingCalendar } from '@/components/BookingCalendar';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Brand SVG icons ──────────────────────────────────────────────────────────

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const { businessSlug } = useParams() as { businessSlug: string };
  const [business, setBusiness] = useState<Business | null | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

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

  // Animate booking panel reveal
  useGSAP(() => {
    if (showBooking && bookingRef.current) {
      gsap.from(bookingRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      });
    }
  }, { dependencies: [showBooking] });

  const businessLoading = business === undefined;

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-56 bg-slate-100 animate-pulse" />
        <div className="max-w-md mx-auto px-6 pt-16 pb-24">
          <Skeleton className="h-6 w-48 mx-auto mb-3 rounded-full" />
          <Skeleton className="h-4 w-64 mx-auto mb-6 rounded-full" />
          <Skeleton className="h-14 rounded-2xl mb-3" />
          <Skeleton className="h-14 rounded-2xl mb-3" />
          <Skeleton className="h-14 rounded-2xl mb-8" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white">
        <Navbar />
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Negocio no encontrado</h1>
        <p className="text-slate-500 mb-6">No existe un negocio con ese nombre.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-300 text-white font-semibold text-sm">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const disableBooking = !business.mpAccessToken;
  const brand = business.brandColor ?? '#818cf8';

  const socialLinks = [
    business.whatsapp && {
      label: 'WhatsApp',
      href: `https://wa.me/${business.whatsapp.replace(/\D/g, '')}`,
      icon: <WhatsAppIcon size={18} />,
    },
    business.instagram && {
      label: 'Instagram',
      href: `https://instagram.com/${business.instagram}`,
      icon: <InstagramIcon size={18} />,
    },
    business.facebook && {
      label: 'Facebook',
      href: `https://facebook.com/${business.facebook}`,
      icon: <FacebookIcon size={18} />,
    },
    business.twitter && {
      label: 'Twitter / X',
      href: `https://x.com/${business.twitter}`,
      icon: <TwitterIcon size={18} />,
    },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[];

  const smallSocialIcons = socialLinks.filter(
    (l) => l.label === 'Instagram' || l.label === 'Facebook',
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO: background image fades to white ── */}
      <div className="relative">
        <div className="h-56 sm:h-64 relative overflow-hidden">
          {business.imageUrl ? (
            <Image
              src={business.imageUrl}
              alt={business.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(160deg, ${brand} 0%, ${brand}aa 100%)` }}
            />
          )}
          {/* fade bottom to white */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
        </div>

        {/* Avatar — centered, overlaps hero bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div
            className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center text-white text-3xl font-black select-none"
            style={{ backgroundColor: brand }}
          >
            {business.name[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── PROFILE INFO ── */}
      <div className="max-w-md mx-auto px-6 pt-16 pb-2 text-center">
        <h1 className="text-2xl font-bold text-slate-800 leading-tight">{business.name}</h1>
        <span
          className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: `${brand}18`, color: brand }}
        >
          {business.category}
        </span>
        {business.description && (
          <p className="text-slate-500 text-sm leading-relaxed mt-3">{business.description}</p>
        )}

        {/* Small social circle icons (Instagram + Facebook only) */}
        {smallSocialIcons.length > 0 && (
          <div className="flex justify-center gap-3 mt-4">
            {smallSocialIcons.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-75"
                style={{ backgroundColor: `${brand}20`, color: brand }}
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── CTA BUTTONS ── */}
      <div className="max-w-md mx-auto px-6 pt-6 pb-4 flex flex-col gap-3">
        {/* Primary: Reservar Turno — always shown */}
        <button
          onClick={() => {
            setShowBooking(true);
            setTimeout(() => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }}
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 text-white font-semibold text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand }}
        >
          <Calendar size={18} />
          Reservar Turno
        </button>

        {/* Social link buttons — only shown if set */}
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 font-medium text-base transition-opacity hover:opacity-80"
            style={{ backgroundColor: `${brand}18`, color: brand }}
          >
            {link.icon}
            {link.label}
          </a>
        ))}
      </div>

      {/* ── SERVICES & BOOKING ── */}
      {showBooking && <div ref={bookingRef} className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {servicesLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-slate-400">Este negocio aún no tiene servicios disponibles.</p>
          </div>
        ) : (
          <>
            {/* Service selector — only shown if multiple */}
            {services.length > 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {services.map((svc) => {
                  const isActive = selectedServiceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedServiceId(svc.id)}
                      className="text-left p-4 rounded-2xl border transition-all"
                      style={
                        isActive
                          ? { backgroundColor: `${brand}0f`, borderColor: brand }
                          : { backgroundColor: 'white', borderColor: '#e2e8f0' }
                      }
                    >
                      <p className="font-semibold text-slate-800 text-sm leading-snug">{svc.name}</p>
                      <p className="text-xs text-slate-400 mt-2">{svc.slotDuration} min</p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: brand }}>
                        desde ${svc.basePrice.toLocaleString('es-AR')}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Booking panel */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {selectedService && (
                <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">{selectedService.name}</h2>
                  {selectedService.description && (
                    <p className="text-slate-500 text-sm mt-1">{selectedService.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                      {selectedService.slotDuration} min
                    </span>
                    <span
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                      style={{ color: brand, borderColor: `${brand}40`, backgroundColor: `${brand}0f` }}
                    >
                      desde ${selectedService.basePrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                {slotsLoading ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-slate-400 text-sm">No hay turnos disponibles para este servicio.</p>
                ) : (
                  <BookingCalendar
                    slots={slots}
                    businessSlug={business.slug}
                    disableBooking={disableBooking}
                    brandColor={brand}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>}
    </div>
  );
}
