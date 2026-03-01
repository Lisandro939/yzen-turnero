"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { BusinessFormValues } from "@/components/business/BusinessForm";
import { BusinessForm } from "@/components/business/BusinessForm";
import { Card } from "@/components/ui/Card";
import { ConnectMercadoPago } from "@/components/mp/ConnectMercadoPago";

export default function SettingsPage() {
    const { user, businesses, updateBusiness } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const business = businesses.find((b) => b.id === user?.businessId);

    async function handleSubmit(values: BusinessFormValues) {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        updateBusiness(user!.businessId!, values);
        setLoading(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    if (!business)
        return (
            <div className="max-w-3xl">
                <p className="text-slate-400">No se encontró tu negocio.</p>
            </div>
        );

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Mi negocio
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Editá los parámetros de {business.name}
                    </p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m4.5 12.75 6 6 9-13.5"
                            />
                        </svg>
                        Guardado
                    </div>
                )}
            </div>

            <Card className="p-6 sm:p-8 mb-6">
                <BusinessForm
                    mode="edit"
                    initialValues={business}
                    onSubmit={handleSubmit}
                    loading={loading}
                    submitLabel="Guardar cambios"
                />
            </Card>

            <ConnectMercadoPago business={business} />

            {/* Slug info */}
            <Card className="p-4 mt-6">
                <p className="text-slate-400 text-xs mb-1">
                    URL pública de tu negocio
                </p>
                <p className="text-indigo-500 text-sm font-mono">
                    turnero.app/{business.slug}
                </p>
            </Card>
        </div>
    );
}
