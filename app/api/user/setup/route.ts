import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.execute({
        sql: 'UPDATE users SET role_chosen = 1 WHERE email = ?',
        args: [session.user.email],
    });

    return NextResponse.json({ ok: true });
}
