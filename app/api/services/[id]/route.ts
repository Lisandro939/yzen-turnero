import { NextRequest, NextResponse } from 'next/server';
import { db, rowToService } from '@/lib/db';
import { auth } from '@/auth';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  try {
    const result = await db.execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [id] });
    if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ service: rowToService(result.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    // Verify ownership
    const svcRes = await db.execute({
      sql: 'SELECT s.id FROM services s JOIN businesses b ON b.id = s.business_id WHERE s.id = ? AND b.owner_email = ?',
      args: [id, session.user.email ?? ''],
    });
    if (!svcRes.rows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const FIELD_MAP: Record<string, string> = {
      name: 'name',
      description: 'description',
      slotDuration: 'slot_duration',
      basePrice: 'base_price',
      workingHoursStart: 'working_hours_start',
      workingHoursEnd: 'working_hours_end',
    };
    const sets: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args: any[] = [];
    for (const [key, col] of Object.entries(FIELD_MAP)) {
      if (key in body) {
        sets.push(`${col} = ?`);
        args.push(body[key]);
      }
    }
    if ('workingDays' in body) {
      sets.push('working_days = ?');
      args.push(JSON.stringify(body.workingDays));
    }
    if ('scheduleConfig' in body) {
      sets.push('schedule_config = ?');
      args.push(body.scheduleConfig ? JSON.stringify(body.scheduleConfig) : null);
    }
    if (sets.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    args.push(id);
    await db.execute({ sql: `UPDATE services SET ${sets.join(', ')} WHERE id = ?`, args });
    const updated = await db.execute({ sql: 'SELECT * FROM services WHERE id = ?', args: [id] });
    return NextResponse.json({ service: rowToService(updated.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const svcRes = await db.execute({
      sql: 'SELECT s.id FROM services s JOIN businesses b ON b.id = s.business_id WHERE s.id = ? AND b.owner_email = ?',
      args: [id, session.user.email ?? ''],
    });
    if (!svcRes.rows[0]) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await db.execute({ sql: 'UPDATE services SET is_active = 0 WHERE id = ?', args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
