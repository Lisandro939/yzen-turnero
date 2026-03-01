'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import type { Business } from '@/types';
import * as api from './api-client';

interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'customer';
    businessId?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    businesses: Business[];
    businessesLoading: boolean;
    logout: () => void;
    upgradeToOwner: (business: Business) => Promise<void>;
    updateBusiness: (businessId: string, data: Partial<Business>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const { data: session, update: updateSession } = useSession();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [businessesLoading, setBusinessesLoading] = useState(true);

    const user: AuthUser | null = session?.user
        ? {
              id: session.user.id,
              name: session.user.name ?? '',
              email: session.user.email ?? '',
              role: session.user.role,
              businessId: session.user.businessId,
          }
        : null;

    useEffect(() => {
        api.fetchBusinesses()
            .then(setBusinesses)
            .catch(console.error)
            .finally(() => setBusinessesLoading(false));
    }, []);

    function logout() {
        signOut({ callbackUrl: '/' });
    }

    async function upgradeToOwner(business: Business) {
        const created = await api.createBusiness(business);
        setBusinesses((prev) => [...prev, created]);
        // Re-run jwt() callback so session reflects new role: 'owner'
        await updateSession({ trigger: 'update' });
    }

    async function updateBusiness(businessId: string, data: Partial<Business>) {
        await api.updateBusiness(businessId, data);
        setBusinesses((prev) =>
            prev.map((b) => (b.id === businessId ? { ...b, ...data } : b)),
        );
    }

    return (
        <AuthContext.Provider
            value={{ user, businesses, businessesLoading, logout, upgradeToOwner, updateBusiness }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AppProvider');
    return ctx;
}
