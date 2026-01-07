'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Download,
    Filter,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Printer,
    Search,
    ChevronDown,
    ChevronUp,
    MapPin,
    Users,
    Camera,
    FileWarning,
    X
} from 'lucide-react';
import EmergencyButton from './EmergencyButton';
import { AppUser } from '@/lib/types';

interface Incident {
    id: string;
    timestamp: Date;
    type: 'critical' | 'warning' | 'info';
    category: string;
    title: string;
    description: string;
    zone: string;
    status: 'resolved' | 'pending' | 'investigating';
    responders: string[];
    duration: number; // in minutes
    crowdCount: number;
    cameraId: string;
    actions: string[];
}

interface DailyReport {
    date: Date;
    totalIncidents: number;
    critical: number;
    warnings: number;
    info: number;
    avgResponseTime: number;
    peakCrowdDensity: number;
    totalVisitors: number;
}

export default function ReportsPage({ user }: { user?: AppUser }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'resolved' | 'pending' | 'investigating'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
    const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidentToPrint, setIncidentToPrint] = useState<Incident | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

    // Update time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Generate mock incidents
    useEffect(() => {
        const categories = ['Overcrowding', 'Stampede Risk', 'Medical Emergency', 'Security Breach', 'Fire Hazard', 'Unattended Object', 'Blocked Exit', 'VIP Incident'];
        const zones = ['Main Plaza', 'Entry Gate', 'Exit Gate', 'Food Court', 'Stage Area', 'Parking', 'VIP Area'];
        const responderNames = ['Officer Singh', 'Officer Patel', 'Officer Kumar', 'Officer Sharma', 'Medical Team A', 'Security Team B'];
        const statuses: Array<'resolved' | 'pending' | 'investigating'> = ['resolved', 'pending', 'investigating'];
        const types: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info'];

        const generateIncidents = (): Incident[] => {
            return Array.from({ length: 15 }, (_, i) => {
                const type = types[Math.floor(Math.random() * types.length)];
                const category = categories[Math.floor(Math.random() * categories.length)];
                const zone = zones[Math.floor(Math.random() * zones.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const hour = Math.floor(Math.random() * 14) + 6;
                const minute = Math.floor(Math.random() * 60);

                return {
                    id: `INC-${String(i + 1).padStart(4, '0')}`,
                    timestamp: new Date(2026, 0, 4, hour, minute),
                    type,
                    category,
                    title: `${category} in ${zone}`,
                    description: `${type === 'critical' ? 'URGENT: ' : ''}${category} detected in ${zone}. ${type === 'critical'
                        ? 'Immediate action required. Crowd density exceeded safe threshold.'
                        : type === 'warning'
                            ? 'Situation requires monitoring. Staff alerted.'
                            : 'Routine update. No immediate action needed.'
                        }`,
                    zone,
                    status,
                    responders: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
                        responderNames[Math.floor(Math.random() * responderNames.length)]
                    ),
                    duration: Math.floor(Math.random() * 45) + 5,
                    crowdCount: Math.floor(Math.random() * 200) + 50,
                    cameraId: `CAM-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
                    actions: [
                        'Alert dispatched to security',
                        status === 'resolved' ? 'Situation resolved' : 'Monitoring in progress',
                        type === 'critical' ? 'Emergency protocol activated' : 'Standard protocol followed'
                    ]
                };
            }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        };

        setIncidents(generateIncidents());
        setDailyReport({
            date: new Date(),
            totalIncidents: 15,
            critical: 3,
            warnings: 7,
            info: 5,
            avgResponseTime: 4.5,
            peakCrowdDensity: 78,
            totalVisitors: 12450
        });
    }, [selectedDate]);

    const filteredIncidents = incidents.filter(incident => {
        if (filterType !== 'all' && incident.type !== filterType) return false;
        if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
        if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !incident.zone.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !incident.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
            case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
            default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'text-green-400 bg-green-500/20';
            case 'pending': return 'text-yellow-400 bg-yellow-500/20';
            default: return 'text-purple-400 bg-purple-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'resolved': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return <Eye className="w-4 h-4" />;
        }
    };

    const handleExportReport = () => {
        window.print();
    };

    const handlePrintIncident = (incident: Incident) => {
        setIncidentToPrint(incident);
        setShowIncidentModal(true);
    };

    const printIncidentReport = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            {/* Emergency Button - Hidden in print */}
            <div className="no-print">
                <EmergencyButton />
            </div>

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
                    <Link href="/analysis" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-sm">Analysis</span>
                    </Link>
                    <Link href="/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
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
                {/* Header with Actions */}
                <div className="flex items-center justify-between mb-6 no-print">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-7 h-7 text-cyan-400" />
                        Incident Reports
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportReport}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Print Header - Only visible when printing */}
                <div className="hidden print:block print:mb-8 print:border-b-2 print:border-gray-300 print:pb-6 print:text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Shield className="w-10 h-10 text-gray-800" />
                        <h1 className="text-2xl font-bold text-black">CROWDKAVACH</h1>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700">DAILY INCIDENT REPORT</h2>
                    <p className="text-sm text-gray-500 mt-2">Report Date: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Daily Summary */}
                    <div className="col-span-12 bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30 print:bg-white print:border-gray-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-400" />
                                Daily Summary
                            </h3>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-[#0f1729] border border-cyan-900/30 rounded-lg px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>
                        {dailyReport && (
                            <div className="grid grid-cols-7 gap-4">
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-cyan-900/20">
                                    <div className="text-2xl font-bold text-white">{dailyReport.totalIncidents}</div>
                                    <div className="text-xs text-gray-500">Total Incidents</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-red-500/20">
                                    <div className="text-2xl font-bold text-red-400">{dailyReport.critical}</div>
                                    <div className="text-xs text-gray-500">Critical</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-yellow-500/20">
                                    <div className="text-2xl font-bold text-yellow-400">{dailyReport.warnings}</div>
                                    <div className="text-xs text-gray-500">Warnings</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-blue-500/20">
                                    <div className="text-2xl font-bold text-blue-400">{dailyReport.info}</div>
                                    <div className="text-xs text-gray-500">Info</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-cyan-900/20">
                                    <div className="text-2xl font-bold text-cyan-400">{dailyReport.avgResponseTime}m</div>
                                    <div className="text-xs text-gray-500">Avg Response</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-cyan-900/20">
                                    <div className="text-2xl font-bold text-purple-400">{dailyReport.peakCrowdDensity}%</div>
                                    <div className="text-xs text-gray-500">Peak Density</div>
                                </div>
                                <div className="bg-[#0f1729] rounded-lg p-4 border border-cyan-900/20">
                                    <div className="text-2xl font-bold text-emerald-400">{dailyReport.totalVisitors.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Total Visitors</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="col-span-12 flex items-center gap-4 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search incidents..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#0a101f] border border-cyan-900/30 rounded-lg pl-10 pr-4 py-2 text-sm text-cyan-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as 'all' | 'critical' | 'warning' | 'info')}
                                className="bg-[#0a101f] border border-cyan-900/30 rounded-lg px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                            >
                                <option value="all">All Types</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'resolved' | 'pending' | 'investigating')}
                            className="bg-[#0a101f] border border-cyan-900/30 rounded-lg px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                        >
                            <option value="all">All Statuses</option>
                            <option value="resolved">Resolved</option>
                            <option value="pending">Pending</option>
                            <option value="investigating">Investigating</option>
                        </select>

                        <span className="text-sm text-gray-500">
                            Showing {filteredIncidents.length} of {incidents.length} incidents
                        </span>
                    </div>

                    {/* Incidents List */}
                    <div className="col-span-12 space-y-3">
                        {filteredIncidents.map((incident) => (
                            <div
                                key={incident.id}
                                className={`bg-[#0a101f] rounded-xl border ${incident.type === 'critical' ? 'border-red-500/30' :
                                    incident.type === 'warning' ? 'border-yellow-500/30' : 'border-cyan-900/30'
                                    } overflow-hidden`}
                            >
                                {/* Incident Header */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-cyan-500/5 transition-colors"
                                    onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(incident.type)}`}>
                                                {incident.type.toUpperCase()}
                                            </span>
                                            <span className="text-sm font-mono text-gray-500">{incident.id}</span>
                                            <span className="text-sm font-medium text-white">{incident.title}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                                                {getStatusIcon(incident.status)}
                                                {incident.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {incident.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {expandedIncident === incident.id ? (
                                                <ChevronUp className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedIncident === incident.id && (
                                    <div className="px-4 pb-4 border-t border-cyan-900/20">
                                        <div className="grid grid-cols-4 gap-6 mt-4">
                                            {/* Description */}
                                            <div className="col-span-2">
                                                <h4 className="text-xs font-medium text-gray-500 mb-2">DESCRIPTION</h4>
                                                <p className="text-sm text-gray-300">{incident.description}</p>

                                                <h4 className="text-xs font-medium text-gray-500 mt-4 mb-2">ACTIONS TAKEN</h4>
                                                <ul className="space-y-1">
                                                    {incident.actions.map((action, i) => (
                                                        <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                                                            <CheckCircle className="w-3 h-3 text-green-400" />
                                                            {action}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Details */}
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-500 mb-2">INCIDENT DETAILS</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-gray-400">Zone:</span>
                                                        <span className="text-white">{incident.zone}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Camera className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-gray-400">Camera:</span>
                                                        <span className="text-white">{incident.cameraId}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-gray-400">Crowd:</span>
                                                        <span className="text-white">{incident.crowdCount} people</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-4 h-4 text-cyan-400" />
                                                        <span className="text-gray-400">Duration:</span>
                                                        <span className="text-white">{incident.duration} min</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Responders */}
                                            <div>
                                                <h4 className="text-xs font-medium text-gray-500 mb-2">RESPONDERS</h4>
                                                <div className="space-y-2">
                                                    {incident.responders.map((responder, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-500/30">
                                                                <User className="w-3 h-3 text-cyan-400" />
                                                            </div>
                                                            <span className="text-sm text-gray-300">{responder}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrintIncident(incident);
                                                    }}
                                                    className="mt-4 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Print Report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredIncidents.length === 0 && (
                            <div className="bg-[#0a101f] rounded-xl p-12 border border-cyan-900/30 text-center">
                                <FileWarning className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-400">No incidents found</h3>
                                <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search query</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Individual Incident Report Modal */}
            {showIncidentModal && incidentToPrint && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] print:bg-white print:static">
                    <div className="bg-white text-black rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto print:max-w-none print:max-h-none print:overflow-visible print:mx-0 print:rounded-none" ref={printRef}>
                        {/* Modal Header - Hidden in print */}
                        <div className="flex items-center justify-between p-4 border-b print:hidden">
                            <h3 className="text-lg font-bold">Incident Report - {incidentToPrint.id}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={printIncidentReport}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                                <button
                                    onClick={() => {
                                        setShowIncidentModal(false);
                                        setIncidentToPrint(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Printable Report Content */}
                        <div className="p-8 print:p-4" id="incident-report">
                            {/* Report Header */}
                            <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <Shield className="w-10 h-10 text-cyan-600 print:text-gray-800" />
                                    <h1 className="text-2xl font-bold">CROWDKAVACH</h1>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-700">INCIDENT REPORT</h2>
                                <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleString()}</p>
                            </div>

                            {/* Incident Summary */}
                            <div className="mb-6">
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg print:bg-gray-100">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Incident ID</span>
                                        <p className="font-bold text-lg">{incidentToPrint.id}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Date & Time</span>
                                        <p className="font-medium">{incidentToPrint.timestamp.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Type</span>
                                        <p className={`font-bold uppercase ${incidentToPrint.type === 'critical' ? 'text-red-600' :
                                            incidentToPrint.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                                            }`}>{incidentToPrint.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase">Status</span>
                                        <p className={`font-bold uppercase ${incidentToPrint.status === 'resolved' ? 'text-green-600' :
                                            incidentToPrint.status === 'pending' ? 'text-yellow-600' : 'text-purple-600'
                                            }`}>{incidentToPrint.status}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Incident Title */}
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-500 uppercase mb-1">Incident Title</h3>
                                <p className="text-lg font-semibold">{incidentToPrint.title}</p>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-500 uppercase mb-1">Description</h3>
                                <p className="text-gray-700 leading-relaxed">{incidentToPrint.description}</p>
                            </div>

                            {/* Location Details */}
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-500 uppercase mb-2">Location Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Zone:</span>
                                        <span className="font-medium">{incidentToPrint.zone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Camera:</span>
                                        <span className="font-medium">{incidentToPrint.cameraId}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Crowd Count:</span>
                                        <span className="font-medium">{incidentToPrint.crowdCount} people</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{incidentToPrint.duration} minutes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Responders */}
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-500 uppercase mb-2">Assigned Responders</h3>
                                <div className="flex flex-wrap gap-2">
                                    {incidentToPrint.responders.map((responder, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                                            {responder}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions Taken */}
                            <div className="mb-6">
                                <h3 className="text-xs text-gray-500 uppercase mb-2">Actions Taken</h3>
                                <ul className="space-y-2">
                                    {incidentToPrint.actions.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <div>
                                        <p>Report generated by: {user?.firstName || 'Admin'} {user?.lastName || ''}</p>
                                        <p>CrowdKavach - Real-Time Crowd Monitoring System</p>
                                    </div>
                                    <div className="text-right">
                                        <p>Page 1 of 1</p>
                                        <p>Confidential</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    /* Hide everything except report content */
                    body * {
                        visibility: hidden;
                    }
                    
                    /* Hide emergency button completely */
                    [class*="emergency"], 
                    [class*="Emergency"],
                    button[class*="fixed"][class*="bottom"],
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Show only the modal content when printing individual report */
                    #incident-report,
                    #incident-report * {
                        visibility: visible;
                    }
                    
                    /* If no modal, show main content */
                    main,
                    main * {
                        visibility: visible;
                    }
                    
                    /* Position the content properly */
                    #incident-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    
                    /* White background for print */
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    /* Hide navigation, header, footer when printing */
                    header, footer, nav {
                        display: none !important;
                    }
                    
                    /* Hide URL/link from print */
                    @page {
                        margin: 1cm;
                    }
                    
                    /* Remove URL display in print */
                    a[href]:after {
                        content: none !important;
                    }
                    
                    /* Ensure proper page breaks */
                    .page-break {
                        page-break-before: always;
                    }
                    
                    /* Style adjustments for print */
                    .print\:block {
                        display: block !important;
                        visibility: visible !important;
                    }
                    
                    .print\:bg-white {
                        background-color: white !important;
                    }
                    
                    .print\:border-gray-300 {
                        border-color: #d1d5db !important;
                    }
                    
                    .print\:text-black {
                        color: black !important;
                    }
                }
            `}</style>

            {/* Footer */}
            <footer className="h-12 border-t border-cyan-900/30 bg-[#0a101f] px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">REPORTING SYSTEM ACTIVE</span>
                </div>
                <div className="text-xs text-gray-500">
                    Last updated: {currentTime}
                </div>
            </footer>
        </div>
    );
}
