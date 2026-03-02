import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) redirect('/auth/login');
    if (session.user.role === 'owner') redirect('/dashboard');

    return (
        <div className="min-h-screen" style={{ background: '#f5f7ff' }}>
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <a href="/" className="text-lg font-black text-slate-900 tracking-tight">
                        turnero<span className="text-indigo-400">.</span>
                    </a>
                    <span className="text-slate-400 text-sm">{session.user.name}</span>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}
