import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import type { Business } from '@/types';

export async function GET() {
  try {
    // Only show businesses that have MP connected AND are active (trial or paid plan)
    const result = await db.execute(`
      SELECT * FROM businesses
      WHERE
        mp_access_token IS NOT NULL AND mp_access_token != ''
        AND (trial_ends_at > datetime('now') OR plan_expires_at > datetime('now'))
      ORDER BY name
    `);
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
               slot_duration, base_price, trial_ends_at, plan)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now', '+7 days'),'pro')`,
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

    const created = await db.execute({
      sql: 'SELECT * FROM businesses WHERE id = ?',
      args: [business.id],
    });

    return NextResponse.json({ business: rowToBusiness(created.rows[0] as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}
