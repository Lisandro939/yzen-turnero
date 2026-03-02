import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function PlanLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session) redirect('/auth/login');
    if (session.user.role !== 'owner') redirect('/customer');
    return <>{children}</>;
}
