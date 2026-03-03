import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import { createPaymentPreference } from '@/lib/mercadopago';

interface Body {
    slotId: string;
    businessId: string;
    serviceId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    startTime: string;
    endTime: string;
    price: number;
    service?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: Body = await request.json();
        const { slotId, businessId, serviceId, customerName, customerEmail, customerPhone,
                date, startTime, endTime, price, service } = body;

        // Availability check
        const [bookedRes, blockedRes] = await Promise.all([
            db.execute({
                sql: `SELECT 1 FROM bookings
                      WHERE slot_id = ? AND status NOT IN ('cancelled', 'rejected') LIMIT 1`,
                args: [slotId],
            }),
            db.execute({
                sql: 'SELECT 1 FROM slot_blocks WHERE id = ? LIMIT 1',
                args: [slotId],
            }),
        ]);
        if (bookedRes.rows.length > 0 || blockedRes.rows.length > 0) {
            return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
        }

        // Fetch business for MP token + slug
        const bizResult = await db.execute({
            sql: 'SELECT * FROM businesses WHERE id = ?',
            args: [businessId],
        });
        if (bizResult.rows.length === 0) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }
        const business = rowToBusiness(bizResult.rows[0] as Record<string, unknown>);

        if (!business.mpAccessToken) {
            return NextResponse.json({ error: 'Business has no MP account connected' }, { status: 400 });
        }

        // Insert booking with status = 'pending' + slot data
        const bookingId = `booking-${Date.now()}`;
        const createdAt = new Date().toISOString();
        await db.execute({
            sql: `INSERT INTO bookings
                    (id, slot_id, business_id, service_id, customer_name, customer_email,
                     customer_phone, status, created_at, date, start_time, end_time, price, service)
                  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            args: [bookingId, slotId, businessId, serviceId ?? null, customerName,
                   customerEmail, customerPhone, 'pending', createdAt,
                   date, startTime, endTime, price, service ?? null],
        });

        // Create MP payment preference
        const baseUrl = request.nextUrl.origin;
        const { id: preferenceId, initPoint, sandboxInitPoint } =
            await createPaymentPreference(
                business.mpAccessToken,
                [
                    {
                        id: slotId,
                        title: service ?? 'Turno',
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'ARS',
                    },
                ],
                {
                    success: `${baseUrl}/${business.slug}/book/confirm?bookingId=${bookingId}&mp=approved`,
                    failure: `${baseUrl}/${business.slug}/book?slotId=${slotId}&mp=failed`,
                    pending: `${baseUrl}/${business.slug}/book/confirm?bookingId=${bookingId}&mp=pending`,
                },
                `${baseUrl}/api/mp/webhook`,
            );

        // Save preference ID on booking
        await db.execute({
            sql: 'UPDATE bookings SET mp_preference_id = ? WHERE id = ?',
            args: [preferenceId, bookingId],
        });

        return NextResponse.json({ bookingId, initPoint, sandboxInitPoint }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to create preference' }, { status: 500 });
    }
}
