'use client';

import { useEffect } from 'react';
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
            <svg
                className="animate-spin h-8 w-8 text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                />
            </svg>
        </div>
    );
}
