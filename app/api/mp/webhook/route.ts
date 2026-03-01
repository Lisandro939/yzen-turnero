import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
    try {
        const xSignature = request.headers.get('x-signature') ?? '';
        const xRequestId = request.headers.get('x-request-id') ?? '';

        const body = await request.json();
        const dataId = String(body?.data?.id ?? '');

        // Verify signature
        if (!verifyWebhookSignature(xSignature, xRequestId, dataId)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Only handle payment events
        if (body.type !== 'payment') {
            return NextResponse.json({ ok: true });
        }

        // Fetch payment from MP using platform-level token
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_PLATFORM_ACCESS_TOKEN!,
        });
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: dataId });

        const preferenceId = paymentData.preference_id;
        const mpStatus = paymentData.status;
        const paymentId = String(paymentData.id);

        if (!preferenceId) {
            return NextResponse.json({ ok: true });
        }

        // Map MP status to booking status
        let bookingStatus: string;
        if (mpStatus === 'approved') {
            bookingStatus = 'approved';
        } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
            bookingStatus = 'rejected';
        } else {
            bookingStatus = 'pending';
        }

        // Find booking by preference ID
        const bookingResult = await db.execute({
            sql: 'SELECT id, slot_id FROM bookings WHERE mp_preference_id = ? LIMIT 1',
            args: [preferenceId],
        });

        if (bookingResult.rows.length === 0) {
            return NextResponse.json({ ok: true });
        }

        const row = bookingResult.rows[0] as Record<string, unknown>;
        const bookingId = String(row.id);
        const slotId = String(row.slot_id);

        // Update booking
        await db.execute({
            sql: 'UPDATE bookings SET status = ?, mp_payment_id = ? WHERE id = ?',
            args: [bookingStatus, paymentId, bookingId],
        });

        // If rejected, re-open the slot
        if (bookingStatus === 'rejected') {
            await db.execute({
                sql: "UPDATE slots SET status = 'open' WHERE id = ?",
                args: [slotId],
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        // Always return 200 so MP doesn't retry for non-critical errors
        console.error('MP webhook error:', err);
        return NextResponse.json({ ok: true });
    }
}
