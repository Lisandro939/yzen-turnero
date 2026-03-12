"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
    Check,
    X,
    Zap,
    BarChart2,
    Link2,
    Calendar,
    Store,
    Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchBusinesses } from "@/lib/api-client";
import type { Business } from "@/types";

export default function HomePage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const mainRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLElement>(null);
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        fetchBusinesses().then(setBusinesses).catch(console.error);
    }, []);

    useGSAP(() => {
        // Hero entrance: stagger children
        if (heroRef.current) {
            const children = heroRef.current.querySelector('.max-w-2xl')?.children;
            if (children) {
                gsap.from(children, {
                    y: 24,
                    opacity: 0,
                    duration: 0.7,
                    stagger: 0.1,
                    ease: 'power2.out',
                });
            }
        }

        // Scroll-reveal for each section
        sectionRefs.current.forEach((section) => {
            if (!section) return;
            const grid = section.querySelector('.grid');
            if (grid) {
                // Animate section heading area first
                const headingEls = Array.from(section.children).filter(
                    (el) => !el.classList.contains('grid'),
                );
                if (headingEls.length) {
                    gsap.from(headingEls, {
                        y: 30,
                        opacity: 0,
                        duration: 0.6,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 85%',
                            once: true,
                        },
                    });
                }
                // Stagger grid children
                gsap.from(grid.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: grid,
                        start: 'top 85%',
                        once: true,
                    },
                });
            } else {
                // Simple section (mockup, CTA, business list, footer)
                gsap.from(section.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 85%',
                        once: true,
                    },
                });
            }
        });
    }, { scope: mainRef });

    return (
        <div ref={mainRef} className="min-h-screen" style={{ background: "#f5f7ff" }}>
            <Navbar />

            {/* ── Hero ───────────────────────────────────────────────────── */}
            <section ref={heroRef} className="pt-30 pb-20 px-4 text-center">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5">
                        Dejá de perder turnos{" "}
                        <span className="text-indigo-400">por WhatsApp</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-lg mx-auto mb-10 leading-relaxed">
                        Tus clientes reservan solos desde un link, sin llamadas
                        ni mensajes. Vos te enfocás en atender.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link href="/auth/login">
                            <Button size="lg">Probalo gratis</Button>
                        </Link>
                        <a href="#negocios">
                            <Button size="lg" variant="secondary">
                                Ver negocios →
                            </Button>
                        </a>
                    </div>
                    <p className="text-xs text-slate-400 mt-4">
                        Sin tarjeta de crédito · Configuración en 5 minutos
                    </p>
                </div>
            </section>

            {/* ── Demo mockup ────────────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[0] = el; }} className="max-w-sm mx-auto px-4 pb-24">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-indigo-50 border-b border-slate-200 px-5 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                            EB
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm">
                                El Barber
                            </p>
                            <p className="text-xs text-slate-400">
                                Peluquería · Palermo
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-slate-600">
                                5.0
                            </span>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        {[
                            {
                                name: "Corte clásico",
                                duration: "45 min",
                                price: "$8.000",
                            },
                            {
                                name: "Corte + Barba",
                                duration: "60 min",
                                price: "$12.000",
                            },
                            {
                                name: "Barba",
                                duration: "30 min",
                                price: "$5.000",
                            },
                        ].map((svc) => (
                            <div
                                key={svc.name}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                            >
                                <div>
                                    <p className="text-sm font-medium text-slate-800">
                                        {svc.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {svc.duration}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">
                                        {svc.price}
                                    </span>
                                    <span className="text-xs bg-indigo-300 text-white px-3 py-1 rounded-full font-medium">
                                        Reservar
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Problem vs Solution ────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[1] = el; }} className="max-w-4xl mx-auto px-4 pb-24">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">
                    El antes y el después
                </h2>
                <p className="text-slate-400 text-center mb-12">
                    ¿Cuánto tiempo perdés gestionando turnos a mano?
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-white border border-rose-100 rounded-2xl p-6">
                        <p className="text-xs font-bold text-rose-400 mb-5 uppercase tracking-widest">
                            Sin turnero
                        </p>
                        <ul className="space-y-3">
                            {[
                                "2+ horas por semana en WhatsApp",
                                "Turnos dobles por errores manuales",
                                "Clientes que nunca confirman",
                                "Sin registro de ingresos ni historial",
                                "Todo depende de que estés disponible",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2.5 text-slate-600 text-sm"
                                >
                                    <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white border border-emerald-100 rounded-2xl p-6">
                        <p className="text-xs font-bold text-emerald-500 mb-5 uppercase tracking-widest">
                            Con turnero
                        </p>
                        <ul className="space-y-3">
                            {[
                                "Tus clientes reservan solos, 24/7",
                                "Sin errores ni superposiciones",
                                "Confirmación automática al instante",
                                "Panel con métricas y reservas",
                                "Tu agenda siempre actualizada",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-2.5 text-slate-600 text-sm"
                                >
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ── How it works ───────────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[2] = el; }} className="max-w-4xl mx-auto px-4 pb-24">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">
                    Empezá en 3 pasos
                </h2>
                <p className="text-slate-400 text-center mb-12">
                    Sin configuraciones complicadas.
                </p>
                <div className="grid sm:grid-cols-3 gap-6">
                    {[
                        {
                            step: "1",
                            title: "Creá tu negocio",
                            desc: "Completá tu perfil y configurá tus servicios en menos de 5 minutos.",
                        },
                        {
                            step: "2",
                            title: "Compartí tu link",
                            desc: "Enviá tu link único o QR por WhatsApp, Instagram o donde quieras.",
                        },
                        {
                            step: "3",
                            title: "Recibí reservas",
                            desc: "Tus clientes reservan solos y vos ves todo en tu panel.",
                        },
                    ].map((item) => (
                        <div
                            key={item.step}
                            className="bg-white border border-slate-200 rounded-2xl p-6 text-center"
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                                {item.step}
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ───────────────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[3] = el; }} className="max-w-4xl mx-auto px-4 pb-24">
                <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">
                    Todo lo que necesitás
                </h2>
                <p className="text-slate-400 text-center mb-12">
                    Sin complicaciones, sin extras innecesarios.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {[
                        {
                            Icon: Zap,
                            title: "Reserva en 30 segundos",
                            desc: "Tus clientes eligen servicio, día y hora en unos pocos toques.",
                        },
                        {
                            Icon: BarChart2,
                            title: "Panel en tiempo real",
                            desc: "Mirá tus reservas, clientes y servicios desde cualquier dispositivo.",
                        },
                        {
                            Icon: Link2,
                            title: "Link y QR únicos",
                            desc: "Compartí tu página personalizada donde quieras.",
                        },
                        {
                            Icon: Calendar,
                            title: "Múltiples servicios",
                            desc: "Creá servicios con distintos precios, duraciones y horarios.",
                        },
                    ].map((feat) => (
                        <div
                            key={feat.title}
                            className="bg-white border border-slate-200 rounded-2xl p-6 flex gap-4"
                        >
                            <feat.Icon className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">
                                    {feat.title}
                                </h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    {feat.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[4] = el; }} className="max-w-2xl mx-auto px-4 pb-32 text-center">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-10">
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">
                        ¿Listo para ordenar tu agenda?
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Sumá tu negocio a turnero y empezá a recibir reservas
                        online hoy.
                    </p>
                    <Link href="/auth/login">
                        <Button size="lg">Crear mi negocio gratis →</Button>
                    </Link>
                    <p className="text-xs text-slate-400 mt-4">
                        Sin tarjeta de crédito · Listo en 5 minutos
                    </p>
                </div>
            </section>

            {/* ── Business list ──────────────────────────────────────────── */}
            <section ref={(el) => { sectionRefs.current[5] = el; }} id="negocios" className="max-w-7xl mx-auto px-4 pb-24">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Negocios en turnero
                </h2>
                <p className="text-slate-400 mb-8">
                    Elegí un negocio para ver sus turnos disponibles
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((biz) => (
                        <Link
                            key={biz.id}
                            href={`/${biz.slug}`}
                            className="group"
                        >
                            <Card hoverable className="overflow-hidden h-full">
                                {biz.imageUrl ? (
                                    <div className="relative h-48 overflow-hidden rounded-t-2xl">
                                        <Image
                                            src={biz.imageUrl}
                                            alt={biz.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                        <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-slate-800/70 backdrop-blur-sm px-2 py-1 rounded-full">
                                            {biz.category}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-48 rounded-t-2xl bg-indigo-50 border-b border-indigo-100 flex flex-col items-center justify-center gap-2">
                                        <Store className="w-10 h-10 text-indigo-300" />
                                        <span className="text-xs font-medium text-indigo-500 bg-indigo-100 px-2 py-1 rounded-full">
                                            {biz.category}
                                        </span>
                                    </div>
                                )}
                                <div className="p-5">
                                    <h3 className="text-slate-800 font-semibold text-lg mb-1 group-hover:text-indigo-500 transition-colors">
                                        {biz.name}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                                        {biz.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400">
                                            por {biz.ownerName}
                                        </span>
                                        <span className="text-indigo-400 text-sm font-medium group-hover:underline">
                                            Ver turnos →
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="https://yzen.com.ar/" target="_blank">
                        <Image
                            src="/Yzen-Logo.png"
                            alt="Yzen"
                            width={120}
                            height={50}
                            className="object-contain"
                            unoptimized
                        />
                    </Link>
                    <p className="text-xs text-slate-400">
                        Hecho en Argentina · {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </div>
    );
}
