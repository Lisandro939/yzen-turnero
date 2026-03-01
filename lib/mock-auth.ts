'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { googleLogout } from '@react-oauth/google';
import type { User, Business } from '@/types';
import * as api from './api-client';

interface AuthContextValue {
  user: User | null;
  businesses: Business[];
  businessesLoading: boolean;
  loginWithGoogle: (name: string, email: string) => Promise<void>;
  logout: () => void;
  upgradeToOwner: (business: Business) => Promise<void>;
  updateBusiness: (businessId: string, data: Partial<Business>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'turnero_user';

function persist(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesLoading, setBusinessesLoading] = useState(true);

  // Rehydrate user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Load businesses from DB via API
  useEffect(() => {
    api.fetchBusinesses()
      .then(setBusinesses)
      .catch(console.error)
      .finally(() => setBusinessesLoading(false));
  }, []);

  async function loginWithGoogle(name: string, email: string) {
    // Ensure businesses are loaded before checking owner status
    let bizList = businesses;
    if (bizList.length === 0) {
      bizList = await api.fetchBusinesses();
      setBusinesses(bizList);
    }

    const ownerBusiness = bizList.find((b) => b.ownerEmail === email);
    const newUser: User = ownerBusiness
      ? { id: `user-${ownerBusiness.id}`, name, email, role: 'owner', businessId: ownerBusiness.id }
      : { id: `user-google-${email}`, name, email, role: 'customer' };
    setUser(newUser);
    persist(newUser);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    googleLogout();
  }

  async function upgradeToOwner(business: Business) {
    const created = await api.createBusiness(business);
    setBusinesses((prev) => [...prev, created]);
    const updated: User = { ...user!, role: 'owner', businessId: created.id };
    setUser(updated);
    persist(updated);
  }

  async function updateBusiness(businessId: string, data: Partial<Business>) {
    await api.updateBusiness(businessId, data);
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, ...data } : b)));
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, businesses, businessesLoading, loginWithGoogle, logout, upgradeToOwner, updateBusiness } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
