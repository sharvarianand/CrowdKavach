'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, Activity, BarChart3, Settings, Bell, 
  Camera, AlertTriangle, TrendingUp, Clock, Menu, X,
  Home, FileText, Map, LogOut, CheckCircle, AlertCircle,
  Sun, Moon
} from 'lucide-react';
import Logo from './Logo';
import CameraGrid from './CameraGrid';
import { useTheme } from '@/lib/ThemeContext';

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface DashboardUIProps {
  user?: User;
}

interface Alert {
  id: string;
  msg: string;
  time: string;
  type: 'warning' | 'success' | 'error' | 'info';
}

export default function DashboardUI({ user }: DashboardUIProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  // Generate chart data only on client side to avoid hydration mismatch
  const [chartData, setChartData] = useState<number[]>(Array(24).fill(50));

  // Handle mount state and generate chart data - valid pattern for hydration safety
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsMounted(true);
    setChartData(Array.from({ length: 24 }, () => Math.random() * 80 + 20));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Alerts state
  const [alerts] = useState<Alert[]>([
    { id: '1', msg: 'High density in Zone A', time: '2 min ago', type: 'warning' },
    { id: '2', msg: 'Camera 3 reconnected', time: '15 min ago', type: 'success' },
    { id: '3', msg: 'Crowd threshold exceeded', time: '1 hour ago', type: 'error' },
  ]);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
    { id: 'heatmap', icon: Map, label: 'Heat Map', href: '/heatmap' },
    { id: 'analytics', icon: BarChart3, label: 'Analysis', href: '/analysis' },
    { id: 'reports', icon: FileText, label: 'Reports', href: '/reports' },
    { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const stats = [
    { label: 'Total People', value: '247', change: '+12%', icon: Users, color: 'emerald' },
    { label: 'Active Cameras', value: '4', change: '100%', icon: Camera, color: 'blue' },
    { label: 'Avg Density', value: '34%', change: '-5%', icon: Activity, color: 'amber' },
    { label: 'Alerts Today', value: '3', change: '+1', icon: Bell, color: 'red' },
  ];

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const getAlertStyle = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-300', icon: AlertTriangle };
      case 'success':
        return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300', icon: CheckCircle };
      case 'error':
        return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-300', icon: AlertCircle };
      default:
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', icon: Bell };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-700">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
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
        {user && sidebarOpen && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user.firstName || user.email}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
            <a
              href="/api/auth/logout"
              className="flex items-center gap-2 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </a>
          </div>
        )}

        {/* Toggle Button */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-zinc-100 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-700">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">{getUserInitials()}</span>
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
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    stat.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                    stat.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/30' :
                    stat.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-red-50 dark:bg-red-900/30'
                  }`}>
                    <stat.icon className={`w-5 h-5 ${
                      stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.change.startsWith('+') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
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
              <CameraGrid />
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
  );
}
