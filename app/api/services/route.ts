import { NextRequest, NextResponse } from 'next/server';
import { db, rowToService } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM services WHERE business_id = ? AND is_active = 1 ORDER BY created_at ASC',
      args: [businessId],
    });
    return NextResponse.json({ services: result.rows.map((r) => rowToService(r as Record<string, unknown>)) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const {
      businessId,
      name,
      description = '',
      slotDuration = 30,
      basePrice = 0,
      workingDays = [1, 2, 3, 4, 5],
      workingHoursStart = '09:00',
      workingHoursEnd = '18:00',
    } = body;
    if (!businessId || !name) return NextResponse.json({ error: 'businessId and name required' }, { status: 400 });
    // Verify ownership
    const bizRes = await db.execute({ sql: 'SELECT owner_email FROM businesses WHERE id = ?', args: [businessId] });
    if (!bizRes.rows[0] || String((bizRes.rows[0] as Record<string, unknown>).owner_email) !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const id = `svc-${businessId}-${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO services (id, business_id, name, description, slot_duration, base_price, working_days, working_hours_start, working_hours_end)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, businessId, name, description, slotDuration, basePrice, JSON.stringify(workingDays), workingHoursStart, workingHoursEnd],
    });
    const created = await db.execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [id] });
    return NextResponse.json({ service: rowToService(created.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
