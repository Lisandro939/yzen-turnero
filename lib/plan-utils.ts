import type { Business } from "@/types";

export const PLAN_PRICES = { pro: 7.5, max: 12 } as const;
// export const PLAN_PRICES = { pro: 7500, max: 12000 } as const;

export type PlanStatus = {
    active: boolean;
    plan: "pro" | "max" | null;
    daysLeft: number | null;
    inTrial: boolean;
    expiring: boolean; // active && daysLeft <= 7
};

export function getPlanStatus(business: Business): PlanStatus {
    const now = new Date();
    const trialEnd = business.trialEndsAt
        ? new Date(business.trialEndsAt)
        : null;
    const planExpiry = business.planExpiresAt
        ? new Date(business.planExpiresAt)
        : null;

    if (trialEnd && trialEnd > now && !planExpiry) {
        const daysLeft = Math.ceil(
            (trialEnd.getTime() - now.getTime()) / 86400000,
        );
        return {
            active: true,
            plan: "pro",
            daysLeft,
            inTrial: true,
            expiring: daysLeft <= 7,
        };
    }
    if (planExpiry && planExpiry > now) {
        const daysLeft = Math.ceil(
            (planExpiry.getTime() - now.getTime()) / 86400000,
        );
        return {
            active: true,
            plan: business.plan ?? "pro",
            daysLeft,
            inTrial: false,
            expiring: daysLeft <= 7,
        };
    }
    return {
        active: false,
        plan: null,
        daysLeft: null,
        inTrial: false,
        expiring: false,
    };
}
