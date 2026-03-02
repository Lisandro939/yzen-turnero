import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db, rowToBusiness } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await db.execute({
    sql: 'SELECT * FROM businesses WHERE owner_email = ? LIMIT 1',
    args: [session.user.email],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ business: null });
  }

  return NextResponse.json({ business: rowToBusiness(result.rows[0] as Record<string, unknown>) });
}
