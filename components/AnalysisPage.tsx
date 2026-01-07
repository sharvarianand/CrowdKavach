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
    FileText,
    TrendingUp,
    TrendingDown,
    Users,
    Clock,
    AlertTriangle,
    Activity,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import EmergencyButton from './EmergencyButton';
import { AppUser } from '@/lib/types';

interface AnalyticsData {
    totalVisitors: number;
    peakHour: string;
    avgDwellTime: number;
    crowdDensity: number;
    incidentCount: number;
    safetyScore: number;
}

interface TrendData {
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
}

interface HourlyData {
    hour: string;
    count: number;
}

interface ZoneAnalysis {
    zone: string;
    avgOccupancy: number;
    peakOccupancy: number;
    riskLevel: 'low' | 'medium' | 'high';
    incidents: number;
}

export default function AnalysisPage({ user }: { user?: AppUser }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('today');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        totalVisitors: 0,
        peakHour: '14:00',
        avgDwellTime: 0,
        crowdDensity: 0,
        incidentCount: 0,
        safetyScore: 0
    });
    const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
    const [zoneAnalysis, setZoneAnalysis] = useState<ZoneAnalysis[]>([]);
    const [trends, setTrends] = useState<TrendData[]>([]);

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

    // Update time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Generate analytics data
    useEffect(() => {
        const generateData = () => {
            // Main analytics
            setAnalyticsData({
                totalVisitors: Math.floor(Math.random() * 5000) + 8000,
                peakHour: `${Math.floor(Math.random() * 12) + 10}:00`,
                avgDwellTime: Math.floor(Math.random() * 30) + 15,
                crowdDensity: Math.floor(Math.random() * 40) + 40,
                incidentCount: Math.floor(Math.random() * 10) + 2,
                safetyScore: Math.floor(Math.random() * 15) + 80
            });

            // Hourly data
            const hours = [];
            for (let i = 6; i <= 22; i++) {
                hours.push({
                    hour: `${i.toString().padStart(2, '0')}:00`,
                    count: Math.floor(Math.random() * 500) + 200
                });
            }
            setHourlyData(hours);

            // Zone analysis
            const zones = ['Main Plaza', 'Entry Gate', 'Exit Gate', 'Food Court', 'Stage Area', 'Parking', 'VIP Area'];
            setZoneAnalysis(zones.map(zone => ({
                zone,
                avgOccupancy: Math.floor(Math.random() * 60) + 20,
                peakOccupancy: Math.floor(Math.random() * 40) + 60,
                riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
                incidents: Math.floor(Math.random() * 5)
            })));

            // Trends
            setTrends([
                { label: 'Visitor Count', value: 12450, change: 12.5, trend: 'up' },
                { label: 'Avg Dwell Time', value: 24, change: -5.2, trend: 'down' },
                { label: 'Peak Density', value: 78, change: 8.3, trend: 'up' },
                { label: 'Incidents', value: 7, change: -15.0, trend: 'down' }
            ]);
        };

        generateData();
        const interval = setInterval(generateData, 30000);
        return () => clearInterval(interval);
    }, [selectedTimeRange]);

    const maxHourlyCount = Math.max(...hourlyData.map(h => h.count), 1);

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'high': return 'text-red-400 bg-red-500/20';
            case 'medium': return 'text-yellow-400 bg-yellow-500/20';
            default: return 'text-green-400 bg-green-500/20';
        }
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
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-sm">Dashboard</span>
                    </Link>
                    <Link href="/heatmap" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <Map className="w-4 h-4" />
                        <span className="text-sm">Heat Map</span>
                    </Link>
                    <Link href="/analysis" className="flex items-center gap-2 px-4 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
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
            <main className="flex-1 p-6 overflow-auto">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-cyan-400" />
                        Crowd Analytics & Insights
                    </h2>
                    <div className="flex items-center gap-2 bg-[#0a101f] rounded-lg p-1 border border-cyan-900/30">
                        {(['today', 'week', 'month'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setSelectedTimeRange(range)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${selectedTimeRange === range
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'text-gray-400 hover:text-cyan-400'
                                    }`}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-6 gap-4 mb-6">
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> 12.5%
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-white">{analyticsData.totalVisitors.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Total Visitors</div>
                    </div>
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            <span className="text-xs text-gray-400">{analyticsData.peakHour}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{analyticsData.avgDwellTime}m</div>
                        <div className="text-xs text-gray-500">Avg Dwell Time</div>
                    </div>
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <Activity className="w-5 h-5 text-yellow-400" />
                            <span className="text-xs text-yellow-400">{analyticsData.crowdDensity}%</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{analyticsData.crowdDensity}%</div>
                        <div className="text-xs text-gray-500">Crowd Density</div>
                    </div>
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            <span className="text-xs text-green-400 flex items-center gap-1">
                                <ArrowDownRight className="w-3 h-3" /> -15%
                            </span>
                        </div>
                        <div className="text-2xl font-bold text-white">{analyticsData.incidentCount}</div>
                        <div className="text-xs text-gray-500">Incidents Today</div>
                    </div>
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">{analyticsData.safetyScore}%</div>
                        <div className="text-xs text-gray-500">Safety Score</div>
                    </div>
                    <div className="bg-[#0a101f] rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{analyticsData.peakHour}</div>
                        <div className="text-xs text-gray-500">Peak Hour</div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Hourly Footfall Chart */}
                    <div className="col-span-8 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-cyan-400" />
                            Hourly Footfall Analysis
                        </h3>
                        <div className="flex items-end gap-2 h-64">
                            {hourlyData.map((data, index) => (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm transition-all duration-500 hover:from-cyan-500 hover:to-cyan-300"
                                        style={{ height: `${(data.count / maxHourlyCount) * 100}%` }}
                                        title={`${data.count} visitors`}
                                    ></div>
                                    <span className="text-[10px] text-gray-500 -rotate-45 origin-center">
                                        {data.hour}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                            <span>Peak: {hourlyData.reduce((max, d) => d.count > max.count ? d : max, hourlyData[0])?.hour || 'N/A'}</span>
                            <span>Total: {hourlyData.reduce((sum, d) => sum + d.count, 0).toLocaleString()} visitors</span>
                        </div>
                    </div>

                    {/* Trends */}
                    <div className="col-span-4 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-400" />
                            Key Trends
                        </h3>
                        <div className="space-y-4">
                            {trends.map((trend, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-[#0f1729] rounded-lg border border-cyan-900/20">
                                    <div>
                                        <div className="text-sm text-gray-400">{trend.label}</div>
                                        <div className="text-xl font-bold text-white">{trend.value.toLocaleString()}</div>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm ${trend.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                        {trend.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {Math.abs(trend.change)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Zone Analysis */}
                    <div className="col-span-12 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Map className="w-5 h-5 text-emerald-400" />
                            Zone-wise Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-cyan-900/30">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Zone</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Avg Occupancy</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Peak Occupancy</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Risk Level</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Incidents</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Occupancy Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {zoneAnalysis.map((zone, index) => (
                                        <tr key={index} className="border-b border-cyan-900/20 hover:bg-cyan-500/5 transition-colors">
                                            <td className="py-3 px-4 text-sm font-medium text-white">{zone.zone}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-sm text-cyan-400">{zone.avgOccupancy}%</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-sm text-yellow-400">{zone.peakOccupancy}%</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(zone.riskLevel)}`}>
                                                    {zone.riskLevel.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`text-sm ${zone.incidents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                    {zone.incidents}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${zone.avgOccupancy > 70 ? 'bg-red-500' :
                                                            zone.avgOccupancy > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${zone.avgOccupancy}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Predictions */}
                    <div className="col-span-6 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            AI Predictions
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm font-medium text-yellow-400">Expected Peak in 2 hours</span>
                                </div>
                                <p className="text-xs text-gray-400">Based on historical data, crowd density is expected to reach 85% by 16:00. Consider deploying additional staff to Entry Gate and Main Plaza.</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-lg border border-cyan-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                                    <span className="text-sm font-medium text-cyan-400">Visitor Surge Predicted</span>
                                </div>
                                <p className="text-xs text-gray-400">Weather conditions favorable. Expected 15% increase in visitors compared to last week&apos;s average.</p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg border border-emerald-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm font-medium text-emerald-400">Optimal Staffing Recommendation</span>
                                </div>
                                <p className="text-xs text-gray-400">Based on current patterns, recommend 3 additional security personnel at Food Court during 12:00-14:00.</p>
                            </div>
                        </div>
                    </div>

                    {/* Anomaly Detection */}
                    <div className="col-span-6 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Anomaly Detection
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg border border-red-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-red-400">Unusual Gathering - Zone B</span>
                                    <span className="text-xs text-gray-500">12:34 PM</span>
                                </div>
                                <p className="text-xs text-gray-400">Detected 40% higher than normal crowd density in Zone B. Pattern suggests potential bottleneck near exit.</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">High Priority</span>
                                    <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">Auto-Alert Sent</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-yellow-400">Flow Disruption - Entry Gate</span>
                                    <span className="text-xs text-gray-500">11:15 AM</span>
                                </div>
                                <p className="text-xs text-gray-400">Entry rate dropped by 60% for 5 minutes. Possible obstruction or crowd hesitation detected.</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Medium Priority</span>
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Resolved</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-purple-400">Unusual Movement Pattern</span>
                                    <span className="text-xs text-gray-500">10:45 AM</span>
                                </div>
                                <p className="text-xs text-gray-400">Detected counter-flow movement in Main Plaza. 15 individuals moving against crowd direction.</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">Monitoring</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="h-12 border-t border-cyan-900/30 bg-[#0a101f] px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">ANALYTICS ENGINE ACTIVE</span>
                </div>
                <div className="text-xs text-gray-500">
                    Last updated: {currentTime}
                </div>
            </footer>
        </div>
    );
}
