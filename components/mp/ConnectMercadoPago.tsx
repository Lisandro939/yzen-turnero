'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Business } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
    business: Business;
}

export function ConnectMercadoPago({ business }: Props) {
    const searchParams = useSearchParams();
    const mpStatus = searchParams.get('mp');
    const [connecting, setConnecting] = useState(false);

    async function handleConnect() {
        setConnecting(true);
        try {
            const res = await fetch('/api/mp/connect');
            const data = await res.json();
            window.location.href = data.url;
        } catch {
            setConnecting(false);
        }
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-slate-800 font-semibold">Mercado Pago</h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                        {business.mpUserId
                            ? 'Tu cuenta está conectada. Los clientes podrán pagarte directamente.'
                            : 'Conectá tu cuenta para recibir pagos de tus clientes.'}
                    </p>
                </div>

                {business.mpUserId ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Conectado
                    </span>
                ) : (
                    <Button
                        loading={connecting}
                        onClick={handleConnect}
                        variant="secondary"
                        size="sm"
                    >
                        Conectar
                    </Button>
                )}
            </div>

            {mpStatus === 'connected' && (
                <p className="mt-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                    ¡Cuenta conectada exitosamente!
                </p>
            )}
            {mpStatus === 'error' && (
                <p className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                    Hubo un error al conectar tu cuenta. Intentá de nuevo.
                </p>
            )}
        </Card>
    );
}
