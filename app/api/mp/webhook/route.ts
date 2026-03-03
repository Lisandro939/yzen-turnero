import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, MerchantOrder, Payment } from "mercadopago";
import type { MerchantOrderResponse } from "mercadopago/dist/clients/merchantOrder/commonTypes";
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/mercadopago";

type ExtendedPaymentResponse = PaymentResponse & {
    preference_id?: string;
    external_reference?: string;
    point_of_interaction?: {
        transaction_data?: { preference_id?: string };
    };
};

const platformClient = new MercadoPagoConfig({
    accessToken: process.env.MP_PLATFORM_ACCESS_TOKEN!,
});

async function activatePlan(businessId: string, planType: string) {
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
        sql: `UPDATE businesses SET plan = ?, plan_expires_at = ?, trial_ends_at = datetime('now') WHERE id = ?`,
        args: [planType, base.toISOString(), businessId],
    });

    console.log("MP webhook: plan activated →", businessId, planType, "expires:", base.toISOString());
}

async function handleMerchantOrder(order: MerchantOrderResponse) {
    const externalRef = order.external_reference ?? "";
    const paidAmount = order.paid_amount ?? 0;
    const totalAmount = order.total_amount ?? 0;
    const isFullyPaid = totalAmount > 0 && paidAmount >= totalAmount;

    console.log("MP webhook: merchant_order", order.id, "| externalRef:", externalRef, "| paid:", paidAmount, "/", totalAmount);

    if (!isFullyPaid) return;

    // ================================
    // 🟢 PLAN SUBSCRIPTION
    // ================================
    if (externalRef.startsWith("plan:")) {
        const parts = externalRef.split(":");
        if (parts.length === 3) {
            const [, businessId, planType] = parts;
            await activatePlan(businessId, planType);
        }
        return;
    }

    // ================================
    // 📅 BOOKING PAYMENT
    // ================================
    const preferenceId = order.preference_id ?? null;
    if (!preferenceId) return;

    // Get the approved payment ID from the order for idempotency
    const approvedPayment = order.payments?.find((p) => p.status === "approved");
    const paymentId = approvedPayment?.id?.toString() ?? null;
    if (!paymentId) return;

    const bookingResult = await db.execute({
        sql: `SELECT id, slot_id, mp_payment_id FROM bookings WHERE mp_preference_id = ? LIMIT 1`,
        args: [preferenceId],
    });

    if (bookingResult.rows.length === 0) return;

    const row = bookingResult.rows[0] as unknown as {
        id: string;
        slot_id: string;
        mp_payment_id?: string | null;
    };

    if (row.mp_payment_id === paymentId) return; // already processed

    await db.execute({
        sql: `UPDATE bookings SET status = 'approved', mp_payment_id = ? WHERE id = ?`,
        args: [paymentId, row.id],
    });

    console.log("MP webhook: booking approved →", row.id);
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
            console.log("MP webhook: unexpected content-type", contentType);
            return NextResponse.json({ ok: true });
        }

        const body = await request.json();
        console.log("MP webhook: received", JSON.stringify(body));

        // ================================
        // 🏪 IPN FORMAT: merchant_order
        // ================================
        if (body.topic === "merchant_order" && body.resource) {
            const resourceUrl = String(body.resource);
            const orderId = resourceUrl.split("/").pop();
            if (!orderId) return NextResponse.json({ ok: true });

            const orderClient = new MerchantOrder(platformClient);
            const order = await orderClient.get({ merchantOrderId: Number(orderId) });
            await handleMerchantOrder(order);
            return NextResponse.json({ ok: true });
        }

        // ================================
        // 🔔 WEBHOOKS FORMAT: payment
        // ================================
        const dataId = body?.data?.id ? String(body.data.id) : "";

        if (!dataId) {
            console.log("MP webhook: unhandled body format");
            return NextResponse.json({ ok: true });
        }

        const xSignature = request.headers.get("x-signature") ?? "";
        const xRequestId = request.headers.get("x-request-id") ?? "";

        if (!verifyWebhookSignature(xSignature, xRequestId, dataId)) {
            console.log("MP webhook: invalid signature");
            return NextResponse.json({ ok: true });
        }

        if (body.type !== "payment") {
            return NextResponse.json({ ok: true });
        }

        const paymentClient = new Payment(platformClient);
        const paymentData = (await paymentClient.get({ id: dataId })) as ExtendedPaymentResponse;

        const preferenceId =
            paymentData.preference_id ??
            paymentData.point_of_interaction?.transaction_data?.preference_id ??
            null;
        const mpStatus = paymentData.status ?? null;
        const paymentId = paymentData.id?.toString() ?? null;
        const externalRef = paymentData.external_reference ?? "";

        if (!preferenceId || !paymentId || !mpStatus) {
            console.log("MP webhook: missing critical payment data");
            return NextResponse.json({ ok: true });
        }

        if (externalRef.startsWith("plan:") && mpStatus === "approved") {
            const parts = externalRef.split(":");
            if (parts.length === 3) {
                const [, businessId, planType] = parts;
                await activatePlan(businessId, planType);
            }
            return NextResponse.json({ ok: true });
        }

        // Booking payment via webhook format
        let bookingStatus: "approved" | "rejected" | "pending";
        if (mpStatus === "approved") {
            bookingStatus = "approved";
        } else if (mpStatus === "rejected" || mpStatus === "cancelled") {
            bookingStatus = "rejected";
        } else {
            bookingStatus = "pending";
        }

        const bookingResult = await db.execute({
            sql: `SELECT id, slot_id, mp_payment_id FROM bookings WHERE mp_preference_id = ? LIMIT 1`,
            args: [preferenceId],
        });

        if (bookingResult.rows.length === 0) return NextResponse.json({ ok: true });

        const row = bookingResult.rows[0] as unknown as {
            id: string;
            slot_id: string;
            mp_payment_id?: string | null;
        };

        if ((row.mp_payment_id ?? "") === paymentId) return NextResponse.json({ ok: true });

        await db.execute({
            sql: `UPDATE bookings SET status = ?, mp_payment_id = ? WHERE id = ?`,
            args: [bookingStatus, paymentId, row.id],
        });

        if (bookingStatus === "rejected") {
            await db.execute({
                sql: `UPDATE slots SET status = 'open' WHERE id = ?`,
                args: [row.slot_id],
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("MP webhook error:", error);
        return NextResponse.json({ ok: true });
    }
}
