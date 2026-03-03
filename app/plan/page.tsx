"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getPlanStatus, PLAN_PRICES } from "@/lib/plan-utils";

const ORIGINAL_PRICES = { pro: 15000, max: 30000 } as const;

function savingsPercent(plan: "pro" | "max") {
    return Math.round(((ORIGINAL_PRICES[plan] - PLAN_PRICES[plan]) / ORIGINAL_PRICES[plan]) * 100);
}
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

function CheckIcon() {
    return (
        <svg
            className="w-4 h-4 text-emerald-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
            />
        </svg>
    );
}

const PRO_FEATURES = [
    "Agenda de turnos",
    "Gestión de reservas",
    "Lista de clientes",
    "Configuración del negocio",
    "Integración con Mercado Pago",
];

const MAX_FEATURES = [
    "Todo lo de Plan Pro",
    "Configuración avanzada",
    "Automatizaciones (próximamente)",
    "Soporte prioritario",
];

export default function PlanPage() {
    const { user, businesses } = useAuth();
    // const router = useRouter();
    const searchParams = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState<"pro" | "max" | null>(null);

    const payment = searchParams.get("payment");
    const upgradeMax = searchParams.get("upgrade") === "max";

    const business = businesses.find((b) => b.id === user?.businessId);
    const planStatus = business ? getPlanStatus(business) : null;

    async function handlePurchase(plan: "pro" | "max") {
        setLoadingPlan(plan);
        try {
            const res = await fetch("/api/mp/plan-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error({
                    title: "Error al iniciar el pago",
                    description: data.error ?? "Intentá de nuevo más tarde",
                });
                setLoadingPlan(null);
                return;
            }
            if (data.initPoint) {
                window.location.href = data.initPoint;
            }
        } catch {
            toast.error({
                title: "Error de conexión",
                description: "No se pudo conectar con el servidor de pagos",
            });
            setLoadingPlan(null);
        }
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }

    return (
        <div className="min-h-screen bg-[#f5f7ff] flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="mb-2">
                    <Link
                        href="/dashboard"
                        className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        ← Volver al dashboard
                    </Link>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    Tu plan
                </h1>
                <p className="text-slate-400 mb-8">
                    Gestioná tu suscripción a Turnero.
                </p>

                {/* Payment result banner */}
                {payment === "success" && (
                    <Card className="p-4 mb-6 border-emerald-200 bg-emerald-50">
                        <p className="text-emerald-700 text-sm font-medium">
                            ¡Pago exitoso! Tu plan fue activado. Puede demorar
                            unos minutos en reflejarse.
                        </p>
                    </Card>
                )}
                {payment === "failed" && (
                    <Card className="p-4 mb-6 border-red-200 bg-red-50">
                        <p className="text-red-700 text-sm font-medium">
                            El pago no fue procesado. Podés intentarlo de nuevo.
                        </p>
                    </Card>
                )}
                {payment === "pending" && (
                    <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
                        <p className="text-amber-700 text-sm font-medium">
                            Tu pago está siendo procesado. Te notificaremos
                            cuando se confirme.
                        </p>
                    </Card>
                )}

                {/* Current plan status */}
                {planStatus && (
                    <Card className="p-5 mb-8">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                            Estado actual
                        </p>
                        {planStatus.active ? (
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-slate-800 font-semibold text-lg">
                                        Plan{" "}
                                        {planStatus.plan === "max"
                                            ? "Max"
                                            : "Pro"}
                                        {planStatus.inTrial && (
                                            <span className="ml-2 text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                Trial gratuito
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {planStatus.inTrial
                                            ? `${planStatus.daysLeft} día${planStatus.daysLeft !== 1 ? "s" : ""} restantes de prueba`
                                            : business?.planExpiresAt
                                              ? `Vence el ${formatDate(business.planExpiresAt)}`
                                              : `${planStatus.daysLeft} día${planStatus.daysLeft !== 1 ? "s" : ""} restantes`}
                                    </p>
                                </div>
                                {planStatus.expiring && (
                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                        Vence pronto
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div>
                                <p className="text-slate-800 font-semibold text-lg text-red-500">
                                    Plan vencido
                                </p>
                                <p className="text-slate-500 text-sm">
                                    Seleccioná un plan para seguir usando
                                    Turnero.
                                </p>
                            </div>
                        )}
                    </Card>
                )}

                {/* Plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Plan Pro */}
                    <Card
                        className={`p-6 flex flex-col ${upgradeMax ? "opacity-80" : "border-indigo-200"}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-bold text-slate-800">
                                Plan Pro
                            </h2>
                            {!upgradeMax &&
                                planStatus?.plan === "pro" &&
                                planStatus.active && (
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Activo
                                    </span>
                                )}
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-2xl font-bold text-slate-800">
                                    ${PLAN_PRICES.pro.toLocaleString("es-AR")}
                                </span>
                                <span className="text-slate-400 text-sm">/mes</span>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Ahorrás {savingsPercent("pro")}%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Antes: <span className="line-through">${ORIGINAL_PRICES.pro.toLocaleString("es-AR")}</span>
                            </p>
                        </div>
                        <ul className="flex flex-col gap-2 mb-6 flex-1">
                            {PRO_FEATURES.map((f) => (
                                <li
                                    key={f}
                                    className="flex items-center gap-2 text-sm text-slate-600"
                                >
                                    <CheckIcon /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button
                            onClick={() => handlePurchase("pro")}
                            disabled={loadingPlan !== null}
                            className="w-full"
                        >
                            {loadingPlan === "pro"
                                ? "Redirigiendo..."
                                : planStatus?.plan === "pro" &&
                                    planStatus.active
                                  ? "Renovar Plan Pro"
                                  : "Comprar Plan Pro"}
                        </Button>
                    </Card>

                    {/* Plan Max */}
                    <Card
                        className={`p-6 flex flex-col ${upgradeMax ? "border-indigo-300 ring-2 ring-indigo-200" : ""}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-bold text-slate-800">
                                Plan Max
                            </h2>
                            {planStatus?.plan === "max" && planStatus.active ? (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Activo
                                </span>
                            ) : upgradeMax ? (
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    Recomendado
                                </span>
                            ) : null}
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-2xl font-bold text-slate-800">
                                    ${PLAN_PRICES.max.toLocaleString("es-AR")}
                                </span>
                                <span className="text-slate-400 text-sm">/mes</span>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Ahorrás {savingsPercent("max")}%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Antes: <span className="line-through">${ORIGINAL_PRICES.max.toLocaleString("es-AR")}</span>
                            </p>
                        </div>
                        <ul className="flex flex-col gap-2 mb-6 flex-1">
                            {MAX_FEATURES.map((f) => (
                                <li
                                    key={f}
                                    className="flex items-center gap-2 text-sm text-slate-600"
                                >
                                    <CheckIcon /> {f}
                                </li>
                            ))}
                        </ul>
                        <Button
                            onClick={() => handlePurchase("max")}
                            disabled={loadingPlan !== null}
                            className="w-full"
                        >
                            {loadingPlan === "max"
                                ? "Redirigiendo..."
                                : planStatus?.plan === "max" &&
                                    planStatus.active
                                  ? "Renovar Plan Max"
                                  : "Comprar Plan Max"}
                        </Button>
                    </Card>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Pagos procesados de forma segura con Mercado Pago. Cada pago
                    extiende tu acceso 30 días.
                </p>
            </div>
        </div>
    );
}
