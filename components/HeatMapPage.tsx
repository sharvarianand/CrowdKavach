'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Shield,
    User,
    MoreHorizontal,
    LogOut,
    LayoutDashboard,
    Map,
    Bell,
    Settings,
    BarChart3,
    FileText
} from 'lucide-react';
import HeatMapVisualization from './HeatMap';
import EmergencyButton from './EmergencyButton';
import { AppUser } from '@/lib/types';

export default function HeatMapPage({ user }: { user?: AppUser }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

    // Update time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            {/* Emergency Button */}
            <EmergencyButton />

            {/* Header */}
            <header className="h-16 border-b border-cyan-900/30 bg-[#0a101f]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Shield className="w-8 h-8 text-cyan-400 fill-cyan-950" />
                        <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
                    </div>
                    <h1 className="text-xl font-bold tracking-wider text-white">
                        CROWD<span className="text-cyan-400">KAVACH</span>
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Link href="/heatmap" className="flex items-center gap-2 px-4 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                        <Map className="w-4 h-4" />
                        <span className="text-sm">Heat Map</span>
                    </Link>
                    <Link href="/analysis" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm">Analysis</span>
                    </Link>
                    <Link href="/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Reports</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                    </Link>
                </nav>

                <div className="flex items-center gap-6">
                    <div className="text-xs font-mono text-cyan-300/70 tracking-widest">
                        {currentDate} - {currentTime}
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <Bell className="w-5 h-5 text-cyan-500/70 hover:text-cyan-400 cursor-pointer transition-colors" />
                    </div>

                    <div className="flex items-center gap-3 pl-6 border-l border-cyan-900/30 relative">
                        <div className="w-8 h-8 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/30">
                            <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-medium text-cyan-100 tracking-wide">
                            {user?.firstName ? user.firstName.toUpperCase() : 'ADMIN_01'}
                        </span>
                        <div className="relative">
                            <MoreHorizontal
                                className="w-4 h-4 text-cyan-500/50 ml-2 cursor-pointer hover:text-cyan-400 transition-colors"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            />
                            {showProfileMenu && (
                                <div className="absolute right-0 top-8 w-48 bg-[#0f1729] border border-cyan-900/30 rounded-lg shadow-xl z-50 overflow-hidden">
                                    <div className="p-3 border-b border-cyan-900/30">
                                        <div className="text-xs text-cyan-500/70">Signed in as</div>
                                        <div className="text-sm text-cyan-100 truncate">{user?.email || 'admin@crowdkavach.com'}</div>
                                    </div>
                                    <a
                                        href="/api/auth/logout"
                                        className="flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-hidden">
                <HeatMapVisualization className="h-full" />
            </main>

            {/* Footer */}
            <footer className="h-12 border-t border-cyan-900/30 bg-[#0a101f] px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">HEAT MAP MONITORING ACTIVE</span>
                </div>
                <div className="text-xs text-gray-500">
                    Last updated: {currentTime}
                </div>
            </footer>
        </div>
    );
}
