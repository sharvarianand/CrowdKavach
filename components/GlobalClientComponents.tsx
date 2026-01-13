'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import FloatingEmergencyButton from '@/components/FloatingEmergencyButton';

interface GlobalClientComponentsProps {
    children: React.ReactNode;
}

// Pages where the emergency button should appear (protected routes after login)
const protectedPaths = ['/dashboard', '/settings', '/heatmap', '/analysis', '/reports'];

export default function GlobalClientComponents({ children }: GlobalClientComponentsProps) {
    const pathname = usePathname();

    // Only show emergency button on protected routes (after login)
    const showEmergencyButton = protectedPaths.some(path => pathname?.startsWith(path));

    return (
        <>
            {children}
            {showEmergencyButton && (
                <FloatingEmergencyButton
                    baseUrl="http://localhost:8000"
                    defaultZone="CrowdKavach Monitoring"
                />
            )}
        </>
    );
}

