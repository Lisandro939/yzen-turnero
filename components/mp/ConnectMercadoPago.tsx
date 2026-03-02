'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Business } from '@/types';

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

    const isConnected = !!business.mpUserId;

    return (
        <div className={`rounded-2xl border overflow-hidden ${isConnected ? 'border-slate-200' : 'border-[#009EE3]/30'}`}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center gap-3 ${isConnected ? 'bg-white' : 'bg-[#009EE3]/5'}`}>
                <Image src="/mercado-pago-logo.png" alt="Mercado Pago" width={80} height={24} className="shrink-0 object-contain" unoptimized />
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">Mercado Pago</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {isConnected
                            ? 'Tu cuenta está conectada. Los clientes pueden pagarte.'
                            : 'Conectá tu cuenta para recibir pagos de tus clientes.'}
                    </p>
                </div>
                {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Conectado
                    </span>
                ) : (
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                        style={{ backgroundColor: '#009EE3' }}
                    >
                        {connecting ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                            </svg>
                        ) : null}
                        {connecting ? 'Conectando...' : 'Conectar cuenta'}
                    </button>
                )}
            </div>

            {/* Status messages */}
            {mpStatus === 'connected' && (
                <div className="px-6 py-3 bg-emerald-50 border-t border-emerald-100 text-sm text-emerald-700 font-medium">
                    ¡Cuenta conectada exitosamente!
                </div>
            )}
            {mpStatus === 'error' && (
                <div className="px-6 py-3 bg-rose-50 border-t border-rose-100 text-sm text-rose-700">
                    Hubo un error al conectar tu cuenta. Intentá de nuevo.
                </div>
            )}

            {/* Warning when not connected */}
            {!isConnected && mpStatus !== 'connected' && (
                <div className="px-6 py-3 border-t border-[#009EE3]/20 bg-[#009EE3]/5 flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#009EE3] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <p className="text-xs text-[#009EE3] font-medium">
                        Tu negocio no es visible para los clientes hasta que conectes tu cuenta de Mercado Pago.
                    </p>
                </div>
            )}
        </div>
    );
}
