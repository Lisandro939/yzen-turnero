'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchMyBookings } from '@/lib/api-client';
import type { MyBooking } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const TODAY = new Date().toISOString().slice(0, 10);

function formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

function BookingCard({ booking }: { booking: MyBooking }) {
    const isPast = booking.date < TODAY;
    return (
        <Card className={`p-4 flex items-start justify-between gap-4 ${isPast ? 'opacity-60' : ''}`}>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{booking.businessName}</p>
                <p className="text-slate-500 text-sm truncate">{booking.service ?? 'Servicio'}</p>
                <p className="text-slate-400 text-sm mt-1 capitalize">
                    {formatDate(booking.date)} · {booking.startTime}–{booking.endTime}
                </p>
                <p className="text-indigo-500 text-sm font-semibold mt-0.5">
                    ${booking.price.toLocaleString('es-AR')}
                </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge status={booking.status} />
                {!isPast && (
                    <Link href={`/${booking.businessSlug}`}>
                        <Button variant="secondary" size="sm">Reservar de nuevo</Button>
                    </Link>
                )}
            </div>
        </Card>
    );
}

export default function CustomerPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<MyBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user === null) router.replace('/auth/login');
    }, [user, router]);

    useEffect(() => {
        fetchMyBookings()
            .then(setBookings)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (!user) return null;

    const firstName = user.name.split(' ')[0];
    const upcoming = bookings.filter((b) => b.date >= TODAY && b.status !== 'cancelled');
    const past = bookings.filter((b) => b.date < TODAY || b.status === 'cancelled');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Hola, {firstName}
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Tus turnos reservados</p>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
            </div>

            {/* Upcoming bookings */}
            <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Próximos turnos
                </h2>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                    </div>
                ) : upcoming.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-slate-400 text-sm">No tenés turnos próximos.</p>
                        <Link href="/" className="mt-4 inline-block">
                            <Button variant="secondary" size="sm">Explorá negocios</Button>
                        </Link>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
                    </div>
                )}
            </section>

            {/* Past bookings */}
            {!loading && past.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        Historial
                    </h2>
                    <div className="space-y-3">
                        {past.map((b) => <BookingCard key={b.id} booking={b} />)}
                    </div>
                </section>
            )}

            {/* CTA — upgrade to business */}
            <Card className="p-6 border-indigo-100 bg-indigo-50/40">
                <p className="font-semibold text-slate-800 text-base">¿Tenés un negocio?</p>
                <p className="text-slate-500 text-sm mt-1 mb-4">
                    Empezá a recibir turnos online gratis. Configurá tu agenda en minutos.
                </p>
                <Link href="/onboarding">
                    <Button size="sm">Empezá gratis</Button>
                </Link>
            </Card>
        </div>
    );
}
