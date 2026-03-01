import { NextRequest, NextResponse } from 'next/server';
import { db, rowToSlot } from '@/lib/db';
import type { Slot } from '@/types';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const result = await db.execute({ sql: 'SELECT * FROM slots WHERE id = ?', args: [id] });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ slot: rowToSlot(result.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch slot' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const { status }: { status: Slot['status'] } = await request.json();

    await db.execute({ sql: 'UPDATE slots SET status = ? WHERE id = ?', args: [status, id] });

    const result = await db.execute({ sql: 'SELECT * FROM slots WHERE id = ?', args: [id] });
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ slot: rowToSlot(result.rows[0] as Record<string, unknown>) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 });
  }
}
