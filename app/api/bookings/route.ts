import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBooking } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const args: string[] = [];

    if (businessId) {
      sql += ' AND business_id = ?';
      args.push(businessId);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await db.execute({ sql, args });
    const bookings = result.rows.map((r) => rowToBooking(r as Record<string, unknown>));
    return NextResponse.json({ bookings });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

interface BookingBody {
  slotId: string;
  serviceId?: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status?: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  service?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingBody = await request.json();

    // Availability check: is the slot already booked or blocked?
    const [bookedRes, blockedRes] = await Promise.all([
      db.execute({
        sql: `SELECT 1 FROM bookings WHERE slot_id = ? AND status NOT IN ('cancelled','rejected') LIMIT 1`,
        args: [body.slotId],
      }),
      db.execute({
        sql: 'SELECT 1 FROM slot_blocks WHERE id = ? LIMIT 1',
        args: [body.slotId],
      }),
    ]);

    if (bookedRes.rows.length > 0 || blockedRes.rows.length > 0) {
      return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
    }

    const id = `booking-${Date.now()}`;
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO bookings
              (id, slot_id, service_id, business_id, customer_name, customer_email,
               customer_phone, status, created_at, date, start_time, end_time, price, service)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id,
        body.slotId,
        body.serviceId ?? null,
        body.businessId,
        body.customerName,
        body.customerEmail,
        body.customerPhone ?? '',
        body.status ?? 'confirmed',
        createdAt,
        body.date,
        body.startTime,
        body.endTime,
        body.price,
        body.service ?? null,
      ],
    });

    const result = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
    return NextResponse.json({ booking: rowToBooking(result.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
