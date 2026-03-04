'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.replace('/auth/login');
            return;
        }

        if (!session?.user?.roleChosen) {
            router.replace('/welcome');
            return;
        }

        if (session.user.role === 'owner') {
            router.replace('/dashboard');
            return;
        }

        router.replace('/customer');
    }, [session, status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-300" />
        </div>
    );
}
