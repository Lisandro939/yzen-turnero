import { NextRequest, NextResponse } from 'next/server';
import { db, rowToService } from '@/lib/db';
import { parseSlotId, computeSlots, slotId as makeSlotId } from '@/lib/schedule-utils';
import { auth } from '@/auth';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  try {
    const { serviceId, date, startTime } = parseSlotId(decodedId);
    const svcRes = await db.execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [serviceId] });
    if (!svcRes.rows[0]) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    const service = rowToService(svcRes.rows[0] as Record<string, unknown>);

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
    const slots = computeSlots(service, service.businessId, date, bookedIds, blockedIds);
    const slot = slots.find((s) => s.startTime === startTime);
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    return NextResponse.json({ slot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slot' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { serviceId, date, startTime } = parseSlotId(decodedId);
    const body = await request.json();
    const { endTime } = body;

    // Verify owner
    const svcRes = await db.execute({
      sql: 'SELECT s.business_id FROM services s JOIN businesses b ON b.id = s.business_id WHERE s.id = ? AND b.owner_email = ?',
      args: [serviceId, session.user.email ?? ''],
    });
    if (!svcRes.rows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const businessId = String((svcRes.rows[0] as Record<string, unknown>).business_id);

    const blockId = makeSlotId(serviceId, date, startTime);
    await db.execute({
      sql: 'INSERT OR IGNORE INTO slot_blocks (id, business_id, service_id, date, start_time, end_time) VALUES (?,?,?,?,?,?)',
      args: [blockId, businessId, serviceId, date, startTime, endTime],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to block slot' }, { status: 500 });
  }
}
