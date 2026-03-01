import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) redirect('/auth/login');
    if (session.user.role !== 'owner') redirect('/onboarding');

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60 p-8">{children}</main>
        </div>
    );
}
