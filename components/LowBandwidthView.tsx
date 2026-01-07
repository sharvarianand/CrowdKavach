'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, WifiOff } from 'lucide-react';

interface Person {
    id: number;
    x: number;
    y: number;
}

interface CoordinateData {
    timestamp: number;
    people: Person[];
    count: number;
    density: number;
}

interface LowBandwidthViewProps {
    className?: string;
    isPaused?: boolean;
}

export default function LowBandwidthView({ className = '', isPaused = false }: LowBandwidthViewProps) {
    const [data, setData] = useState<CoordinateData>({
        timestamp: Date.now(),
        people: [],
        count: 0,
        density: 0
    });
    const [isConnected, setIsConnected] = useState(false);

    // Fetch coordinates from server
    useEffect(() => {
        if (isPaused) return;

        const fetchCoordinates = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000'}/coordinates`
                );
                if (response.ok) {
                    const result = await response.json();
                    console.log('Coordinates received:', result); // Debug log
                    setData({
                        timestamp: result.timestamp,
                        people: result.people || [],
                        count: result.people?.length || 0,
                        density: result.density || 0
                    });
                    setIsConnected(true);
                } else {
                    throw new Error('Server error');
                }
            } catch (error) {
                console.log('Coordinates fetch error:', error); // Debug log
                setIsConnected(false);
                setData(prev => ({
                    ...prev,
                    timestamp: Date.now(),
                }));
            }
        };

        fetchCoordinates();
        const interval = setInterval(fetchCoordinates, 500);
        return () => clearInterval(interval);
    }, [isPaused]);

    // Get density color
    const getDensityColor = (density: number) => {
        if (density > 70) return 'text-red-400';
        if (density > 40) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className={`relative bg-[#0a0a0a] overflow-hidden ${className}`} style={{ minHeight: '300px' }}>
            {/* Camera Frame Simulation - Dark background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1520] to-[#050a10]">
                {/* Subtle grid overlay */}
                <div 
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />
            </div>

            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                    isConnected ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                    <WifiOff className="w-3 h-3" />
                    LOW BANDWIDTH
                </div>
                {isConnected && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-green-400 font-bold">LIVE</span>
                    </div>
                )}
            </div>

            {/* Stats Overlay */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1729]/90 rounded-lg border border-cyan-900/30">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">{data.people.length}</span>
                    <span className="text-[10px] text-gray-500">detected</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f1729]/90 rounded-lg border border-cyan-900/30">
                    <Activity className={`w-4 h-4 ${getDensityColor(data.density)}`} />
                    <span className={`text-sm font-bold ${getDensityColor(data.density)}`}>{data.density}%</span>
                </div>
            </div>

            {/* People Dots - Using absolute positioning with percentage */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {data.people.map((person) => (
                    <div
                        key={person.id}
                        className="absolute flex items-center justify-center"
                        style={{
                            left: `${person.x}%`,
                            top: `${person.y}%`,
                            width: '0',
                            height: '0'
                        }}
                    >
                        {/* Outer pulse ring */}
                        <div 
                            className="absolute w-12 h-12 rounded-full bg-cyan-400/20 animate-ping"
                            style={{ animationDuration: '1.5s' }}
                        />
                        {/* Middle glow */}
                        <div className="absolute w-6 h-6 rounded-full bg-cyan-400/30 blur-[2px]" />
                        {/* Main dot */}
                        <div className="absolute w-3 h-3 rounded-full bg-cyan-400 border border-cyan-200 shadow-[0_0_10px_rgba(34,211,238,1)]" />
                        {/* Center highlight */}
                        <div className="absolute w-1 h-1 rounded-full bg-white" />
                    </div>
                ))}
            </div>

            {/* Corner Frame Markers */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl z-10"></div>
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr z-10"></div>
            <div className="absolute bottom-12 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl z-10"></div>
            <div className="absolute bottom-12 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br z-10"></div>

            {/* Bottom Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black/70 backdrop-blur-sm border-t border-cyan-900/30 flex justify-between items-center z-30">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-cyan-500/70 font-mono">CAM-01</span>
                    <span className="text-[10px] text-gray-500">|</span>
                    <span className="text-[10px] text-gray-400">
                        {data.people.length} {data.people.length === 1 ? 'person' : 'people'} in frame
                    </span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                    {new Date(data.timestamp).toLocaleTimeString()}
                </div>
            </div>

            {/* Paused Overlay */}
            {isPaused && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-40">
                    <div className="text-amber-400 font-bold tracking-wider text-lg border border-amber-500/30 px-6 py-2 rounded-lg bg-amber-500/10">
                        PAUSED
                    </div>
                </div>
            )}
        </div>
    );
}