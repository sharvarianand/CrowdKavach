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
    BarChart3,
    FileText,
    Settings,
    Wifi,
    WifiOff,
    Eye,
    EyeOff,
    Monitor,
    Gauge,
    Save,
    RotateCcw,
    Check,
    Info,
    Video,
    Plus,
    Trash2,
    Edit2,
    X,
    RefreshCw
} from 'lucide-react';
import EmergencyButton from './EmergencyButton';
import { AppUser, Camera } from '@/lib/types';

interface SettingsData {
    lowBandwidthMode: boolean;
    privacyMaskingEnabled: boolean;
    autoRefreshInterval: number;
    showDensityOverlay: boolean;
    alertSoundEnabled: boolean;
    droidCamUrl?: string;
}

interface NewCameraForm {
    id: string;
    name: string;
    url: string;
    zone: string;
}

const defaultSettings: SettingsData = {
    lowBandwidthMode: false,
    privacyMaskingEnabled: false,
    autoRefreshInterval: 2000,
    showDensityOverlay: true,
    alertSoundEnabled: true,
    droidCamUrl: ''
};

const defaultNewCamera: NewCameraForm = {
    id: '',
    name: '',
    url: '',
    zone: 'Main Plaza'
};

const zones = ['Main Plaza', 'Entry Gate', 'Exit Gate', 'Stage Area', 'Food Court', 'Parking', 'VIP Area'];

export default function SettingsPage({ user }: { user?: AppUser }) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [showAddCamera, setShowAddCamera] = useState(false);
    const [newCamera, setNewCamera] = useState<NewCameraForm>(defaultNewCamera);
    const [editingCameraId, setEditingCameraId] = useState<string | null>(null);
    const [cameraLoading, setCameraLoading] = useState(false);

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';

    // Load settings from localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('crowdkavach_settings');
        if (savedSettings) {
            try {
                setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
            } catch (_e) {
                console.error('Failed to parse settings');
            }
        }

        // Fetch cameras from backend
        fetchCameras();
    }, []);

    // Fetch cameras
    const fetchCameras = async () => {
        try {
            const response = await fetch(`${baseUrl}/cameras`);
            if (response.ok) {
                const data = await response.json();
                setCameras(data.cameras || []);
            }
        } catch (err) {
            console.error('Failed to fetch cameras:', err);
        }
    };

    // Update time
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
        setSaved(false);
    };

    const saveSettings = async () => {
        localStorage.setItem('crowdkavach_settings', JSON.stringify(settings));
        setSaved(true);
        setHasChanges(false);
        setTimeout(() => setSaved(false), 3000);
    };

    // Camera management functions
    const addCamera = async () => {
        if (!newCamera.id || !newCamera.name || !newCamera.url) {
            alert('Please fill in all required fields');
            return;
        }

        setCameraLoading(true);
        try {
            const response = await fetch(`${baseUrl}/cameras`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newCamera.id,
                    name: newCamera.name,
                    url: newCamera.url,
                    zone: newCamera.zone,
                    enabled: true
                })
            });

            if (response.ok) {
                await fetchCameras();
                setNewCamera(defaultNewCamera);
                setShowAddCamera(false);
            } else {
                const error = await response.json();
                alert(error.detail || 'Failed to add camera');
            }
        } catch (err) {
            console.error('Failed to add camera:', err);
            alert('Failed to add camera');
        }
        setCameraLoading(false);
    };

    const updateCamera = async (cameraId: string, updates: Partial<Camera>) => {
        setCameraLoading(true);
        try {
            const response = await fetch(`${baseUrl}/cameras/${cameraId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                await fetchCameras();
                setEditingCameraId(null);
            }
        } catch (err) {
            console.error('Failed to update camera:', err);
        }
        setCameraLoading(false);
    };

    const deleteCamera = async (cameraId: string) => {
        if (!confirm('Are you sure you want to delete this camera?')) return;

        setCameraLoading(true);
        try {
            const response = await fetch(`${baseUrl}/cameras/${cameraId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchCameras();
            }
        } catch (err) {
            console.error('Failed to delete camera:', err);
        }
        setCameraLoading(false);
    };

    const toggleCameraEnabled = async (camera: Camera) => {
        await updateCamera(camera.id, { enabled: !camera.enabled });
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        setHasChanges(true);
        setSaved(false);
    };

    return (
        <div className="min-h-screen bg-[#050b14] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
            {/* Emergency Button */}
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
                    <Link href="/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Reports</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 rounded-lg text-cyan-400 bg-cyan-500/10 border border-cyan-500/30">
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                    </Link>
                </nav>

                <div className="flex items-center gap-6">
                    <div className="text-xs font-mono text-cyan-300/70 tracking-widest">
                        {currentDate} - {currentTime}
                    </div>

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
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Settings className="w-7 h-7 text-cyan-400" />
                                System Settings
                            </h2>
                            <p className="text-gray-500 mt-1">Configure your CrowdKavach monitoring preferences</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={resetSettings}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/30 hover:bg-gray-700 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                            <button
                                onClick={saveSettings}
                                disabled={!hasChanges}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${hasChanges
                                    ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                                    : 'bg-cyan-500/30 text-cyan-400/50 cursor-not-allowed'
                                    }`}
                            >
                                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {saved ? 'Saved!' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Settings Sections */}
                    <div className="space-y-6">
                        {/* Camera Configuration */}
                        <div className="bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Video className="w-5 h-5 text-red-400" />
                                    Camera Configuration
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={fetchCameras}
                                        className="p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                        title="Refresh cameras"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${cameraLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setShowAddCamera(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Camera
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Manage video source inputs for crowd monitoring</p>

                            {/* Add Camera Form */}
                            {showAddCamera && (
                                <div className="mb-6 p-4 bg-[#0f1729] rounded-lg border border-cyan-500/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-white">Add New Camera</h4>
                                        <button
                                            onClick={() => {
                                                setShowAddCamera(false);
                                                setNewCamera(defaultNewCamera);
                                            }}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Camera ID *</label>
                                            <input
                                                type="text"
                                                value={newCamera.id}
                                                onChange={(e) => setNewCamera({ ...newCamera, id: e.target.value })}
                                                placeholder="cam-1"
                                                className="w-full bg-[#0a101f] border border-cyan-900/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Camera Name *</label>
                                            <input
                                                type="text"
                                                value={newCamera.name}
                                                onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                                                placeholder="Main Plaza Camera"
                                                className="w-full bg-[#0a101f] border border-cyan-900/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-400 mb-1 block">Stream URL *</label>
                                            <input
                                                type="text"
                                                value={newCamera.url}
                                                onChange={(e) => setNewCamera({ ...newCamera, url: e.target.value })}
                                                placeholder="http://192.168.1.100:4747/video"
                                                className="w-full bg-[#0a101f] border border-cyan-900/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 mb-1 block">Zone</label>
                                            <select
                                                value={newCamera.zone}
                                                onChange={(e) => setNewCamera({ ...newCamera, zone: e.target.value })}
                                                className="w-full bg-[#0a101f] border border-cyan-900/30 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                                            >
                                                {zones.map(zone => (
                                                    <option key={zone} value={zone}>{zone}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={addCamera}
                                                disabled={cameraLoading}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
                                            >
                                                {cameraLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Add Camera
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Camera List */}
                            <div className="space-y-3">
                                {cameras.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No cameras configured</p>
                                        <p className="text-sm">Click &quot;Add Camera&quot; to get started</p>
                                    </div>
                                ) : (
                                    cameras.map((camera) => (
                                        <div
                                            key={camera.id}
                                            className={`flex items-center gap-4 p-4 bg-[#0f1729] rounded-lg border transition-colors ${camera.enabled ? 'border-cyan-900/20' : 'border-gray-700/30 opacity-60'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${camera.status === 'online' ? 'bg-emerald-500' : camera.status === 'offline' ? 'bg-red-500' : 'bg-gray-500'
                                                }`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-white">{camera.name}</span>
                                                    <span className="text-xs text-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 rounded">{camera.zone}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${camera.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                        }`}>
                                                        {camera.status || 'unknown'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-1">{camera.url}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleCameraEnabled(camera)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors ${camera.enabled ? 'bg-cyan-500' : 'bg-gray-600'
                                                        }`}
                                                    title={camera.enabled ? 'Disable camera' : 'Enable camera'}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${camera.enabled ? 'translate-x-5' : 'translate-x-0.5'
                                                        }`}></div>
                                                </button>
                                                <button
                                                    onClick={() => deleteCamera(camera.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete camera"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Network & Performance */}
                        <div className="bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-cyan-400" />
                                Network & Performance
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Optimize for your network conditions</p>

                            {/* Low Bandwidth Mode */}
                            <div className="flex items-start justify-between p-4 bg-[#0f1729] rounded-lg border border-cyan-900/20 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${settings.lowBandwidthMode ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-cyan-900/30 border border-cyan-500/20'
                                        }`}>
                                        {settings.lowBandwidthMode ? (
                                            <WifiOff className="w-6 h-6 text-amber-400" />
                                        ) : (
                                            <Wifi className="w-6 h-6 text-cyan-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">Low Bandwidth Mode</h4>
                                        <p className="text-sm text-gray-400 mt-1 max-w-md">
                                            Disable video streams and show only coordinate data on a map. Reduces bandwidth by ~100x.
                                            Ideal for areas with poor 5G/LTE connectivity.
                                        </p>
                                        {settings.lowBandwidthMode && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                                                <Info className="w-3 h-3" />
                                                Video feeds will be replaced with dot visualization
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateSetting('lowBandwidthMode', !settings.lowBandwidthMode)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.lowBandwidthMode ? 'bg-amber-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.lowBandwidthMode ? 'translate-x-8' : 'translate-x-1'
                                        }`}></div>
                                </button>
                            </div>

                            {/* Auto Refresh Interval */}
                            <div className="flex items-center justify-between p-4 bg-[#0f1729] rounded-lg border border-cyan-900/20">
                                <div>
                                    <h4 className="font-medium text-white">Data Refresh Interval</h4>
                                    <p className="text-sm text-gray-400 mt-1">How often to fetch analytics data</p>
                                </div>
                                <select
                                    value={settings.autoRefreshInterval}
                                    onChange={(e) => updateSetting('autoRefreshInterval', parseInt(e.target.value))}
                                    className="bg-[#0a101f] border border-cyan-900/30 rounded-lg px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50"
                                >
                                    <option value={1000}>1 second</option>
                                    <option value={2000}>2 seconds</option>
                                    <option value={5000}>5 seconds</option>
                                    <option value={10000}>10 seconds</option>
                                    <option value={30000}>30 seconds</option>
                                </select>
                            </div>
                        </div>

                        {/* Privacy & Security */}
                        <div className="bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-purple-400" />
                                Privacy & Security
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">GDPR compliance and privacy controls</p>

                            {/* Privacy Masking */}
                            <div className="flex items-start justify-between p-4 bg-[#0f1729] rounded-lg border border-cyan-900/20 mb-4">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${settings.privacyMaskingEnabled ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-cyan-900/30 border border-cyan-500/20'
                                        }`}>
                                        {settings.privacyMaskingEnabled ? (
                                            <EyeOff className="w-6 h-6 text-purple-400" />
                                        ) : (
                                            <Eye className="w-6 h-6 text-cyan-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">Privacy Masking (Face Blur)</h4>
                                        <p className="text-sm text-gray-400 mt-1 max-w-md">
                                            Use AI to automatically blur faces in real-time video feeds.
                                            Ensures GDPR/Privacy compliance for public monitoring.
                                        </p>
                                        {settings.privacyMaskingEnabled && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
                                                <Info className="w-3 h-3" />
                                                Face detection is active on all video streams
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateSetting('privacyMaskingEnabled', !settings.privacyMaskingEnabled)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.privacyMaskingEnabled ? 'bg-purple-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.privacyMaskingEnabled ? 'translate-x-8' : 'translate-x-1'
                                        }`}></div>
                                </button>
                            </div>
                        </div>

                        {/* Display Settings */}
                        <div className="bg-[#0a101f] rounded-xl p-6 border border-cyan-900/30">
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-emerald-400" />
                                Display Settings
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Customize your dashboard appearance</p>

                            {/* Density Overlay */}
                            <div className="flex items-center justify-between p-4 bg-[#0f1729] rounded-lg border border-cyan-900/20 mb-4">
                                <div>
                                    <h4 className="font-medium text-white">Show Density Overlay</h4>
                                    <p className="text-sm text-gray-400 mt-1">Display crowd density indicators on video feeds</p>
                                </div>
                                <button
                                    onClick={() => updateSetting('showDensityOverlay', !settings.showDensityOverlay)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.showDensityOverlay ? 'bg-emerald-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.showDensityOverlay ? 'translate-x-8' : 'translate-x-1'
                                        }`}></div>
                                </button>
                            </div>

                            {/* Alert Sounds */}
                            <div className="flex items-center justify-between p-4 bg-[#0f1729] rounded-lg border border-cyan-900/20">
                                <div>
                                    <h4 className="font-medium text-white">Alert Sounds</h4>
                                    <p className="text-sm text-gray-400 mt-1">Play audio notifications for critical alerts</p>
                                </div>
                                <button
                                    onClick={() => updateSetting('alertSoundEnabled', !settings.alertSoundEnabled)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.alertSoundEnabled ? 'bg-emerald-500' : 'bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.alertSoundEnabled ? 'translate-x-8' : 'translate-x-1'
                                        }`}></div>
                                </button>
                            </div>
                        </div>

                        {/* Bandwidth Comparison */}
                        {settings.lowBandwidthMode && (
                            <div className="bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl p-6 border border-amber-500/30">
                                <h3 className="text-lg font-bold text-amber-400 mb-4">Low Bandwidth Mode Active</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-[#0f1729]/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-1">Normal Mode</div>
                                        <div className="text-2xl font-bold text-red-400">~2-5 MB/s</div>
                                        <div className="text-xs text-gray-500">MJPEG video streams</div>
                                    </div>
                                    <div className="bg-[#0f1729]/50 rounded-lg p-4">
                                        <div className="text-sm text-gray-400 mb-1">Low Bandwidth</div>
                                        <div className="text-2xl font-bold text-emerald-400">~10-50 KB/s</div>
                                        <div className="text-xs text-gray-500">Coordinate data only</div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-4">
                                    Video feeds will be replaced with a real-time dot map showing person positions.
                                    All analytics and alerts remain fully functional.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="h-12 border-t border-cyan-900/30 bg-[#0a101f] px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-500 tracking-wider">SETTINGS</span>
                </div>
                <div className="text-xs text-gray-500">
                    {hasChanges ? 'Unsaved changes' : 'All changes saved'}
                </div>
            </footer>
        </div>
    );
}
