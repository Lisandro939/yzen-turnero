import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBooking } from '@/lib/db';
import type { Booking } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    let sql = `SELECT b.*, s.date, s.start_time, s.end_time, s.service
               FROM bookings b
               LEFT JOIN slots s ON s.id = b.slot_id
               WHERE 1=1`;
    const args: string[] = [];

    if (businessId) {
      sql += ' AND b.business_id = ?';
      args.push(businessId);
    }

    sql += ' ORDER BY b.created_at DESC';

    const result = await db.execute({ sql, args });
    const bookings = result.rows.map((r) => rowToBooking(r as Record<string, unknown>));
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Omit<Booking, 'id' | 'createdAt'> = await request.json();
    const id = `booking-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO bookings
              (id, slot_id, business_id, customer_name, customer_email,
               customer_phone, status, created_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [id, body.slotId, body.businessId, body.customerName,
             body.customerEmail, body.customerPhone ?? '', body.status ?? 'confirmed', createdAt],
    });

    // Mark the slot as booked
    await db.execute({ sql: "UPDATE slots SET status = 'booked' WHERE id = ?", args: [body.slotId] });

    const result = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    return NextResponse.json({ booking: rowToBooking(result.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
