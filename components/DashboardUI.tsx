'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import VideoBox from './VideoBox';
import LowBandwidthView from './LowBandwidthView';
import EmergencyButton from './EmergencyButton';
import {
    Shield,
    User,
    MoreHorizontal,
    AlertTriangle,
    Activity,
    Menu,
    Maximize,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Clock,
    Search,
    Settings,
    Bell,
    Minimize,
    CheckCircle,
    Info,
    LogOut,
    LayoutDashboard,
    Map,
    BarChart3,
    FileText,
    WifiOff,
    Video,
    Plus
} from 'lucide-react';
import { AppUser, Camera } from '@/lib/types';

// Alert types and interface
interface Alert {
    id: number;
    type: 'critical' | 'warning' | 'info';
    message: string;
    zone: string;
    timestamp: Date;
}

// Generate mock alerts
const generateMockAlerts = (): Alert[] => {
    const alertTypes: Array<{ type: Alert['type']; messages: string[] }> = [
        { type: 'critical', messages: ['Crowd gathering detected', 'Stampede risk identified', 'Overcrowding alert', 'Emergency situation'] },
        { type: 'warning', messages: ['Unattended object', 'Unusual movement pattern', 'High density warning', 'Blocked exit detected'] },
        { type: 'info', messages: ['New camera online', 'System update complete', 'Patrol started', 'Zone cleared'] }
    ];
    const zones = ['Zone A', 'Zone B', 'Zone C', 'Main Plaza', 'Entry Gate', 'Exit Gate'];

    return Array.from({ length: 5 }, (_, i) => {
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        return {
            id: Date.now() + i,
            type: alertType.type,
            message: alertType.messages[Math.floor(Math.random() * alertType.messages.length)],
            zone: zones[Math.floor(Math.random() * zones.length)],
            timestamp: new Date(Date.now() - Math.random() * 3600000) // Within last hour
        };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Generate hourly footfall data
const generateFootfallData = (baseCount: number): number[] => {
    const hours = 12;
    return Array.from({ length: hours }, (_, i) => {
        // Simulate realistic hourly patterns (lower morning, peak afternoon, lower evening)
        const hourFactor = Math.sin((i / hours) * Math.PI) * 0.5 + 0.5;
        const randomVariation = 0.8 + Math.random() * 0.4;
        return Math.min(100, Math.max(10, Math.floor(baseCount * hourFactor * randomVariation / 2)));
    });
};

// Generate dwell time data points
const generateDwellTimeData = (): number[] => {
    return Array.from({ length: 10 }, () => 20 + Math.floor(Math.random() * 60));
};

export default function DashboardUI({ user }: { user?: AppUser }) {
    const [peopleCount, setPeopleCount] = useState(0);
    const [density, setDensity] = useState(0);
    const [isLive, setIsLive] = useState(true);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [footfallData, setFootfallData] = useState<number[]>([40, 65, 45, 80, 55, 70, 90, 85, 75, 60, 50, 65]);
    const [dwellTimeData, setDwellTimeData] = useState<number[]>([30, 45, 35, 60, 40, 55, 65, 50, 45, 35]);
    const [timelinePosition, setTimelinePosition] = useState(100); // 100% = live, 0-99 = playback position
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isMainFeedExpanded, setIsMainFeedExpanded] = useState(false);
    const [lowBandwidthMode, setLowBandwidthMode] = useState(false);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';

    // Load settings from localStorage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('crowdkavach_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setLowBandwidthMode(settings.lowBandwidthMode || false);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }, []);

    // Fetch cameras list
    useEffect(() => {
        const fetchCameras = async () => {
            try {
                const response = await fetch(`${baseUrl}/cameras`);
                if (response.ok) {
                    const data = await response.json();
                    setCameras(data.cameras || []);
                    // Set first camera as selected if none selected
                    if (data.cameras?.length > 0 && !selectedCameraId) {
                        setSelectedCameraId(data.cameras[0].id);
                    }
                }
            } catch (error) {
                console.log('Failed to fetch cameras:', error);
            }
        };

        fetchCameras();
        // Refresh camera list every 10 seconds
        const interval = setInterval(fetchCameras, 10000);
        return () => clearInterval(interval);
    }, [baseUrl, selectedCameraId]);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Initialize alerts
    useEffect(() => {
        setAlerts(generateMockAlerts());
    }, []);

    // Fetch people count and density dynamically
    useEffect(() => {
        if (!isLive) return; // Don't fetch when in playback mode

        const fetchAnalytics = async () => {
            try {
                // If we have multiple cameras, fetch aggregated analytics
                const endpoint = cameras.length > 1 ? '/analytics/all' : `/analytics${selectedCameraId ? `?camera_id=${selectedCameraId}` : ''}`;
                const response = await fetch(`${baseUrl}${endpoint}`);
                if (response.ok) {
                    const data = await response.json();
                    if (cameras.length > 1 && data.total_people_count !== undefined) {
                        setPeopleCount(data.total_people_count);
                        // Calculate average density across cameras
                        const avgDensity = data.cameras?.reduce((sum: number, cam: { density: number }) => sum + cam.density, 0) / (data.cameras?.length || 1);
                        setDensity(Math.round(avgDensity) || 0);
                    } else {
                        setPeopleCount(data.people_count || 0);
                        setDensity(data.density || 0);
                    }
                    setFootfallData(generateFootfallData(data.people_count || data.total_people_count || 50));
                }
            } catch (error) {
                console.log('Using mock data');
                // Fallback to mock data for development
                const mockCount = 50 + Math.floor(Math.random() * 150);
                setPeopleCount(mockCount);
                setDensity(Math.floor(Math.random() * 100));
                setFootfallData(generateFootfallData(mockCount));
            }
        };

        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [isLive, cameras.length, selectedCameraId, baseUrl]);

    // Update dwell time data periodically
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setDwellTimeData(generateDwellTimeData());
        }, 5000);

        return () => clearInterval(interval);
    }, [isLive]);

    // Simulate new alerts periodically
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance of new alert
                const newAlert = generateMockAlerts()[0];
                setAlerts(prev => [newAlert, ...prev].slice(0, 5));
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isLive]);

    // Handle play/pause toggle
    const togglePlayPause = useCallback(() => {
        setIsLive(prev => !prev);
        if (!isLive) {
            setTimelinePosition(100); // Return to live
        }
    }, [isLive]);

    // Handle skip back (go to playback mode)
    const handleSkipBack = useCallback(() => {
        setIsLive(false);
        setTimelinePosition(prev => Math.max(0, prev - 10));
    }, []);

    // Handle skip forward
    const handleSkipForward = useCallback(() => {
        setTimelinePosition(prev => {
            const newPos = Math.min(100, prev + 10);
            if (newPos >= 100) {
                setIsLive(true);
            }
            return newPos;
        });
    }, []);

    // Calculate density level
    const getDensityLevel = (density: number) => {
        if (density < 30) return { level: 'LOW', color: 'text-green-400' };
        if (density < 60) return { level: 'MEDIUM', color: 'text-yellow-400' };
        return { level: 'HIGH', color: 'text-red-400' };
    };

    const densityInfo = getDensityLevel(density);

    // Get alert icon and colors
    const getAlertStyle = (type: Alert['type']) => {
        switch (type) {
            case 'critical':
                return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-200', icon: AlertTriangle, iconColor: 'text-red-500' };
            case 'warning':
                return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' };
            case 'info':
                return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-200', icon: Info, iconColor: 'text-blue-500' };
        }
    };

    // Format timestamp for alerts
    const formatAlertTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Generate SVG path for dwell time chart
    const generateDwellPath = () => {
        const points = dwellTimeData.map((val, i) => {
            const x = (i / (dwellTimeData.length - 1)) * 100;
            const y = 100 - val;
            return `${x},${y}`;
        });
        return `M${points.join(' L')}`;
    };

    const generateDwellAreaPath = () => {
        const points = dwellTimeData.map((val, i) => {
            const x = (i / (dwellTimeData.length - 1)) * 100;
            const y = 100 - val;
            return `${x},${y}`;
        });
        return `M0,100 L${points.join(' L')} L100,100 Z`;
    };
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
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Link href="/heatmap" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
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
            <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden relative">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none -z-10"></div>

                {isMainFeedExpanded ? (
                    /* Expanded Main Feed - Full screen */
                    <div className="col-span-12 relative flex flex-col h-full">
                        <div className="relative bg-[#0f1729] rounded-xl border border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.1)] flex-1 flex flex-col">
                            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-linear-to-b from-black/60 to-transparent">
                                <span className="text-xs font-bold text-cyan-400 tracking-wider flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-500/20 backdrop-blur-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite]"></span>
                                    {lowBandwidthMode ? (
                                        <>
                                            <WifiOff className="w-3 h-3 text-amber-400" />
                                            LOW BANDWIDTH MODE (EXPANDED)
                                        </>
                                    ) : (
                                        <>
                                            {cameras.find(c => c.id === selectedCameraId)?.name?.toUpperCase() || 'MAIN CAMERA'} - EXPANDED
                                        </>
                                    )}
                                </span>
                                <button
                                    onClick={() => setIsMainFeedExpanded(false)}
                                    className="p-2 bg-black/40 rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                                    title="Minimize"
                                >
                                    <Minimize className="w-5 h-5 text-cyan-200/70 hover:text-cyan-400" />
                                </button>
                            </div>

                            <div className="flex-1 relative bg-black/50">
                                {lowBandwidthMode ? (
                                    <LowBandwidthView className="w-full h-full" isPaused={!isLive} />
                                ) : (
                                    <VideoBox className="w-full h-full" isPaused={!isLive} cameraId={selectedCameraId} />
                                )}

                                {/* Corner brackets */}
                                <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg"></div>
                                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg"></div>
                                <div className="absolute bottom-16 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg"></div>
                                <div className="absolute bottom-16 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg"></div>

                                {/* Footer controls overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center bg-black/80 backdrop-blur-md border-t border-cyan-900/30">
                                    <div className="flex items-center gap-4 text-cyan-500/70">
                                        <span className="text-xs font-mono hover:text-cyan-400 cursor-pointer transition-colors">★</span>
                                        <span className="text-xs font-mono hover:text-cyan-400 cursor-pointer transition-colors">⚙</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-cyan-500/70">
                                        <Minimize
                                            className="w-4 h-4 hover:text-cyan-400 cursor-pointer transition-colors"
                                            onClick={() => setIsMainFeedExpanded(false)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Left Sidebar - Small Feeds */}
                        <div className="col-span-3 flex flex-col gap-4 h-full overflow-y-auto pr-1 custom-scrollbar">
                            {cameras.length > 0 ? (
                                cameras.slice(0, 4).map((camera) => (
                                    <div 
                                        key={camera.id} 
                                        className={`group relative bg-[#0f1729] rounded-lg border overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:border-cyan-500/50 transition-all duration-300 cursor-pointer ${selectedCameraId === camera.id ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' : 'border-cyan-900/30'}`}
                                        onClick={() => setSelectedCameraId(camera.id)}
                                    >
                                        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-10 bg-linear-to-b from-black/80 to-transparent">
                                            <span className="text-[10px] font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${camera.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                                {camera.name.toUpperCase()} - {camera.status === 'online' ? 'LIVE' : 'OFFLINE'}
                                            </span>
                                            <MoreHorizontal className="w-4 h-4 text-gray-400 opacity-60 group-hover:opacity-100 cursor-pointer" />
                                        </div>
                                        <div className="aspect-video w-full opacity-80 group-hover:opacity-100 transition-opacity relative">
                                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                                <VideoBox 
                                                    className={`w-full h-full ${selectedCameraId === camera.id ? '' : 'opacity-60 grayscale hover:grayscale-0'} transition-all duration-500`} 
                                                    isPaused={!isLive} 
                                                    cameraId={camera.id}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Fallback to placeholder if no cameras configured
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="group relative bg-[#0f1729] rounded-lg border border-cyan-900/30 overflow-hidden shadow-[0_0_15px_rgba(0,229,255,0.05)] hover:border-cyan-500/50 transition-all duration-300">
                                        <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-10 bg-linear-to-b from-black/80 to-transparent">
                                            <span className="text-[10px] font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                NO CAMERA CONFIGURED
                                            </span>
                                        </div>
                                        <div className="aspect-video w-full flex items-center justify-center bg-slate-900/50">
                                            <div className="text-center">
                                                <Video className="w-8 h-8 text-cyan-500/30 mx-auto mb-2" />
                                                <Link href="/settings" className="text-xs text-cyan-500/50 hover:text-cyan-400">
                                                    Add Camera
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Center - Main Feed */}
                        <div className="col-span-6 relative flex flex-col">
                            <div className="relative bg-[#0f1729] rounded-xl border border-cyan-500/20 overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.1)] flex-1 flex flex-col">
                                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-linear-to-b from-black/60 to-transparent">
                                    <span className="text-xs font-bold text-cyan-400 tracking-wider flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-cyan-500/20 backdrop-blur-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_1.5s_infinite]"></span>
                                        {lowBandwidthMode ? (
                                            <>
                                                <WifiOff className="w-3 h-3 text-amber-400" />
                                                LOW BANDWIDTH MODE
                                            </>
                                        ) : (
                                            <>
                                                {cameras.find(c => c.id === selectedCameraId)?.name?.toUpperCase() || 'MAIN CAMERA'} - {cameras.find(c => c.id === selectedCameraId)?.zone?.toUpperCase() || 'LIVE'}
                                            </>
                                        )}
                                    </span>
                                    <MoreHorizontal className="w-5 h-5 text-cyan-200/70 hover:text-cyan-400 cursor-pointer transition-colors" />
                                </div>

                                <div className="flex-1 relative bg-black/50">
                                    {/* Main video stream or Low Bandwidth View */}
                                    {lowBandwidthMode ? (
                                        <LowBandwidthView className="w-full h-full" isPaused={!isLive} />
                                    ) : (
                                        <VideoBox className="w-full h-full" isPaused={!isLive} cameraId={selectedCameraId} />
                                    )}

                                    {/* Grid Overlay Effect - only show for video mode */}
                                    {!lowBandwidthMode && (
                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-size-[100px_100px] pointer-events-none"></div>
                                    )}

                                    {/* Corner brackets */}
                                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg"></div>
                                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg"></div>
                                    <div className="absolute bottom-16 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg"></div>
                                    <div className="absolute bottom-16 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg"></div>

                                    {/* Footer controls overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center bg-black/80 backdrop-blur-md border-t border-cyan-900/30">
                                        <div className="flex items-center gap-4 text-cyan-500/70">
                                            <span className="text-xs font-mono hover:text-cyan-400 cursor-pointer transition-colors">★</span>
                                            <span className="text-xs font-mono hover:text-cyan-400 cursor-pointer transition-colors">⚙</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-cyan-500/70">
                                            <button
                                                onClick={() => setIsMainFeedExpanded(true)}
                                                title="Expand video"
                                                className="hover:text-cyan-400 cursor-pointer transition-colors"
                                            >
                                                <Maximize className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Analytics */}
                        <div className="col-span-3 flex flex-col gap-4 h-full overflow-y-auto pl-1 custom-scrollbar">

                            {/* Real-time Analytics Card */}
                            <div className="bg-[#0f1729] rounded-lg border border-cyan-900/30 p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-2">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </div>
                                <h3 className="text-xs font-bold text-cyan-100 mb-4 tracking-wider">REAL-TIME ANALYTICS</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] text-cyan-500/70 font-semibold mb-1">PEOPLE COUNT:</div>
                                        <div className="text-4xl font-mono text-cyan-400 leading-none tracking-tighter shadow-cyan-500/20 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{peopleCount}</div>
                                    </div>
                                    <div className="relative">
                                        <div className="text-[10px] text-cyan-500/70 font-semibold mb-1 text-right">DENSITY: <span className={densityInfo.color}>{densityInfo.level} ({density}%)</span></div>
                                        {/* Simple Gauge Mock */}
                                        <div className="h-16 w-32 ml-auto relative mt-2 flex justify-center overflow-hidden">
                                            <div className="absolute w-24 h-24 rounded-full border-[6px] border-slate-800 top-0"></div>
                                            <div
                                                className="absolute w-24 h-24 rounded-full border-[6px] border-transparent border-t-cyan-500 border-r-purple-500 top-0 transition-transform duration-1000"
                                                style={{ transform: `rotate(${-45 + (density * 2.7)}deg)` }}
                                            ></div>
                                            <div
                                                className="absolute bottom-2 left-[50%] -translate-x-1/2 w-1 h-8 bg-white origin-bottom shadow-[0_0_10px_white] transition-transform duration-1000"
                                                style={{ transform: `rotate(${(density * 1.8) - 90}deg)` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alerts Panel */}
                            <div className="bg-[#0f1729] rounded-lg border border-cyan-900/30 p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-2">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </div>
                                <h3 className="text-xs font-bold text-cyan-100 mb-4 tracking-wider flex items-center gap-2">
                                    RECENT ALERTS
                                    {alerts.filter(a => a.type === 'critical').length > 0 && (
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    )}
                                </h3>

                                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                    {alerts.slice(0, 4).map((alert) => {
                                        const style = getAlertStyle(alert.type);
                                        const IconComponent = style.icon;
                                        return (
                                            <div key={alert.id} className={`flex items-center gap-3 ${style.bg} p-2 rounded border ${style.border} transition-all duration-300`}>
                                                <div className={`min-w-6 min-h-6 rounded-full ${style.bg} flex items-center justify-center`}>
                                                    <IconComponent className={`w-3 h-3 ${style.iconColor}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs ${style.text} truncate`}>{alert.message} ({alert.zone})</div>
                                                    <div className="text-[9px] text-gray-500">{formatAlertTime(alert.timestamp)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Hourly Footfall Chart */}
                            <div className="bg-[#0f1729] rounded-lg border border-cyan-900/30 p-4 relative overflow-hidden flex-1 group hover:border-cyan-500/30 transition-colors">
                                <div className="absolute top-0 right-0 p-2">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </div>
                                <h3 className="text-xs font-bold text-cyan-100 mb-2 tracking-wider flex justify-between items-center">
                                    <span>HOURLY FOOTFALL</span>
                                    <span className="text-[10px] text-cyan-500/70 font-normal">
                                        Total: {footfallData.reduce((a, b) => a + b, 0)}
                                    </span>
                                </h3>
                                <div className="flex items-end justify-between h-24 gap-1 px-1 mt-4">
                                    {footfallData.map((h, i) => (
                                        <div key={i} className="relative w-full group/bar flex flex-col items-center">
                                            <div className="absolute -top-5 text-[8px] text-cyan-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                                {h}
                                            </div>
                                            <div
                                                className="w-full bg-linear-to-t from-cyan-900 to-cyan-500/50 rounded-t-sm transition-all duration-500 hover:from-cyan-800 hover:to-cyan-400"
                                                style={{ height: `${h}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-2 text-[8px] text-cyan-500/50 font-mono">
                                    {Array.from({ length: 7 }, (_, i) => {
                                        const hour = new Date().getHours() - 6 + i;
                                        return <span key={i}>{((hour + 24) % 24).toString().padStart(2, '0')}</span>;
                                    })}
                                </div>
                            </div>

                            {/* Average Dwell Time Chart */}
                            <div className="bg-[#0f1729] rounded-lg border border-cyan-900/30 p-4 relative overflow-hidden flex-1 group hover:border-cyan-500/30 transition-colors">
                                <h3 className="text-xs font-bold text-cyan-100 mb-2 tracking-wider flex justify-between items-center">
                                    <span>AVERAGE DWELL TIME</span>
                                    <span className="text-[10px] text-purple-400 font-normal">
                                        Avg: {Math.round(dwellTimeData.reduce((a, b) => a + b, 0) / dwellTimeData.length)}s
                                    </span>
                                </h3>
                                <div className="relative h-24 w-full mt-4">
                                    {/* Dynamic SVG Area Chart */}
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="dwellGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d={generateDwellAreaPath()}
                                            fill="url(#dwellGradient)"
                                            className="transition-all duration-1000"
                                        />
                                        <path
                                            d={generateDwellPath()}
                                            fill="none"
                                            stroke="#a78bfa"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                            className="drop-shadow-[0_0_4px_rgba(167,139,250,0.5)] transition-all duration-1000"
                                        />
                                        {/* Data points */}
                                        {dwellTimeData.map((val, i) => {
                                            const x = (i / (dwellTimeData.length - 1)) * 100;
                                            const y = 100 - val;
                                            return (
                                                <circle
                                                    key={i}
                                                    cx={x}
                                                    cy={y}
                                                    r="2"
                                                    fill="#a78bfa"
                                                    className="transition-all duration-1000"
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>
                                <div className="flex justify-between text-[8px] text-cyan-500/50 font-mono px-1">
                                    {Array.from({ length: 7 }, (_, i) => {
                                        const hour = new Date().getHours() - 6 + i;
                                        return <span key={i}>{((hour + 24) % 24).toString().padStart(2, '0')}</span>;
                                    })}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </main>

            {/* Footer Timeline */}
            <footer className="h-16 border-t border-cyan-900/30 bg-[#0a101f] px-6 flex items-center gap-4 relative z-50">
                <div className="flex items-center gap-4 mr-4">
                    <SkipBack
                        className="w-4 h-4 text-cyan-500 hover:text-cyan-300 cursor-pointer transition-colors"
                        onClick={handleSkipBack}
                    />
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border cursor-pointer transition-all duration-300 group ${isLive
                            ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20'
                            : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                        onClick={togglePlayPause}
                        title={isLive ? 'Pause live feed (switch to playback)' : 'Resume live feed'}
                    >
                        {isLive ? (
                            <Pause className="w-3 h-3 text-cyan-400 group-hover:text-white" />
                        ) : (
                            <Play className="w-3 h-3 text-amber-400 group-hover:text-white fill-current ml-0.5" />
                        )}
                    </div>
                    <SkipForward
                        className="w-4 h-4 text-cyan-500 hover:text-cyan-300 cursor-pointer transition-colors"
                        onClick={handleSkipForward}
                    />
                    <Clock className="w-4 h-4 text-cyan-500/50" />
                    <span className="text-xs font-mono text-cyan-500/70">
                        {isLive ? 'LIVE' : `PLAYBACK ${timelinePosition}%`}
                    </span>
                </div>

                {/* Timeline Bar */}
                <div className="flex-1 relative h-10 flex items-center group">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-0.5 bg-cyan-900/50"></div>
                    </div>

                    {/* Progress fill */}
                    <div
                        className="absolute left-0 h-0.5 bg-cyan-500/50 transition-all duration-300"
                        style={{ width: `${timelinePosition}%` }}
                    ></div>

                    {/* Markers */}
                    {[0, 20, 40, 60, 80, 100].map((pos, i) => (
                        <div key={i} className="absolute h-2 w-0.5 bg-cyan-700 top-1/2 -translate-y-1/2" style={{ left: `${pos}%` }}></div>
                    ))}

                    {/* Time labels */}
                    <div className="absolute -bottom-3 left-0 text-[8px] text-cyan-500/50 font-mono">-6h</div>
                    <div className="absolute -bottom-3 right-0 text-[8px] text-cyan-500/50 font-mono">NOW</div>

                    {/* Events on timeline (from alerts) */}
                    {alerts.slice(0, 3).map((alert, i) => {
                        const alertAge = (Date.now() - alert.timestamp.getTime()) / 3600000; // hours ago
                        const position = Math.max(0, 100 - (alertAge * 16.67)); // 6 hours = 100%
                        const color = alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500';
                        return (
                            <div
                                key={alert.id}
                                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color} border-2 border-[#0a101f] cursor-pointer hover:scale-125 transition-transform`}
                                style={{ left: `${position}%` }}
                                title={`${alert.message} - ${formatAlertTime(alert.timestamp)}`}
                            ></div>
                        );
                    })}

                    {/* Progress Head */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-[0_0_15px_cyan] cursor-grab border-2 border-white z-10 transition-all duration-300 ${isLive ? 'bg-cyan-400' : 'bg-amber-400'
                            }`}
                        style={{ left: `${timelinePosition}%` }}
                    ></div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                    {isLive ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-bold text-emerald-500 tracking-wider">LIVE - ALL SYSTEMS NORMAL</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-xs font-bold text-amber-500 tracking-wider">PLAYBACK MODE</span>
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
}
