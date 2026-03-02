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
            // Query DB on first sign-in, manual update(), or when role/roleChosen is absent
            if (
                token.email &&
                (trigger === 'signIn' ||
                    trigger === 'update' ||
                    !token.role ||
                    token.roleChosen === undefined)
            ) {
                try {
                    // Ensure user record exists on every sign-in (idempotent)
                    if (trigger === 'signIn') {
                        await db.execute({
                            sql: 'INSERT OR IGNORE INTO users (email) VALUES (?)',
                            args: [token.email],
                        });
                    }
                    // Determine role from businesses table
                    const bizResult = await db.execute({
                        sql: 'SELECT id FROM businesses WHERE owner_email = ? LIMIT 1',
                        args: [token.email],
                    });
                    token.role = bizResult.rows.length > 0 ? 'owner' : 'customer';
                    token.businessId = bizResult.rows[0]
                        ? String(bizResult.rows[0].id)
                        : undefined;
                    // Owners are always considered as having chosen their role
                    if (token.role === 'owner') {
                        token.roleChosen = true;
                    } else {
                        const userResult = await db.execute({
                            sql: 'SELECT role_chosen FROM users WHERE email = ?',
                            args: [token.email],
                        });
                        token.roleChosen = userResult.rows[0]
                            ? Number(userResult.rows[0].role_chosen) === 1
                            : false;
                    }
                } catch (err) {
                    console.error('[auth] JWT callback DB error:', err);
                    // Fallback: keep existing values or safe defaults
                    if (!token.role) token.role = 'customer';
                    if (token.roleChosen === undefined) token.roleChosen = false;
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.sub!;
            session.user.role = (token.role as 'owner' | 'customer') ?? 'customer';
            session.user.businessId = token.businessId as string | undefined;
            session.user.roleChosen = (token.roleChosen as boolean) ?? false;
            return session;
        },
    },
});
