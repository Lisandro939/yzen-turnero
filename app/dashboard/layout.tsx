import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) redirect('/auth/login');
    if (session.user.role !== 'owner') redirect('/customer');

    // Plan access check
    if (session.user.businessId) {
        const bizRes = await db.execute({
            sql: 'SELECT plan_expires_at, trial_ends_at FROM businesses WHERE id = ?',
            args: [session.user.businessId],
        });
        const row = bizRes.rows[0] as Record<string, unknown> | undefined;
        if (row) {
            const now = new Date();
            const trialEnd   = row.trial_ends_at   ? new Date(String(row.trial_ends_at))   : null;
            const planExpiry = row.plan_expires_at ? new Date(String(row.plan_expires_at)) : null;
            const active = (trialEnd && trialEnd > now && !planExpiry) || (planExpiry && planExpiry > now);
            if (!active) redirect('/plan');
        }
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 lg:ml-60 p-4 lg:p-8 pb-24 lg:pb-8">{children}</main>
        </div>
    );
}
