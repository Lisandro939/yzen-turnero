"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Slot, Business } from "@/types";
import { createBooking } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "@/lib/toast";

interface BookingFormProps {
    slot: Slot;
    businessSlug: string;
    business: Business;
}

export function BookingForm({
    slot,
    businessSlug,
    business,
}: BookingFormProps) {
  const brand = business.brandColor ?? '#818cf8';
    const router = useRouter();
    const [form, setForm] = useState({ name: "", email: "", phone: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const usesMP = Boolean(business.mpUserId);

    function validate() {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "El nombre es requerido";
        if (!form.email.trim() || !form.email.includes("@"))
            e.email = "Email inválido";
        if (!form.phone.trim()) e.phone = "El teléfono es requerido";
        return e;
    }

    async function handlePay() {
        if (!usesMP) return;
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        setLoading(true);

        if (usesMP) {
            // Real MP payment flow
            try {
                const res = await fetch("/api/mp/create-preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        slotId: slot.id,
                        businessId: slot.businessId,
                        serviceId: slot.serviceId,
                        customerName: form.name,
                        customerEmail: form.email,
                        customerPhone: form.phone,
                        date: slot.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot.price,
                        service: slot.service,
                    }),
                });
                if (!res.ok) throw new Error("Failed to create preference");
                const data = await res.json();
                // Redirect to MP checkout
                window.location.href = data.initPoint;
            } catch (err) {
                console.error(err);
                toast.error({
                    title: "Error al procesar el pago",
                    description: "Intentá de nuevo.",
                });
                setLoading(false);
            }
        } else {
            // Mock payment flow
            await new Promise((res) => setTimeout(res, 1500));

            try {
                await toast.promise(
                    createBooking({
                        slotId: slot.id,
                        businessId: slot.businessId,
                        serviceId: slot.serviceId,
                        customerName: form.name,
                        customerEmail: form.email,
                        customerPhone: form.phone,
                        status: "confirmed",
                        date: slot.date,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot.price,
                        service: slot.service,
                    }),
                    {
                        loading: { title: "Confirmando turno..." },
                        success: { title: "Turno confirmado" },
                        error: { title: "Error al confirmar el turno" },
                    },
                );
            } catch {
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                name: form.name,
                email: form.email,
                phone: form.phone,
                slotId: slot.id,
                price: String(slot.price),
                service: slot.service ?? "",
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime,
            });
            router.push(`/${businessSlug}/book/confirm?${params.toString()}`);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Card className="p-4">
                <p className="text-slate-400 text-sm mb-1">
                    Turno seleccionado
                </p>
                <p className="text-slate-800 font-semibold">
                    {slot.service ?? "Servicio"}
                </p>
                <p className="text-slate-600 text-sm">
                    {slot.startTime} – {slot.endTime}
                </p>
                <p className="font-semibold mt-1" style={{ color: brand }}>
                    ${slot.price.toLocaleString("es-AR")}
                </p>
            </Card>

            <div className="flex flex-col gap-4">
                <Input
                    label="Nombre completo"
                    placeholder="Juan García"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    error={errors.name}
                />
                <Input
                    label="Email"
                    type="email"
                    placeholder="juan@mail.com"
                    value={form.email}
                    onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                    }
                    error={errors.email}
                />
                <Input
                    label="Teléfono"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={form.phone}
                    onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                    }
                    error={errors.phone}
                />
            </div>

            <Button
                size="lg"
                loading={loading}
                onClick={handlePay}
                className="w-full"
                disabled={!usesMP}
                style={{ backgroundColor: brand }}
            >
                {usesMP
                    ? `Pagar con Mercado Pago`
                    : `Pagar $${slot.price.toLocaleString("es-AR")}`}
            </Button>
        </div>
    );
}
