import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCodeForToken } from '@/lib/mercadopago';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const businessId = searchParams.get('state');

    if (!code || !businessId) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?mp=error', request.url),
        );
    }

    try {
        const { accessToken, refreshToken, userId } = await exchangeCodeForToken(code);

        await db.execute({
            sql: `UPDATE businesses
                  SET mp_access_token = ?, mp_refresh_token = ?, mp_user_id = ?
                  WHERE id = ?`,
            args: [accessToken, refreshToken, userId, businessId],
        });

        return NextResponse.redirect(
            new URL('/dashboard/settings?mp=connected', request.url),
        );
    } catch {
        return NextResponse.redirect(
            new URL('/dashboard/settings?mp=error', request.url),
        );
    }
}
