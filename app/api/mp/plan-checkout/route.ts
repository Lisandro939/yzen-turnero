import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPaymentPreference } from "@/lib/mercadopago";
import { PLAN_PRICES } from "@/lib/plan-utils";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== "owner") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = (await request.json()) as { plan: "pro" | "max" };
    if (plan !== "pro" && plan !== "max") {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const businessId = session.user.businessId;
    if (!businessId) {
        return NextResponse.json(
            { error: "No business found" },
            { status: 400 },
        );
    }

    const price = PLAN_PRICES[plan];
    const planLabel = plan === "pro" ? "Pro" : "Max";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
        const preference = await createPaymentPreference(
            process.env.MP_PLATFORM_ACCESS_TOKEN!,
            [
                {
                    id: `plan-${plan}`,
                    title: `Plan ${planLabel} - Turnero`,
                    quantity: 1,
                    unit_price: price,
                    currency_id: "ARS",
                },
            ],
            {
                success: `${baseUrl}/plan?payment=success`,
                failure: `${baseUrl}/plan?payment=failed`,
                pending: `${baseUrl}/plan?payment=pending`,
            },
            `${baseUrl}/api/mp/webhook`,
            `plan:${businessId}:${plan}`,
        );
        return NextResponse.json({
            initPoint: preference.initPoint,
            sandboxInitPoint: preference.sandboxInitPoint,
        });
    } catch (err) {
        console.error("Plan checkout error:", err);
        return NextResponse.json(
            { error: "No se pudo crear la preferencia de pago" },
            { status: 500 },
        );
    }
}
