"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/lib/auth-context";
import {
    fetchServices,
    fetchSlots,
    fetchBookings,
    blockSlot,
    unblockSlot,
} from "@/lib/api-client";
import type { Slot, Booking, Service } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";

// ── Calendar config ────────────────────────────────────────────────────────
const HOUR_START = 8;
const HOUR_END = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 64;

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getWeekDates(base: Date): Date[] {
    const d = new Date(base);
    const dow = d.getDay(); // 0=Dom
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(d);
        day.setDate(d.getDate() + i);
        return day;
    });
}

function toYMD(d: Date) {
    return d.toISOString().slice(0, 10);
}

function timeToMinutes(t: string) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

function slotTopPx(startTime: string) {
    return ((timeToMinutes(startTime) - HOUR_START * 60) / 60) * PX_PER_HOUR;
}

function slotHeightPx(startTime: string, endTime: string) {
    const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
    return Math.max((mins / 60) * PX_PER_HOUR - 2, 22);
}

function slotColors(status: Slot["status"]) {
    if (status === "open")
        return "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100";
    if (status === "booked")
        return "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";
    // blocked
    return "bg-slate-50 border-slate-200 text-slate-400";
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function AgendaPage() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [weekBase, setWeekBase] = useState(() => new Date());
    const [blockingId, setBlockingId] = useState<string | null>(null);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase]);
    const today = toYMD(new Date());

    // Load services
    useEffect(() => {
        if (!user?.businessId) return;
        fetchServices(user.businessId)
            .then((svcs) => {
                setServices(svcs);
                if (svcs.length > 0) setSelectedServiceId(svcs[0].id);
            })
            .catch(console.error);
    }, [user?.businessId]);

    // Load slots and bookings when selected service changes
    useEffect(() => {
        if (!user?.businessId || !selectedServiceId) return;
        setLoading(true);
        Promise.all([
            fetchSlots(selectedServiceId, {}),
            fetchBookings(user.businessId),
        ])
            .then(([s, b]) => {
                setSlots(s);
                setBookings(b);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.businessId, selectedServiceId]);

    const bookingBySlotId = useMemo(() => {
        const map: Record<string, Booking> = {};
        for (const b of bookings) if (b.slotId) map[b.slotId] = b;
        return map;
    }, [bookings]);

    const weekLabel = (() => {
        const s = weekDates[0];
        const e = weekDates[6];
        const startStr = `${s.getDate()} ${s.toLocaleDateString("es-AR", { month: "short" })}`;
        const endStr = `${e.getDate()} ${e.toLocaleDateString("es-AR", { month: "short", year: "numeric" })}`;
        return `${startStr} – ${endStr}`;
    })();

    async function doBlockSlot(slot: Slot) {
        setBlockingId(slot.id);
        try {
            await toast.promise(blockSlot(slot.id, slot.endTime), {
                loading: { title: "Bloqueando turno..." },
                success: { title: "Turno bloqueado" },
                error: { title: "Error al bloquear" },
            });
            setSlots((prev) =>
                prev.map((s) =>
                    s.id === slot.id ? { ...s, status: "blocked" } : s,
                ),
            );
            setSelectedSlot(null);
        } catch {
            // toast already shows the error
        } finally {
            setBlockingId(null);
        }
    }

    async function doUnblockSlot(slot: Slot) {
        setUnblockingId(slot.id);
        try {
            await toast.promise(unblockSlot(slot.id), {
                loading: { title: "Desbloqueando turno..." },
                success: { title: "Turno desbloqueado" },
                error: { title: "Error al desbloquear" },
            });
            setSlots((prev) =>
                prev.map((s) =>
                    s.id === slot.id ? { ...s, status: "open" } : s,
                ),
            );
            setSelectedSlot(null);
        } catch {
            // toast already shows the error
        } finally {
            setUnblockingId(null);
        }
    }

    const selectedBooking = selectedSlot
        ? bookingBySlotId[selectedSlot.id]
        : null;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Agenda
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Gestioná tus turnos disponibles
                    </p>
                </div>
            </div>

            {/* Service tabs */}
            {services.length > 1 && (
                <div className="flex gap-2 flex-wrap mb-4">
                    {services.map((svc) => (
                        <button
                            key={svc.id}
                            onClick={() => setSelectedServiceId(svc.id)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                                selectedServiceId === svc.id
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-300'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {svc.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Week navigation */}
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={() => {
                        const d = new Date(weekBase);
                        d.setDate(d.getDate() - 7);
                        setWeekBase(d);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5 8.25 12l7.5-7.5"
                        />
                    </svg>
                </button>
                <span className="text-slate-700 font-medium text-sm capitalize flex-1 text-center">
                    {weekLabel}
                </span>
                <button
                    onClick={() => {
                        const d = new Date(weekBase);
                        d.setDate(d.getDate() + 7);
                        setWeekBase(d);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </button>
            </div>

            {loading ? (
                <Card className="p-6">
                    <Skeleton className="h-96 w-full rounded-xl" />
                </Card>
            ) : (
                <div className="overflow-x-auto">
                    <Card className="overflow-hidden min-w-[700px]">
                        {/* Single scroll container — header is sticky inside so columns always align */}
                        <div
                            className="overflow-y-auto"
                            style={{ maxHeight: "640px" }}
                        >
                            {/* Sticky day headers */}
                            <div
                                className="grid sticky top-0 z-10 border-b border-slate-100 bg-white"
                                style={{
                                    gridTemplateColumns: "48px repeat(7, 1fr)",
                                }}
                            >
                                <div className="border-r border-slate-100" />
                                {weekDates.map((date, i) => {
                                    const ymd = toYMD(date);
                                    const isToday = ymd === today;
                                    const hasSlots = slots.some(
                                        (s) => s.date === ymd,
                                    );
                                    return (
                                        <div
                                            key={ymd}
                                            className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday ? "bg-indigo-50" : ""}`}
                                        >
                                            <p
                                                className={`text-xs font-semibold uppercase tracking-wide ${isToday ? "text-indigo-500" : "text-slate-400"}`}
                                            >
                                                {DAY_NAMES[i]}
                                            </p>
                                            <div
                                                className={`mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full text-base font-bold
                      ${isToday ? "bg-indigo-400 text-white" : "text-slate-800"}`}
                                            >
                                                {date.getDate()}
                                            </div>
                                            <div
                                                className={`mx-auto mt-1 w-1.5 h-1.5 rounded-full ${hasSlots ? (isToday ? "bg-indigo-400" : "bg-slate-300") : "invisible"}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Time grid */}
                            <div
                                className="grid"
                                style={{
                                    gridTemplateColumns: "48px repeat(7, 1fr)",
                                }}
                            >
                                {/* Time labels column */}
                                <div
                                    className="relative border-r border-slate-100"
                                    style={{
                                        height: `${TOTAL_HOURS * PX_PER_HOUR}px`,
                                    }}
                                >
                                    {Array.from(
                                        { length: TOTAL_HOURS },
                                        (_, i) => (
                                            <span
                                                key={i}
                                                className={`absolute right-2 text-xs text-slate-400 select-none ${i === 0 ? "" : "-translate-y-2"}`}
                                                style={{
                                                    top: `${i * PX_PER_HOUR}px`,
                                                }}
                                            >
                                                {String(
                                                    HOUR_START + i,
                                                ).padStart(2, "0")}
                                                :00
                                            </span>
                                        ),
                                    )}
                                </div>

                                {/* Day columns */}
                                {weekDates.map((date) => {
                                    const ymd = toYMD(date);
                                    const isToday = ymd === today;
                                    const daySlots = slots.filter(
                                        (s) => s.date === ymd,
                                    );

                                    return (
                                        <div
                                            key={ymd}
                                            className={`relative border-r border-slate-100 last:border-r-0 ${isToday ? "bg-indigo-50/40" : ""}`}
                                            style={{
                                                height: `${TOTAL_HOURS * PX_PER_HOUR}px`,
                                            }}
                                        >
                                            {/* Hour lines */}
                                            {Array.from(
                                                { length: TOTAL_HOURS },
                                                (_, i) => (
                                                    <div
                                                        key={i}
                                                        className="absolute left-0 right-0 border-t border-slate-100"
                                                        style={{
                                                            top: `${i * PX_PER_HOUR}px`,
                                                        }}
                                                    />
                                                ),
                                            )}

                                            {/* Slot chips */}
                                            {daySlots.map((slot) => {
                                                const top = slotTopPx(
                                                    slot.startTime,
                                                );
                                                const height = slotHeightPx(
                                                    slot.startTime,
                                                    slot.endTime,
                                                );
                                                if (
                                                    top < 0 ||
                                                    top >
                                                        TOTAL_HOURS *
                                                            PX_PER_HOUR
                                                )
                                                    return null;
                                                return (
                                                    <button
                                                        key={slot.id}
                                                        className={`absolute left-1 right-1 rounded-lg border px-1.5 py-1 text-left transition-colors ${slotColors(slot.status)}`}
                                                        style={{
                                                            top: `${top}px`,
                                                            height: `${height}px`,
                                                        }}
                                                        onClick={() =>
                                                            setSelectedSlot(
                                                                slot,
                                                            )
                                                        }
                                                    >
                                                        <p className="text-xs font-semibold leading-tight truncate">
                                                            {slot.startTime}
                                                        </p>
                                                        {height > 36 && (
                                                            <p className="text-xs leading-tight truncate opacity-70">
                                                                {slot.service ??
                                                                    "—"}
                                                            </p>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 mt-3">
                <LegendItem color="bg-indigo-200" label="Disponible" />
                <LegendItem color="bg-emerald-200" label="Reservado" />
                <LegendItem color="bg-slate-200" label="Bloqueado" />
            </div>

            {/* Slot detail modal */}
            {selectedSlot && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedSlot(null)}
                >
                    <div className="absolute inset-0 bg-black/30" />
                    <Card
                        className="relative w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1 capitalize">
                                    {new Date(
                                        selectedSlot.date + "T00:00:00",
                                    ).toLocaleDateString("es-AR", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </p>
                                <h2 className="text-slate-800 font-bold text-xl">
                                    {selectedSlot.startTime} –{" "}
                                    {selectedSlot.endTime}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge status={selectedSlot.status} />
                                <button
                                    onClick={() => setSelectedSlot(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18 18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Slot info */}
                        <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
                            <ModalRow
                                label="Servicio"
                                value={selectedSlot.service ?? "—"}
                            />
                            <ModalRow
                                label="Precio"
                                value={`$${selectedSlot.price.toLocaleString("es-AR")}`}
                            />
                        </div>

                        {/* Booking info */}
                        {selectedBooking ? (
                            <div className="flex flex-col gap-2 pt-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                    Cliente
                                </p>
                                <ModalRow
                                    label="Nombre"
                                    value={selectedBooking.customerName}
                                />
                                <ModalRow
                                    label="Email"
                                    value={selectedBooking.customerEmail}
                                />
                                {selectedBooking.customerPhone && (
                                    <ModalRow
                                        label="Teléfono"
                                        value={selectedBooking.customerPhone}
                                    />
                                )}
                                {selectedBooking.mpPaymentId && (
                                    <ModalRow
                                        label="ID de pago"
                                        value={selectedBooking.mpPaymentId}
                                    />
                                )}
                            </div>
                        ) : selectedSlot.status === "booked" ? (
                            <p className="text-slate-400 text-sm pt-4">
                                Cargando datos del cliente…
                            </p>
                        ) : null}

                        {/* Action */}
                        {selectedSlot.status === "open" && (
                            <div className="mt-5">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    loading={blockingId === selectedSlot.id}
                                    onClick={() => doBlockSlot(selectedSlot)}
                                >
                                    Bloquear turno
                                </Button>
                            </div>
                        )}
                        {selectedSlot.status === "blocked" && (
                            <div className="mt-5">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    loading={unblockingId === selectedSlot.id}
                                    onClick={() => doUnblockSlot(selectedSlot)}
                                >
                                    Desbloquear turno
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-slate-400">{label}</span>
        </div>
    );
}

function ModalRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">{label}</span>
            <span className="text-slate-800 font-medium text-sm">{value}</span>
        </div>
    );
}
