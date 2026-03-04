'use client';

import { useEffect, useState } from 'react';
import { Calendar, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function WelcomePage() {
    const { user, markRoleChosen } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState<'customer' | 'business' | null>(null);

    useEffect(() => {
        if (user === null) router.replace('/auth/login');
        else if (user.roleChosen && user.role === 'owner') router.replace('/dashboard');
        else if (user.roleChosen) router.replace('/customer');
    }, [user, router]);

    if (!user || user.roleChosen) return null;

    const firstName = user.name.split(' ')[0];

    async function handleChoose(choice: 'customer' | 'business') {
        setLoading(choice);
        try {
            if (choice === 'business') {
                // Skip markRoleChosen here — owners get roleChosen=true automatically
                // in the JWT callback once they create a business. Calling it now would
                // set roleChosen=true with role='customer', causing a redirect to /customer.
                router.push('/onboarding');
            } else {
                await markRoleChosen();
                router.push('/customer');
            }
        } catch {
            setLoading(null);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <Link href="/" className="text-2xl font-black text-slate-900 tracking-tight">
                        turnero<span className="text-indigo-400">.</span>
                    </Link>
                    <h1 className="mt-8 text-2xl font-bold text-slate-800">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="text-slate-400 mt-2">
                        ¿Cómo vas a usar turnero?
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Soy cliente */}
                    <button
                        onClick={() => handleChoose('customer')}
                        disabled={loading !== null}
                        className="group flex flex-col items-center gap-4 p-8 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-800 text-base">
                                {loading === 'customer' ? 'Entrando...' : 'Soy cliente'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                Quiero reservar turnos en negocios
                            </p>
                        </div>
                    </button>

                    {/* Tengo un negocio */}
                    <button
                        onClick={() => handleChoose('business')}
                        disabled={loading !== null}
                        className="group flex flex-col items-center gap-4 p-8 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                            <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-800 text-base">
                                {loading === 'business' ? 'Entrando...' : 'Tengo un negocio'}
                            </p>
                            <p className="text-slate-400 text-sm mt-1">
                                Quiero gestionar mis turnos
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
