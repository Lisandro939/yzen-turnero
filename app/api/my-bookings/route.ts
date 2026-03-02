import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import type { MyBooking } from '@/types';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.execute({
        sql: `
            SELECT
                b.id,
                b.slot_id,
                b.business_id,
                b.status,
                b.created_at,
                b.date,
                b.start_time,
                b.end_time,
                b.price,
                b.service,
                biz.name  AS business_name,
                biz.slug  AS business_slug
            FROM bookings b
            JOIN businesses biz ON b.business_id = biz.id
            WHERE b.customer_email = ?
            ORDER BY b.date DESC, b.start_time DESC
        `,
        args: [session.user.email],
    });

    const bookings: MyBooking[] = result.rows.map((row) => ({
        id:           String(row.id),
        slotId:       row.slot_id != null ? String(row.slot_id) : '',
        businessId:   String(row.business_id),
        businessName: String(row.business_name),
        businessSlug: String(row.business_slug),
        service:      row.service != null ? String(row.service) : undefined,
        date:         String(row.date),
        startTime:    String(row.start_time),
        endTime:      String(row.end_time),
        price:        Number(row.price),
        status:       String(row.status) as MyBooking['status'],
        createdAt:    String(row.created_at),
    }));

    return NextResponse.json({ bookings });
}
