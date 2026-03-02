import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import { computeSlots } from '@/lib/schedule-utils';

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const bizResult = await db.execute({
      sql: 'SELECT * FROM businesses WHERE id = ?',
      args: [businessId],
    });
    if (bizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const business = rowToBusiness(bizResult.rows[0] as Record<string, unknown>);

    const today = new Date().toISOString().slice(0, 10);
    const defaultTo = new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10);

    const singleDate = searchParams.get('date');
    const dateFrom = singleDate ?? searchParams.get('dateFrom') ?? today;
    const dateTo = singleDate ?? searchParams.get('dateTo') ?? defaultTo;

    const dates = dateRange(dateFrom, dateTo);

    const slots = (
      await Promise.all(
        dates.map(async (date) => {
          const [bookingsRes, blocksRes] = await Promise.all([
            db.execute({
              sql: `SELECT slot_id FROM bookings
                    WHERE business_id = ? AND date = ?
                      AND status NOT IN ('cancelled', 'rejected')
                      AND slot_id IS NOT NULL`,
              args: [businessId, date],
            }),
            db.execute({
              sql: 'SELECT id FROM slot_blocks WHERE business_id = ? AND date = ?',
              args: [businessId, date],
            }),
          ]);

          const bookedIds = new Set<string>(bookingsRes.rows.map((r) => String(r.slot_id)));
          const blockedIds = new Set<string>(blocksRes.rows.map((r) => String(r.id)));

          return computeSlots(business, date, bookedIds, blockedIds);
        }),
      )
    ).flat();

    return NextResponse.json({ slots });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
