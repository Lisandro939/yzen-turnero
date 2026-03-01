import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateConnectURL } from '@/lib/mercadopago';

export async function GET() {
    const session = await auth();

    if (!session || session.user.role !== 'owner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const state = session.user.businessId!;
    const url = generateConnectURL(state);

    return NextResponse.json({ url });
}
