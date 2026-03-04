"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { BusinessFormValues } from "@/components/business/BusinessForm";
import { BusinessForm } from "@/components/business/BusinessForm";
import { Card } from "@/components/ui/Card";
import { ConnectMercadoPago } from "@/components/mp/ConnectMercadoPago";
import { toast } from "@/lib/toast";

export default function SettingsPage() {
    const { user, businesses, updateBusiness } = useAuth();
    const [loading, setLoading] = useState(false);

    const business = businesses.find((b) => b.id === user?.businessId);

    async function handleSubmit(values: BusinessFormValues) {
        setLoading(true);
        try {
            await toast.promise(updateBusiness(user!.businessId!, values), {
                loading: { title: "Guardando cambios..." },
                success: { title: "Cambios guardados" },
                error: { title: "Error al guardar" },
            });
        } finally {
            setLoading(false);
        }
    }

    if (!business)
        return (
            <div className="max-w-3xl">
                <p className="text-slate-400">No se encontró tu negocio.</p>
            </div>
        );

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Mi negocio</h1>
                <p className="text-slate-400 mt-1">Editá los parámetros de {business.name}</p>
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

            <Card className="p-5 mb-4">
                <Link href="/dashboard/settings/services" className="flex items-center justify-between group">
                    <div>
                        <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">Servicios</p>
                        <p className="text-slate-400 text-sm">Gestioná los servicios que ofrecés</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </Link>
            </Card>

            <ConnectMercadoPago business={business} />

            <Card className="p-4 mt-6">
                <p className="text-slate-400 text-xs mb-1">URL pública de tu negocio</p>
                <p className="text-indigo-500 text-sm font-mono">yzen-turnero.vercel.app/{business.slug}</p>
            </Card>
        </div>
    );
}
