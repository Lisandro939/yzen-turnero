'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Business } from '@/types';
import type { BusinessFormValues } from '@/components/business/BusinessForm';
import { BusinessForm } from '@/components/business/BusinessForm';
import { Card } from '@/components/ui/Card';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function OnboardingPage() {
  const { user, upgradeToOwner } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === null) router.replace('/auth/login');
    else if (user.role === 'owner') router.replace('/dashboard');
  }, [user, router]);

  if (!user || user.role === 'owner') return null;

  async function handleSubmit(values: BusinessFormValues) {
    setLoading(true);
    setError(null);
    const business: Business = {
      id: `biz-${Date.now()}`,
      slug: slugify(values.name),
      ownerName: user!.name,
      ownerEmail: user!.email,
      ...values,
    };
    try {
      await upgradeToOwner(business);
      router.push('/dashboard');
    } catch {
      setError('Ya existe un negocio con ese nombre. Probá con un nombre diferente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-slate-800 tracking-tight">
            turnero<span className="text-indigo-400">.</span>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-6 h-6 rounded-full border border-slate-200 text-xs flex items-center justify-center">1</span>
              Cuenta creada
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-indigo-500 font-medium">
              <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-xs flex items-center justify-center">2</span>
              Configurá tu negocio
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-800">
            ¡Hola, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Completá los datos de tu negocio para empezar a recibir turnos.
          </p>
        </div>
        <Card className="p-6 sm:p-8">
          {error && (
            <p className="text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5">
              {error}
            </p>
          )}
          <BusinessForm mode="create" onSubmit={handleSubmit} loading={loading} submitLabel="Crear mi negocio" />
        </Card>
      </div>
    </div>
  );
}
