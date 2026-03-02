import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, rowToBusiness } from '@/lib/db';
import { computeSlots, parseSlotId, slotId } from '@/lib/schedule-utils';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { businessId, date, startTime } = parseSlotId(id);

    const bizResult = await db.execute({
      sql: 'SELECT * FROM businesses WHERE id = ?',
      args: [businessId],
    });
    if (bizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const business = rowToBusiness(bizResult.rows[0] as Record<string, unknown>);

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

    const slots = computeSlots(business, date, bookedIds, blockedIds);
    const slot = slots.find((s) => s.startTime === startTime);

    if (!slot) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ slot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slot' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { status, endTime }: { status: 'blocked'; endTime: string } = await request.json();

    if (status !== 'blocked') {
      return NextResponse.json({ error: 'Only blocked status allowed' }, { status: 400 });
    }

    const { businessId, date, startTime } = parseSlotId(id);

    // Verify the session user owns this business
    const bizResult = await db.execute({
      sql: 'SELECT owner_email FROM businesses WHERE id = ?',
      args: [businessId],
    });
    if (bizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (String(bizResult.rows[0].owner_email) !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const blockId = slotId(businessId, date, startTime);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT OR IGNORE INTO slot_blocks
              (id, business_id, date, start_time, end_time, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [blockId, businessId, date, startTime, endTime, createdAt],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to block slot' }, { status: 500 });
  }
}
