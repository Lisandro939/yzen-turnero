"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

export function PageTransition() {
    const overlayRef = useRef<HTMLDivElement>(null);
    const isAnimating = useRef(false);
    const router = useRouter();
    const pathname = usePathname();

    // Phase 2: reveal new page by wiping the overlay away
    useEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay || !isAnimating.current) return;
        isAnimating.current = false;
        gsap.fromTo(
            overlay,
            { clipPath: "inset(0 0% 0 0)" },
            {
                clipPath: "inset(0 0% 0 100%)",
                duration: 0.4,
                ease: "power4.inOut",
                delay: 0.05,
            },
        );
    }, [pathname]);

    // Phase 1: intercept link clicks, paint the overlay, then navigate
    useEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        function handleClick(e: MouseEvent) {
            const anchor = (e.target as Element).closest("a");
            if (!anchor) return;

            const href = anchor.getAttribute("href");
            if (!href) return;
            if (href.startsWith("http") || href.startsWith("//")) return;
            if (href.startsWith("#")) return;
            if (anchor.target === "_blank") return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if (isAnimating.current) return;

            const targetPath = href.split("?")[0];
            if (targetPath === window.location.pathname) return;

            e.preventDefault();
            isAnimating.current = true;

            gsap.fromTo(
                overlay,
                { clipPath: "inset(0 100% 0 0)" },
                {
                    clipPath: "inset(0 0% 0 0)",
                    duration: 0.4,
                    ease: "power4.inOut",
                    onComplete: () => {
                        router.push(href);
                    },
                },
            );
        }

        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [router]);

    return (
        <div
            ref={overlayRef}
            style={{
                clipPath: "inset(0 100% 0 0)",
                backgroundColor: "#a5b4fc",
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                pointerEvents: "none",
            }}
        />
    );
}
