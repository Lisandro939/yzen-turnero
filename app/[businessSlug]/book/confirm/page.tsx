'use client';

import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const businessSlug = params.businessSlug as string;
  const { businesses } = useAuth();

  const business = businesses.find((b) => b.slug === businessSlug);

  const name = searchParams.get('name') ?? '';
  const email = searchParams.get('email') ?? '';
  const phone = searchParams.get('phone') ?? '';
  const service = searchParams.get('service') ?? '—';
  const date = searchParams.get('date') ?? '—';
  const startTime = searchParams.get('startTime') ?? '';
  const endTime = searchParams.get('endTime') ?? '';
  const price = Number(searchParams.get('price') ?? 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 max-w-lg mx-auto px-4 pb-24">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">¡Reserva confirmada!</h1>
          <p className="text-slate-400 mt-2">Te esperamos. Guardá estos datos.</p>
        </div>

        <Card className="p-6 flex flex-col gap-4">
          <Row label="Negocio" value={business?.name ?? businessSlug} />
          <Row label="Servicio" value={service} />
          <Row label="Fecha" value={date} />
          <Row label="Horario" value={startTime && endTime ? `${startTime} – ${endTime}` : '—'} />
          <Row label="Cliente" value={name} />
          <Row label="Email" value={email} />
          <Row label="Teléfono" value={phone} />
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Total pagado</span>
            <span className="text-emerald-600 font-bold text-lg">${price.toLocaleString('es-AR')}</span>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/"><Button variant="secondary" size="lg">Volver al inicio</Button></Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-slate-800 font-medium text-sm">{value}</span>
    </div>
  );
}
