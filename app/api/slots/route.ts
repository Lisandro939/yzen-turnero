import { NextRequest, NextResponse } from 'next/server';
import { db, rowToSlot } from '@/lib/db';
import { slotId } from '@/lib/slot-generator';
import type { Slot } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const date = searchParams.get('date');

    let sql = 'SELECT * FROM slots WHERE 1=1';
    const args: string[] = [];

    if (businessId) {
      sql += ' AND business_id = ?';
      args.push(businessId);
    }
    if (date) {
      sql += ' AND date = ?';
      args.push(date);
    }

    sql += ' ORDER BY date, start_time';

    const result = await db.execute({ sql, args });
    const slots = result.rows.map((r) => rowToSlot(r as Record<string, unknown>));
    return NextResponse.json({ slots });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const slot: Omit<Slot, 'id'> = await request.json();
    const id = slotId(slot.businessId, slot.date, slot.startTime);

    await db.execute({
      sql: `INSERT INTO slots
              (id, business_id, date, start_time, end_time, price, status, service)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [id, slot.businessId, slot.date, slot.startTime, slot.endTime,
             slot.price, slot.status ?? 'open', slot.service ?? null],
    });

    const result = await db.execute({ sql: 'SELECT * FROM slots WHERE id = ?', args: [id] });
    return NextResponse.json({ slot: rowToSlot(result.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }
}
