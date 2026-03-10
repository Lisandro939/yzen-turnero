import { NextRequest, NextResponse } from 'next/server';
import { db, rowToBusiness } from '@/lib/db';
import type { Business } from '@/types';

type Context = { params: Promise<{ id: string }> };

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

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
  scheduleConfig: 'schedule_config',
  mpAccessToken: 'mp_access_token',
  mpRefreshToken: 'mp_refresh_token',
  mpUserId: 'mp_user_id',
  plan: 'plan',
  planExpiresAt: 'plan_expires_at',
  trialEndsAt: 'trial_ends_at',
  brandColor: 'brand_color',
  whatsapp: 'whatsapp',
  instagram: 'instagram',
  facebook: 'facebook',
  twitter: 'twitter',
};

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const result = await db.execute({
      sql: 'SELECT * FROM businesses WHERE id = ? OR slug = ? LIMIT 1',
      args: [id, id],
    });
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ business: rowToBusiness(result.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const body: Partial<Business> = await request.json();

    const sets: string[] = [];
    const args: (string | number | null)[] = [];

    for (const [jsKey, dbCol] of Object.entries(FIELD_MAP)) {
      if (jsKey in body) {
        sets.push(`${dbCol} = ?`);
        const val = body[jsKey as keyof typeof body];
        const needsJson = jsKey === 'workingDays' || jsKey === 'scheduleConfig';
        args.push(needsJson ? JSON.stringify(val) : (val ?? null) as string | number | null);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // If name changed, also update the slug
    if ('name' in body && body.name) {
      sets.push('slug = ?');
      args.push(nameToSlug(body.name));
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
