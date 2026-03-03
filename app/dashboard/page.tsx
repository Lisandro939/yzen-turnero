"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchServices, fetchSlots, fetchBookings } from "@/lib/api-client";
import { getPlanStatus } from "@/lib/plan-utils";
import type { Slot, Booking } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

function today() {
    return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
    const { user, businesses } = useAuth();
    const [slots, setSlots] = useState<Slot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const bizId = user?.businessId;
    const business = businesses.find((b) => b.id === bizId);
    const planStatus = business ? getPlanStatus(business) : null;

    useEffect(() => {
        if (!bizId) return;
        const todayDate = today();
        Promise.all([
            fetchServices(bizId).then((svcs) =>
                svcs.length > 0
                    ? Promise.all(svcs.map((svc) => fetchSlots(svc.id, { date: todayDate }))).then((all) => all.flat())
                    : []
            ),
            fetchBookings(bizId),
        ])
            .then(([s, b]) => {
                setSlots(s);
                setBookings(b);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [bizId]);

    const todayStr = today();
    const todaySlots = slots.filter((s) => s.date === todayStr);
    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const openCount = todaySlots.filter((s) => s.status === "open").length;
    const bookedCount = todaySlots.filter((s) => s.status === "booked").length;
    const revenue = todaySlots
        .filter((s) => s.status === "booked")
        .reduce((acc, s) => acc + s.price, 0);

    return (
        <div className="w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    Buenos días
                    {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-slate-400 mt-1">
                    {business?.name}
                    {business?.name ? " -" : ""} Resumen de hoy
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {loading ? (
                    <>
                        <Card className="p-5">
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-9 w-16" />
                        </Card>
                        <Card className="p-5">
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-9 w-16" />
                        </Card>
                        <Card className="p-5">
                            <Skeleton className="h-4 w-28 mb-3" />
                            <Skeleton className="h-9 w-24" />
                        </Card>
                    </>
                ) : (
                    <>
                        <Card className="p-5">
                            <p className="text-slate-400 text-sm">Turnos hoy</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">
                                {todaySlots.length}
                            </p>
                        </Card>
                        <Card className="p-5">
                            <p className="text-slate-400 text-sm">Reservados</p>
                            <p className="text-3xl font-bold text-indigo-400 mt-1">
                                {bookedCount}
                            </p>
                        </Card>
                        <Card className="p-5">
                            <p className="text-slate-400 text-sm">
                                Ingresos estimados
                            </p>
                            <p className="text-3xl font-bold text-emerald-500 mt-1">
                                ${revenue.toLocaleString("es-AR")}
                            </p>
                        </Card>
                    </>
                )}
            </div>

            <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Reservas de hoy
            </h2>

            {loading ? (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-4 w-64 mb-1.5" />
                            <Skeleton className="h-3 w-48" />
                        </Card>
                    ))}
                </div>
            ) : todayBookings.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-slate-400">
                        No hay reservas confirmadas para hoy.
                    </p>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {todayBookings.map((booking) => (
                        <Card
                            key={booking.id}
                            className="p-4 flex items-center justify-between"
                        >
                            <div>
                                <p className="text-slate-800 font-semibold">
                                    {booking.customerName}
                                </p>
                                <p className="text-slate-500 text-sm">
                                    {booking.startTime} – {booking.endTime}
                                    {booking.service ? ` · ${booking.service}` : ""}
                                </p>
                                <p className="text-slate-400 text-xs">
                                    {booking.customerEmail}
                                </p>
                            </div>
                            <Badge status={booking.status} />
                        </Card>
                    ))}
                </div>
            )}

            {!loading && openCount > 0 && (
                <Card className="mt-6 p-4 border-indigo-200 bg-indigo-50">
                    <p className="text-indigo-600 text-sm font-medium">
                        Tenés <strong>{openCount}</strong> turno
                        {openCount !== 1 ? "s" : ""} disponible
                        {openCount !== 1 ? "s" : ""} hoy sin reservar.
                    </p>
                </Card>
            )}

            {planStatus?.expiring && (
                <Card className="mt-6 p-4 border-amber-200 bg-amber-50">
                    <p className="text-amber-700 text-sm font-medium">
                        Tu plan vence en <strong>{planStatus.daysLeft} día{planStatus.daysLeft !== 1 ? 's' : ''}</strong>.{' '}
                        <Link href="/plan" className="underline">Renovar ahora</Link>
                    </p>
                </Card>
            )}
        </div>
    );
}
