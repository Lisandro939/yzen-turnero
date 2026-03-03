import { NextRequest, NextResponse } from 'next/server';
import { db, rowToService } from '@/lib/db';
import { computeSlots } from '@/lib/schedule-utils';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let cur = from;
  while (cur <= to) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }
  return dates;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const serviceId = searchParams.get('serviceId');
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const dateFrom = searchParams.get('dateFrom') ?? today;
  const dateTo = searchParams.get('dateTo') ?? addDays(today, 13);
  const singleDate = searchParams.get('date');

  try {
    const svcRes = await db.execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [serviceId] });
    if (!svcRes.rows[0]) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    const service = rowToService(svcRes.rows[0] as Record<string, unknown>);

    const dates = singleDate ? [singleDate] : dateRange(dateFrom, dateTo);
    const allSlots = [];

    for (const date of dates) {
      const [bookingsRes, blocksRes] = await Promise.all([
        db.execute({
          sql: `SELECT slot_id FROM bookings WHERE service_id = ? AND date = ? AND status NOT IN ('cancelled','rejected')`,
          args: [serviceId, date],
        }),
        db.execute({
          sql: 'SELECT id FROM slot_blocks WHERE service_id = ? AND date = ?',
          args: [serviceId, date],
        }),
      ]);
      const bookedIds = new Set<string>(bookingsRes.rows.map((r) => String((r as Record<string, unknown>).slot_id)));
      const blockedIds = new Set<string>(blocksRes.rows.map((r) => String((r as Record<string, unknown>).id)));
      allSlots.push(...computeSlots(service, service.businessId, date, bookedIds, blockedIds));
    }

    return NextResponse.json({ slots: allSlots });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
