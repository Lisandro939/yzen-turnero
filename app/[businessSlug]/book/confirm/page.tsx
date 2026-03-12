import { db } from '@/lib/db';
import { Navbar } from '@/components/layout/Navbar';
import { ConfirmContent } from '@/components/ConfirmContent';

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
      <ConfirmContent
        title={title}
        subtitle={subtitle}
        businessName={businessName}
        service={service}
        date={date}
        time={startTime && endTime ? `${startTime} – ${endTime}` : '—'}
        name={name}
        email={email}
        phone={phone}
        price={price}
      />
    </div>
  );
}
