"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchBusinesses } from "@/lib/api-client";
import type { Business } from "@/types";

export default function HomePage() {
    const [businesses, setBusinesses] = useState<Business[]>([]);

    useEffect(() => {
        fetchBusinesses().then(setBusinesses).catch(console.error);
    }, []);

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Hero */}
            <section className="pt-40 pb-32 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-6xl sm:text-7xl font-light text-slate-900 tracking-tight leading-[1.05] mb-3">
                        Tu turno, a un{" "}
                        <span className="text-indigo-400">click</span> de
                        distancia.
                    </h1>
                    <p className="text-5xl sm:text-6xl font-light tracking-tight text-slate-700 leading-[1.05] mb-12">
                        Rápido, fácil, sin llamadas.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <a href="#negocios">
                            <Button size="lg">Ver negocios</Button>
                        </a>
                        <Link href="/auth/register">
                            <Button size="lg" variant="secondary">
                                Sumar mi negocio
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Business list */}
            <section id="negocios" className="max-w-7xl mx-auto px-4 pb-24">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Negocios disponibles
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
                                        <span className="text-4xl">🏪</span>
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
        </div>
    );
}
