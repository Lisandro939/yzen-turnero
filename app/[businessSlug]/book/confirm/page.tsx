import Link from 'next/link';
import { db } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: SearchParams;
}) {
  const { businessSlug } = await params;
  const sp = await searchParams;

  const bookingId = typeof sp.bookingId === 'string' ? sp.bookingId : undefined;
  const mpStatus = typeof sp.mp === 'string' ? sp.mp : undefined;

  // MP flow: fetch data from DB
  let name = '';
  let email = '';
  let phone = '';
  let service = '—';
  let date = '—';
  let startTime = '';
  let endTime = '';
  let price = 0;
  let businessName = businessSlug;
  let isPending = false;

  if (bookingId) {
    const result = await db.execute({
      sql: `SELECT b.customer_name, b.customer_email, b.customer_phone, b.status,
                   s.date, s.start_time, s.end_time, s.price, s.service,
                   biz.name AS business_name
            FROM bookings b
            JOIN slots s ON s.id = b.slot_id
            JOIN businesses biz ON biz.id = b.business_id
            WHERE b.id = ? LIMIT 1`,
      args: [bookingId],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0] as Record<string, unknown>;
      name = String(row.customer_name ?? '');
      email = String(row.customer_email ?? '');
      phone = String(row.customer_phone ?? '');
      service = row.service != null ? String(row.service) : '—';
      date = String(row.date ?? '—');
      startTime = String(row.start_time ?? '');
      endTime = String(row.end_time ?? '');
      price = Number(row.price ?? 0);
      businessName = String(row.business_name ?? businessSlug);
      isPending = String(row.status) === 'pending' || mpStatus === 'pending';
    }
  } else {
    // Mock flow: read from URL search params
    name = typeof sp.name === 'string' ? sp.name : '';
    email = typeof sp.email === 'string' ? sp.email : '';
    phone = typeof sp.phone === 'string' ? sp.phone : '';
    service = typeof sp.service === 'string' ? sp.service : '—';
    date = typeof sp.date === 'string' ? sp.date : '—';
    startTime = typeof sp.startTime === 'string' ? sp.startTime : '';
    endTime = typeof sp.endTime === 'string' ? sp.endTime : '';
    price = Number(typeof sp.price === 'string' ? sp.price : 0);
  }

  const title = isPending ? '¡Reserva en proceso!' : '¡Reserva confirmada!';
  const subtitle = isPending
    ? 'El pago está siendo procesado. Te notificaremos cuando se confirme.'
    : 'Te esperamos. Guardá estos datos.';

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
          <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          <p className="text-slate-400 mt-2">{subtitle}</p>
        </div>

        <Card className="p-6 flex flex-col gap-4">
          <Row label="Negocio" value={businessName} />
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
