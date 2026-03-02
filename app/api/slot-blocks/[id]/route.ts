import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { parseSlotId } from '@/lib/schedule-utils';

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { businessId } = parseSlotId(id);

    // Verify the session user owns this business
    const bizResult = await db.execute({
      sql: 'SELECT owner_email FROM businesses WHERE id = ?',
      args: [businessId],
    });
    if (bizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    if (String(bizResult.rows[0].owner_email) !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.execute({
      sql: 'DELETE FROM slot_blocks WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to unblock slot' }, { status: 500 });
  }
}
