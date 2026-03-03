import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/mercadopago";

type SafePaymentResponse = PaymentResponse & {
    preference_id?: string;
    external_reference?: string;
};

export async function POST(request: NextRequest) {
    try {
        const xSignature = request.headers.get("x-signature") ?? "";
        const xRequestId = request.headers.get("x-request-id") ?? "";

        const body = await request.json();
        const dataId = String(body?.data?.id ?? "");

        if (!dataId) {
            console.log("MP webhook: missing data.id");
            return NextResponse.json({ ok: true });
        }

        // 🔐 Verify signature (never return 401 to MP)
        const isValidSignature = verifyWebhookSignature(
            xSignature,
            xRequestId,
            dataId,
        );

        if (!isValidSignature) {
            console.log("MP webhook: invalid signature");
            return NextResponse.json({ ok: true });
        }

        if (body.type !== "payment") {
            return NextResponse.json({ ok: true });
        }

        // 💳 Fetch payment from Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_PLATFORM_ACCESS_TOKEN!,
        });

        const paymentClient = new Payment(client);

        const paymentData = (await paymentClient.get({
            id: dataId,
        })) as SafePaymentResponse;

        const preferenceId = paymentData.preference_id ?? null;
        const mpStatus = paymentData.status ?? null;
        const paymentId = paymentData.id?.toString() ?? null;
        const externalRef = paymentData.external_reference ?? "";

        if (!preferenceId || !paymentId || !mpStatus) {
            console.log("MP webhook: missing critical payment data");
            return NextResponse.json({ ok: true });
        }

        // ================================
        // 🟢 HANDLE PLAN SUBSCRIPTION
        // ================================
        if (externalRef.startsWith("plan:") && mpStatus === "approved") {
            const parts = externalRef.split(":");

            if (parts.length === 3) {
                const [, businessId, planType] = parts;

                const bizRes = await db.execute({
                    sql: "SELECT plan_expires_at FROM businesses WHERE id = ?",
                    args: [businessId],
                });

                const currentExpiry = bizRes.rows[0]?.plan_expires_at;
                const now = new Date();

                const base =
                    currentExpiry && new Date(String(currentExpiry)) > now
                        ? new Date(String(currentExpiry))
                        : new Date(now);

                base.setDate(base.getDate() + 30);

                await db.execute({
                    sql: `
            UPDATE businesses 
            SET plan = ?, 
                plan_expires_at = ?, 
                trial_ends_at = datetime('now') 
            WHERE id = ?
          `,
                    args: [planType, base.toISOString(), businessId],
                });

                console.log("Plan activated for business:", businessId);
            }

            return NextResponse.json({ ok: true });
        }

        // ================================
        // 📅 HANDLE BOOKING PAYMENT
        // ================================

        let bookingStatus: "approved" | "rejected" | "pending";

        if (mpStatus === "approved") {
            bookingStatus = "approved";
        } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
            bookingStatus = "rejected";
        } else {
            bookingStatus = "pending";
        }

        const bookingResult = await db.execute({
            sql: `
        SELECT id, slot_id, mp_payment_id 
        FROM bookings 
        WHERE mp_preference_id = ? 
        LIMIT 1
      `,
            args: [preferenceId],
        });

        if (bookingResult.rows.length === 0) {
            return NextResponse.json({ ok: true });
        }

        const row = bookingResult.rows[0] as unknown as {
            id: string;
            slot_id: string;
            mp_payment_id?: string | null;
        };

        const bookingId = row.id;
        const slotId = row.slot_id;
        const existingPaymentId = row.mp_payment_id ?? "";

        // 🔁 Idempotency protection
        if (existingPaymentId === paymentId) {
            return NextResponse.json({ ok: true });
        }

        await db.execute({
            sql: `
        UPDATE bookings 
        SET status = ?, 
            mp_payment_id = ? 
        WHERE id = ?
      `,
            args: [bookingStatus, paymentId, bookingId],
        });

        if (bookingStatus === "rejected") {
            await db.execute({
                sql: `UPDATE slots SET status = 'open' WHERE id = ?`,
                args: [slotId],
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        // ⚠️ Always return 200 so MP doesn't retry endlessly
        console.error("MP webhook error:", error);
        return NextResponse.json({ ok: true });
    }
}
