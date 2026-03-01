import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import type { Business } from '@/types';

type Context = { params: Promise<{ id: string }> };

const FIELD_MAP: Record<keyof Omit<Business, 'id' | 'slug'>, string> = {
  name: 'name',
  description: 'description',
  ownerName: 'owner_name',
  ownerEmail: 'owner_email',
  category: 'category',
  imageUrl: 'image_url',
  workingDays: 'working_days',
  workingHoursStart: 'working_hours_start',
  workingHoursEnd: 'working_hours_end',
  slotDuration: 'slot_duration',
  basePrice: 'base_price',
};

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body: Partial<Business> = await request.json();

    const sets: string[] = [];
    const args: unknown[] = [];

    for (const [jsKey, dbCol] of Object.entries(FIELD_MAP)) {
      if (jsKey in body) {
        sets.push(`${dbCol} = ?`);
        const val = body[jsKey as keyof typeof body];
        args.push(jsKey === 'workingDays' ? JSON.stringify(val) : val);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(id);
    await db.execute({ sql: `UPDATE businesses SET ${sets.join(', ')} WHERE id = ?`, args });

    const result = await db.execute({ sql: 'SELECT * FROM businesses WHERE id = ?', args: [id] });
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ business: rowToBusiness(result.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}
