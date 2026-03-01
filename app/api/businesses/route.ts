import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import { generateSlotsForBusiness, slotId } from '@/lib/slot-generator';
import type { Business } from '@/types';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM businesses ORDER BY name');
    const businesses = result.rows.map((r) => rowToBusiness(r as Record<string, unknown>));
    return NextResponse.json({ businesses });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const business: Business = await request.json();

    const bizResult = await db.execute({
      sql: `INSERT OR IGNORE INTO businesses
              (id, slug, name, description, owner_name, owner_email, category,
               image_url, working_days, working_hours_start, working_hours_end,
               slot_duration, base_price)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        business.id, business.slug, business.name, business.description,
        business.ownerName, business.ownerEmail, business.category,
        business.imageUrl ?? '',
        JSON.stringify(business.workingDays),
        business.workingHoursStart, business.workingHoursEnd,
        business.slotDuration, business.basePrice,
      ],
    });

    if (bizResult.rowsAffected === 0) {
      return NextResponse.json({ error: 'Ya existe un negocio con ese nombre' }, { status: 409 });
    }

    // Generate slots for the next 7 days
    const slots = generateSlotsForBusiness(business);
    for (const slot of slots) {
      const id = slotId(slot.businessId, slot.date, slot.startTime);
      await db.execute({
        sql: `INSERT OR IGNORE INTO slots
                (id, business_id, date, start_time, end_time, price, status, service)
              VALUES (?,?,?,?,?,?,?,?)`,
        args: [id, slot.businessId, slot.date, slot.startTime, slot.endTime,
               slot.price, slot.status, slot.service ?? null],
      });
    }

    return NextResponse.json({ business }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}
