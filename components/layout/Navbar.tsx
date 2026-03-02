"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link
                    href="/"
                    className="text-xl font-black text-slate-900 tracking-tight"
                >
                    turnero<span className="text-indigo-400">.</span>
                </Link>

                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {user.role === "owner" && (
                                <Link href="/dashboard">
                                    <Button variant="secondary" size="sm">
                                        Dashboard
                                    </Button>
                                </Link>
                            )}
                            {user.role === "customer" && (
                                <Link href="/customer">
                                    <Button variant="secondary" size="sm">
                                        Mis turnos
                                    </Button>
                                </Link>
                            )}
                            <span className="text-slate-400 text-sm hidden sm:block">
                                {user.name}
                            </span>
                            <Button variant="ghost" size="sm" onClick={logout}>
                                Salir
                            </Button>
                        </>
                    ) : (
                        <Link href="/auth/login">
                            <Button variant="primary" size="sm">
                                Iniciar sesión
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
