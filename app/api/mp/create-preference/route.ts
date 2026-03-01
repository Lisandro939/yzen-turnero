import { NextRequest, NextResponse } from 'next/server';
import { db, rowToSlot, rowToBusiness } from '@/lib/db';
import { createPaymentPreference } from '@/lib/mercadopago';

interface Body {
    slotId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: Body = await request.json();
        const { slotId, customerName, customerEmail, customerPhone } = body;

        // Fetch slot
        const slotResult = await db.execute({
            sql: 'SELECT * FROM slots WHERE id = ?',
            args: [slotId],
        });
        if (slotResult.rows.length === 0) {
            return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
        }
        const slot = rowToSlot(slotResult.rows[0] as Record<string, unknown>);

        // Fetch business
        const bizResult = await db.execute({
            sql: 'SELECT * FROM businesses WHERE id = ?',
            args: [slot.businessId],
        });
        if (bizResult.rows.length === 0) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }
        const business = rowToBusiness(bizResult.rows[0] as Record<string, unknown>);

        if (!business.mpAccessToken) {
            return NextResponse.json({ error: 'Business has no MP account connected' }, { status: 400 });
        }

        // Insert booking with status = 'pending'
        const bookingId = `booking-${Date.now()}`;
        const createdAt = new Date().toISOString();
        await db.execute({
            sql: `INSERT INTO bookings
                    (id, slot_id, business_id, customer_name, customer_email,
                     customer_phone, status, created_at)
                  VALUES (?,?,?,?,?,?,?,?)`,
            args: [bookingId, slotId, slot.businessId, customerName,
                   customerEmail, customerPhone, 'pending', createdAt],
        });

        // Mark slot as booked
        await db.execute({
            sql: "UPDATE slots SET status = 'booked' WHERE id = ?",
            args: [slotId],
        });

        // Create MP payment preference
        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
        const { id: preferenceId, initPoint, sandboxInitPoint } =
            await createPaymentPreference(
                business.mpAccessToken,
                [
                    {
                        id: slot.id,
                        title: slot.service ?? 'Turno',
                        quantity: 1,
                        unit_price: slot.price,
                    },
                ],
                {
                    success: `${appUrl}/${business.slug}/book/confirm?bookingId=${bookingId}&mp=approved`,
                    failure: `${appUrl}/${business.slug}/book?slotId=${slotId}&mp=failed`,
                    pending: `${appUrl}/${business.slug}/book/confirm?bookingId=${bookingId}&mp=pending`,
                },
                `${appUrl}/api/mp/webhook`,
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
