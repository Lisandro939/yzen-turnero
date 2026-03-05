"use client";

import { useState, useRef } from "react";
import { ChevronRight, Copy, Check, Download } from "lucide-react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/auth-context";
import type { BusinessFormValues } from "@/components/business/BusinessForm";
import { BusinessForm } from "@/components/business/BusinessForm";
import { Card } from "@/components/ui/Card";
import { ConnectMercadoPago } from "@/components/mp/ConnectMercadoPago";
import { toast } from "@/lib/toast";

export default function SettingsPage() {
    const { user, businesses, updateBusiness } = useAuth();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLCanvasElement>(null);

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

            <Card className="p-5 mt-6">
                <p className="text-slate-500 font-semibold text-sm mb-3">URL pública de tu negocio</p>
                <div className="flex items-center gap-2 mb-4">
                    <p className="text-indigo-500 text-sm font-mono flex-1 truncate">
                        yzen-turnero.vercel.app/{business.slug}
                    </p>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`https://yzen-turnero.vercel.app/${business.slug}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
                <div className="flex items-end gap-4">
                    <div className="hidden" aria-hidden="true">
                        <QRCodeCanvas
                            ref={qrRef}
                            value={`https://yzen-turnero.vercel.app/${business.slug}`}
                            size={512}
                            marginSize={2}
                        />
                    </div>
                    <QRCodeCanvas
                        value={`https://yzen-turnero.vercel.app/${business.slug}`}
                        size={100}
                        marginSize={1}
                        className="rounded-lg border border-slate-200"
                    />
                    <button
                        onClick={() => {
                            const canvas = qrRef.current;
                            if (!canvas) return;
                            const url = canvas.toDataURL('image/png');
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `qr-${business.slug}.png`;
                            a.click();
                        }}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Descargar QR
                    </button>
                </div>
            </Card>
        </div>
    );
}
