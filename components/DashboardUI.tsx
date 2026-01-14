'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  Users, Activity, BarChart3, Settings, Bell,
  Camera, AlertTriangle, TrendingUp, Clock, Menu, X,
  Home, FileText, Map, LogOut, CheckCircle, AlertCircle,
  Sun, Moon, LucideProps
} from 'lucide-react';
import Logo from './Logo';
import CameraGrid from './CameraGrid';
import CameraSetupWizard from './CameraSetupWizard';
import { useTheme } from '@/lib/ThemeContext';

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}



interface Alert {
  id: string;
  msg: string;
  time: string;
  type: 'warning' | 'success' | 'error' | 'info';
}

interface DashboardUIProps {
  user?: User;
}

interface RawAlert {
  id: string;
  type: string;
  zone: string;
  msg?: string;
  timestamp: string;
}

interface GlobalAnalyticsData {
  total_visitors: number;
  current_count: number;
  peak_hour: string;
  peak_count: number;
  hourly_history: number[];
  active_cameras: number;
  recent_alerts: RawAlert[];
}

interface CameraConfig {
  id: string;
  name: string;
  url: string;
  zone: string;
  enabled: boolean;
  type?: 'live' | 'offline';
  capacity?: number;
}

export default function DashboardUI({ user }: DashboardUIProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Settings state
  interface SettingsData {
    lowBandwidthMode: boolean;
    privacyMaskingEnabled: boolean;
    autoRefreshInterval: number;
    showDensityOverlay: boolean;
    alertSoundEnabled: boolean;
  }

  const [settings, setSettings] = useState<SettingsData>({
    lowBandwidthMode: false,
    privacyMaskingEnabled: false,
    autoRefreshInterval: 2000,
    showDensityOverlay: true,
    alertSoundEnabled: true
  });

  const baseUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';

  // Helper: Get user initials
  function getUserInitials() {
    if (!user) return '';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || '';
  }

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
    { id: 'analysis', label: 'Analysis', href: '/analysis', icon: BarChart3 },
    { id: 'heatmap', label: 'Heat Map', href: '/heatmap', icon: Map },
    { id: 'reports', label: 'Reports', href: '/reports', icon: FileText },
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Live Stats & Analytics State
  const [globalData, setGlobalData] = useState<GlobalAnalyticsData>({
    total_visitors: 0,
    current_count: 0,
    peak_hour: 'N/A',
    peak_count: 0,
    hourly_history: Array(24).fill(0),
    active_cameras: 0,
    recent_alerts: []
  });

  // Derived stats for the UI
  const stats = [
    { icon: Users, label: 'Live Occupants', value: (globalData.current_count || 0).toLocaleString(), change: 'Now', color: 'emerald' },
    { icon: Camera, label: 'Active Cameras', value: globalData.active_cameras.toString(), change: 'Online', color: 'blue' },
    { icon: Activity, label: 'Peak Hour', value: globalData.peak_hour, change: `${globalData.peak_count} peak`, color: 'amber' },
    { icon: CheckCircle, label: 'Incidents Resolved', value: '0', change: 'Today', color: 'emerald' },
  ];

  // Derived alerts for the UI
  const alerts: Alert[] = globalData.recent_alerts.map((a: RawAlert) => ({
    id: a.id,
    msg: a.type === 'overcrowding' ? `High crowd density at ${a.zone}` :
      a.type === 'no_entry_violation' ? `Restricted zone breach at ${a.zone}` :
        a.type === 'emergency' ? `EMERGENCY: ${a.zone}` : a.msg || 'System Notice',
    time: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: a.type === 'overcrowding' ? 'warning' :
      a.type === 'no_entry_violation' ? 'error' :
        a.type === 'emergency' ? 'info' : 'success'
  }));

  // Chart data from real hourly history
  const chartData = globalData.hourly_history;

  // Alert style helper
  function getAlertStyle(type: Alert['type']) {
    switch (type) {
      case 'warning':
        return { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle };
      case 'success':
        return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle };
      case 'error':
        return { bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-700', text: 'text-red-700 dark:text-red-400', icon: AlertCircle };
      case 'info':
        return { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', icon: InfoIcon };
      default:
        return { bg: '', border: '', text: '', icon: AlertTriangle };
    }
  }

  // Info icon fallback
  function InfoIcon(props: LucideProps) {
    return <BarChart3 {...props} />;
  }

  // Load settings from backend
  useEffect(() => {
    setIsMounted(true);

    const fetchSettings = async () => {
      try {
        const response = await fetch(`${baseUrl}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(prev => ({ ...prev, ...data }));
          console.log('Dashboard: Settings loaded from backend');
        }
      } catch (err) {
        console.error('Dashboard: Failed to fetch settings:', err);
      }
    };

    fetchSettings();
  }, [baseUrl]);

  // Polling for Global Analytics
  useEffect(() => {
    const fetchGlobalAnalytics = async () => {
      try {
        const response = await fetch(`${baseUrl}/analytics/global`);
        if (response.ok) {
          const data = await response.json();
          setGlobalData(data);
        }
      } catch (err) {
        console.error('Dashboard: Failed to fetch global analytics:', err);
      }
    };

    fetchGlobalAnalytics();
    const interval = setInterval(fetchGlobalAnalytics, settings.autoRefreshInterval || 3000);
    return () => clearInterval(interval);
  }, [baseUrl, settings.autoRefreshInterval]);

  // Camera state for setup wizard
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [camerasLoaded, setCamerasLoaded] = useState(false);

  // Fetch cameras to check if first-time setup needed
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch(`${baseUrl}/cameras`);
        if (response.ok) {
          const data = await response.json();
          setCameras(data.cameras || []);
          // Show wizard if no cameras configured
          if (!data.cameras || data.cameras.length === 0) {
            setShowSetupWizard(true);
          }
        }
      } catch (err) {
        console.error('Dashboard: Failed to fetch cameras:', err);
      } finally {
        setCamerasLoaded(true);
      }
    };

    fetchCameras();
  }, [baseUrl]);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    // Refresh cameras
    fetch(`${baseUrl}/cameras`)
      .then(res => res.json())
      .then(data => setCameras(data.cameras || []))
      .catch(err => console.error('Failed to refresh cameras:', err));
  };

  return (
    <>
      {/* Camera Setup Wizard - shown on first time */}
      {showSetupWizard && (
        <CameraSetupWizard
          onComplete={handleSetupComplete}
          baseUrl={baseUrl}
        />
      )}

      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex transition-colors duration-200">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transition-all duration-300 flex flex-col`}>
          {/* Logo - Click to toggle sidebar */}
          <div
            className="p-4 border-b border-zinc-100 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Logo size={sidebarOpen ? 'md' : 'sm'} showText={sidebarOpen} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                    }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between transition-colors duration-200">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time crowd monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">{getUserInitials()}</span>
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-50">
                    {user && (
                      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-700">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.firstName || 'User'}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        // Clear admin verification
                        localStorage.removeItem('crowdkavach_admin_verified');
                        localStorage.removeItem('crowdkavach_admin_verify_time');
                        // Call WorkOS logout
                        try {
                          await fetch('/api/auth/logout');
                        } catch (err) {
                          console.log('Logout fetch failed');
                        }
                        router.push('/');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="flex-1 p-6 overflow-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-800 rounded-xl p-5 border border-zinc-100 dark:border-zinc-700 shadow-sm transition-colors duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                      stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
                        stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30'
                      }`}>
                      <stat.icon className={`w-5 h-5 ${stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                        stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                          stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        }`} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Main Grid - Camera Grid + Alerts */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Multi-Camera Grid */}
              <div className="lg:col-span-2">
                <CameraGrid settings={settings} />
              </div>

              {/* Alerts Panel */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm transition-colors duration-200">
                <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Alerts</h2>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
                    {alerts.length} new
                  </span>
                </div>
                <div className="p-4 space-y-3 max-h-100 overflow-auto">
                  {alerts.map((alert) => {
                    const style = getAlertStyle(alert.type);
                    const IconComponent = style.icon;
                    return (
                      <div key={alert.id} className={`p-3 rounded-lg border ${style.bg} ${style.border}`}>
                        <div className="flex items-start gap-2">
                          <IconComponent className={`w-4 h-4 mt-0.5 ${style.text}`} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${style.text}`}>{alert.msg}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alert.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="mt-6 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-5 transition-colors duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Crowd Activity</h2>
                </div>
                <select className="text-sm border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 rounded-lg px-3 py-1.5 text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:focus:ring-emerald-500 focus:border-emerald-600 dark:focus:border-emerald-500">
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              <div className="h-48 flex items-end justify-between gap-1 px-4">
                {chartData.map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors rounded-t cursor-pointer"
                    style={{ height: isMounted ? `${height}%` : '50%' }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 px-4 text-xs text-zinc-400 dark:text-zinc-500">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
