"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getPlanStatus } from "@/lib/plan-utils";
import {
    Home,
    Calendar,
    List,
    Users,
    Settings,
    Star,
    LogOut,
    AlertTriangle,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
    { href: "/dashboard/bookings", label: "Reservas", icon: List },
    { href: "/dashboard/customers", label: "Clientes", icon: Users },
    { href: "/dashboard/settings", label: "Negocio", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, businesses, logout } = useAuth();

    const business = businesses.find((b) => b.id === user?.businessId);
    const planStatus = business ? getPlanStatus(business) : null;
    const isPlanActive = pathname === "/plan";

    return (
        <>
            {/* ── Desktop sidebar ──────────────────────────────────────── */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 border-r border-slate-200 bg-white flex-col z-40">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <Link
                        href="/"
                        className="text-xl font-bold text-slate-800 tracking-tight"
                    >
                        turnero<span className="text-indigo-400">.</span>
                    </Link>
                </div>

                <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                }`}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Plan item */}
                    <Link
                        href="/plan"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isPlanActive
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                    >
                        <Star className="w-4 h-4 shrink-0" />
                        Plan
                        {planStatus?.expiring &&
                            planStatus.daysLeft !== null && (
                                <span className="ml-auto text-[10px] font-semibold bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                    {planStatus.daysLeft}d
                                </span>
                            )}
                    </Link>
                </nav>

                <div className="px-3 pb-6">
                    {/* MP warning banner */}
                    {business && !business.mpAccessToken && (
                        <Link
                            href="/dashboard/settings"
                            className="flex items-start gap-2 mx-0 mb-3 px-3 py-2.5 rounded-xl border border-[#009EE3]/30 bg-[#009EE3]/5 hover:bg-[#009EE3]/10 transition-colors"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#009EE3]" />
                            <p className="text-[11px] leading-tight font-medium text-[#009EE3]">
                                Conectá Mercado Pago para ser visible a los
                                clientes
                            </p>
                        </Link>
                    )}
                    <div className="px-3 py-2 mb-2">
                        <p className="text-xs text-slate-400 truncate">
                            {user?.email}
                        </p>
                        <p className="text-sm text-slate-600 font-medium truncate">
                            {user?.name}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ── Mobile top header ────────────────────────────────────── */}
            <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
                <Link
                    href="/"
                    className="text-lg font-bold text-slate-800 tracking-tight"
                >
                    turnero<span className="text-indigo-400">.</span>
                </Link>
                <div className="flex items-center gap-3">
                    <div className="text-right leading-none">
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                            {user?.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {user?.email}
                        </p>
                    </div>
                    <button
                        onClick={logout}
                        className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* ── Mobile bottom nav ────────────────────────────────────── */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-stretch">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all active:bg-slate-100 active:scale-95 ${
                                isActive
                                    ? "text-indigo-600"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            <item.icon
                                className={`w-5 h-5 ${isActive ? "stroke-[2]" : "stroke-[1.5]"}`}
                            />
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
                <Link
                    href="/plan"
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 transition-all active:bg-slate-100 active:scale-95 relative ${
                        isPlanActive
                            ? "text-indigo-600"
                            : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                    <Star
                        className={`w-5 h-5 ${isPlanActive ? "stroke-[2]" : "stroke-[1.5]"}`}
                    />
                    <span className="text-[10px] font-medium leading-none">
                        Plan
                    </span>
                    {planStatus?.expiring && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                </Link>
            </nav>
        </>
    );
}

