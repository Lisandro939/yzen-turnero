import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';

const secure = process.env.NODE_ENV === 'production';

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            checks: ['state'],
        }),
    ],
    session: { strategy: 'jwt' },
    cookies: {
        state: {
            name: 'authjs.state',
            options: { httpOnly: true, sameSite: 'lax', path: '/', secure },
        },
        sessionToken: {
            name: 'authjs.session-token',
            options: { httpOnly: true, sameSite: 'lax', path: '/', secure },
        },
        callbackUrl: {
            name: 'authjs.callback-url',
            options: { httpOnly: true, sameSite: 'lax', path: '/', secure },
        },
        csrfToken: {
            name: 'authjs.csrf-token',
            options: { httpOnly: true, sameSite: 'lax', path: '/', secure },
        },
    },
    callbacks: {
        async jwt({ token, trigger }) {
            // Query DB on first sign-in, manual update(), or when role is absent
            if (token.email && (trigger === 'signIn' || trigger === 'update' || !token.role)) {
                const result = await db.execute({
                    sql: 'SELECT id FROM businesses WHERE owner_email = ? LIMIT 1',
                    args: [token.email],
                });
                token.role = result.rows.length > 0 ? 'owner' : 'customer';
                token.businessId = result.rows[0] ? String(result.rows[0].id) : undefined;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.sub!;
            session.user.role = (token.role as 'owner' | 'customer') ?? 'customer';
            session.user.businessId = token.businessId as string | undefined;
            return session;
        },
    },
});
