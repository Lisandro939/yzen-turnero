'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);

    async function handleGoogleLogin() {
        setLoading(true);
        await signIn('google', { callbackUrl: '/' });
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-sm text-center">
                <Link href="/" className="text-2xl font-black text-slate-900 tracking-tight">
                    turnero<span className="text-indigo-400">.</span>
                </Link>

                <h1 className="mt-6 text-xl font-semibold text-slate-800">Iniciá sesión</h1>
                <p className="text-slate-400 text-sm mt-1 mb-10">Accedé a tu cuenta para gestionar tus turnos</p>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
                            <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24.5v8.9h13c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7-10.6 7-17.4z" fill="#4285F4" />
                            <path d="M24.5 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7H3.2v6.2C7.2 42.6 15.3 48 24.5 48z" fill="#34A853" />
                            <path d="M11.4 28.8c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5v-6.2H3.2C1.2 17.3 0 20.8 0 24.3s1.2 7 3.2 10.7l8.2-6.2z" fill="#FBBC05" />
                            <path d="M24.5 9.6c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C36.4 2.5 31 0 24.5 0 15.3 0 7.2 5.4 3.2 13.6l8.2 6.2c1.8-5.6 7-10.2 13.1-10.2z" fill="#EA4335" />
                        </svg>
                    )}
                    {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
                </button>
            </div>
        </div>
    );
}
