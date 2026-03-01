import { MercadoPagoConfig, Preference } from 'mercadopago';
import crypto from 'crypto';

export function generateConnectURL(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.MP_CLIENT_ID!,
        redirect_uri: process.env.MP_REDIRECT_URI!,
        state,
    });
    return `https://auth.mercadopago.com/authorization?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
}> {
    const res = await fetch('https://api.mercadopago.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.MP_CLIENT_ID!,
            client_secret: process.env.MP_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.MP_REDIRECT_URI!,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`MP token exchange failed: ${err}`);
    }

    const data = await res.json();
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        userId: String(data.user_id),
    };
}

export function getMPClient(accessToken: string): MercadoPagoConfig {
    return new MercadoPagoConfig({ accessToken });
}

export async function createPaymentPreference(
    accessToken: string,
    items: { id: string; title: string; quantity: number; unit_price: number }[],
    backUrls: { success: string; failure: string; pending: string },
    notificationUrl: string,
): Promise<{ id: string; initPoint: string; sandboxInitPoint: string }> {
    const client = getMPClient(accessToken);
    const preference = new Preference(client);
    const result = await preference.create({
        body: {
            items,
            back_urls: backUrls,
            auto_return: 'approved',
            notification_url: notificationUrl,
        },
    });
    return {
        id: result.id!,
        initPoint: result.init_point!,
        sandboxInitPoint: result.sandbox_init_point!,
    };
}

export function verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return false;

    // MP signature format: ts=<timestamp>,v1=<hash>
    const parts = Object.fromEntries(
        xSignature.split(',').map((p) => p.split('=')),
    );
    const ts = parts['ts'];
    const v1 = parts['v1'];
    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}
