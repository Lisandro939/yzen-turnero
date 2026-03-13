"use client";

import { SessionProvider } from "next-auth/react";
import { AppProvider } from "@/lib/auth-context";
import { Toaster } from "sileo";
export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AppProvider>{children}</AppProvider>
            <Toaster position="top-right" theme="light" options={{ roundness: 12 }} />
        </SessionProvider>
    );
}
