'use client';

import React, { useState, useEffect } from 'react';
import { Camera, WifiOff, Maximize2, Users, RefreshCw, VideoOff, AlertTriangle, ShieldCheck, ShieldAlert, Ruler } from 'lucide-react';
import { Camera as CameraType, AreaUnit, DensityLevel } from '@/lib/types';

interface CameraConfig {
  id: string;
  name: string;
  url: string;
  zone: string;
  enabled: boolean;
  type?: 'live' | 'offline';
  capacity?: number; // Max safe capacity for the area (calculated from area config)
  area?: number;
  areaUnit?: AreaUnit;
  densityLevel?: DensityLevel;
}

interface CameraStats {
  count: number;
  density: number;
}

// Risk assessment based on people count and capacity
interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  percentage: number;
  message: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

function assessRisk(count: number, capacity: number): RiskAssessment {
  const percentage = Math.round((count / capacity) * 100);
  
  if (percentage >= 90) {
    return {
      level: 'critical',
      percentage,
      message: 'CRITICAL: Evacuate immediately!',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500'
    };
  } else if (percentage >= 70) {
    return {
      level: 'high',
      percentage,
      message: 'HIGH RISK: Limit entry',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-500'
    };
  } else if (percentage >= 50) {
    return {
      level: 'medium',
      percentage,
      message: 'MODERATE: Monitor closely',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-500'
    };
  } else {
    return {
      level: 'low',
      percentage,
      message: 'Safe capacity',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500'
    };
  }
}

export default function CameraGrid({ className = '' }: { className?: string }) {
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [cameraStats, setCameraStats] = useState<CameraStats>({ count: 0, density: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);

  const serverUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';

  // Handle mount state - this is a valid pattern for hydration safety
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const response = await fetch(`${serverUrl}/cameras`);
        if (response.ok) {
          const data = await response.json();
          setCameras(data.cameras || []);
          setServerConnected(true);
        }
      } catch {
        setServerConnected(false);
        // Default demo cameras with area-based capacity
        setCameras([
          { id: 'cam-1', name: 'Main Entrance', url: '', zone: 'Zone A', enabled: true, type: 'live', area: 100, areaUnit: 'sqm', densityLevel: 'medium', capacity: 150 },
          { id: 'cam-2', name: 'Plaza Center', url: '', zone: 'Zone B', enabled: false, type: 'offline', area: 200, areaUnit: 'sqm', densityLevel: 'medium', capacity: 300 },
          { id: 'cam-3', name: 'Exit Gate', url: '', zone: 'Zone C', enabled: false, type: 'offline', area: 50, areaUnit: 'sqm', densityLevel: 'high', capacity: 125 },
          { id: 'cam-4', name: 'Parking Area', url: '', zone: 'Zone D', enabled: false, type: 'offline', area: 500, areaUnit: 'sqm', densityLevel: 'low', capacity: 250 },
        ]);
      }
    };

    fetchCameras();
    const interval = setInterval(fetchCameras, 10000);
    return () => clearInterval(interval);
  }, [serverUrl]);

  useEffect(() => {
    if (!isMounted) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`${serverUrl}/coordinates`);
        if (response.ok) {
          const data = await response.json();
          setCameraStats({
            count: data.count || data.people?.length || 0,
            density: data.density || 0,
          });
          setServerConnected(true);
        }
      } catch {
        setServerConnected(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, [serverUrl, isMounted]);

  const getDensityColor = (density: number) => {
    if (density > 70) return 'text-red-500';
    if (density > 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getDensityBgColor = (density: number) => {
    if (density > 70) return 'bg-red-500';
    if (density > 40) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (!isMounted) {
    return (
      <div className={`bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm p-8 flex items-center justify-center transition-colors duration-200 ${className}`}>
        <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
      </div>
    );
  }

  const liveCameras = cameras.filter(c => c.type === 'live' && c.enabled);
  const offlineCameras = cameras.filter(c => c.type !== 'live' || !c.enabled);

  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm overflow-hidden transition-colors duration-200 ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Live Cameras</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
            {liveCameras.length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          {serverConnected ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700">
              <span className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-full border border-red-200 dark:border-red-700">
              <span className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></span>
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-2 gap-0.5 bg-zinc-200 dark:bg-zinc-700">
        {/* Live Camera - Main Feed */}
        {liveCameras.map((camera) => (
          <LiveCameraFeed
            key={camera.id}
            camera={camera}
            stats={cameraStats}
            serverUrl={serverUrl}
            getDensityColor={getDensityColor}
            getDensityBgColor={getDensityBgColor}
          />
        ))}

        {/* Offline Cameras */}
        {offlineCameras.map((camera) => (
          <OfflineCameraPlaceholder key={camera.id} camera={camera} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-700/50 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between transition-colors duration-200">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {liveCameras.length}/{cameras.length} cameras online
        </span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Safe</span>
          <span className="w-2 h-2 bg-amber-500 rounded-full ml-2"></span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Moderate</span>
          <span className="w-2 h-2 bg-orange-500 rounded-full ml-2"></span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">High</span>
          <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Critical</span>
        </div>
      </div>
    </div>
  );
}

// Live Camera Feed Component
interface LiveCameraFeedProps {
  camera: CameraConfig;
  stats: CameraStats;
  serverUrl: string;
  getDensityColor: (density: number) => string;
  getDensityBgColor: (density: number) => string;
}

function LiveCameraFeed({ camera, stats, serverUrl, getDensityColor, getDensityBgColor }: LiveCameraFeedProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Direct MJPEG stream URL from Python server
  const videoFeedUrl = `${serverUrl}/video_feed`;
  
  // Calculate risk based on camera capacity
  const capacity = camera.capacity || 50;
  const risk = assessRisk(stats.count, capacity);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
  };

  // Auto-retry on error
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasError]);

  return (
    <div className="relative bg-zinc-900 overflow-hidden aspect-4/3">
      {!hasError ? (
        <>
          {/* MJPEG Stream - key forces re-render on retry */}
          <img
            key={`feed-${retryCount}`}
            src={videoFeedUrl}
            alt={camera.name}
            className="w-full h-full object-cover"
            onLoad={() => {
              console.log('Video feed loaded');
              setIsLoading(false);
            }}
            onError={(e) => {
              console.log('Video feed error:', e);
              setIsLoading(false);
              setHasError(true);
            }}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-2" />
              <span className="text-xs text-zinc-400">Connecting to camera...</span>
              <span className="text-[10px] text-zinc-500 mt-1">{serverUrl}</span>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-400">
          <WifiOff className="w-10 h-10 mb-2" />
          <span className="text-sm font-medium">Cannot connect to feed</span>
          <span className="text-xs mt-1 text-zinc-500">Ensure Python server is running</span>
          <button 
            onClick={handleRetry}
            className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors"
          >
            Retry Now
          </button>
          <span className="text-[10px] text-zinc-600 mt-2">Auto-retry in 5s...</span>
        </div>
      )}

      {/* Top Overlay */}
      {!hasError && !isLoading && (
        <div className="absolute top-0 left-0 right-0 p-2.5 bg-linear-to-b from-black/80 to-transparent z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-red-400 font-bold">REC</span>
              <span className="text-xs font-semibold text-white">{camera.name}</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 rounded">YOLO</span>
          </div>
        </div>
      )}

      {/* Bottom Overlay - Stats with Risk Assessment */}
      {!hasError && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* Risk Alert Banner - shows when medium or higher */}
          {(risk.level === 'medium' || risk.level === 'high' || risk.level === 'critical') && (
            <div className={`px-2.5 py-1.5 ${risk.level === 'critical' ? 'bg-red-600 animate-pulse' : risk.level === 'high' ? 'bg-orange-600' : 'bg-amber-600'} flex items-center justify-center gap-2`}>
              <AlertTriangle className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">{risk.message}</span>
            </div>
          )}
          
          {/* Stats Bar */}
          <div className="p-2.5 bg-linear-to-t from-black/90 to-black/60">
            <div className="flex items-center justify-between mb-2">
              {/* People Count */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-black/40 rounded-lg px-2 py-1">
                  <Users className="w-4 h-4 text-white/80" />
                  <span className="text-lg font-bold text-white">{stats.count}</span>
                  <span className="text-xs text-white/60">/ {capacity}</span>
                </div>
                
                {/* Risk Level Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  risk.level === 'critical' ? 'bg-red-500/30 border border-red-500' :
                  risk.level === 'high' ? 'bg-orange-500/30 border border-orange-500' :
                  risk.level === 'medium' ? 'bg-amber-500/30 border border-amber-500' :
                  'bg-emerald-500/30 border border-emerald-500'
                }`}>
                  {risk.level === 'low' ? (
                    <ShieldCheck className={`w-3.5 h-3.5 ${risk.color}`} />
                  ) : (
                    <ShieldAlert className={`w-3.5 h-3.5 ${risk.color}`} />
                  )}
                  <span className={`text-xs font-bold uppercase ${risk.color}`}>{risk.level}</span>
                </div>
              </div>
              
              <Maximize2 className="w-4 h-4 text-white/60 cursor-pointer hover:text-white transition-colors" />
            </div>
            
            {/* Capacity Progress Bar */}
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${risk.bgColor}`}
                style={{ width: `${Math.min(risk.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/50">Capacity: {risk.percentage}%</span>
              <span className="text-[10px] text-white/50">{camera.zone}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Offline Camera Placeholder
function OfflineCameraPlaceholder({ camera }: { camera: CameraConfig }) {
  const capacity = camera.capacity || 50;
  const areaDisplay = camera.area 
    ? `${camera.area} ${camera.areaUnit === 'sqft' ? 'ft²' : 'm²'}`
    : 'Not configured';
  
  return (
    <div className="relative bg-zinc-800 overflow-hidden aspect-4/3">
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
        <VideoOff className="w-10 h-10 mb-2 opacity-40" />
        <span className="text-sm font-medium">{camera.name}</span>
        <span className="text-xs mt-1 opacity-60">Offline</span>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            {areaDisplay}
          </span>
          <span>|</span>
          <span>Max: {capacity} people</span>
        </div>
      </div>
      <div className="absolute top-0 left-0 right-0 p-2 bg-linear-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">{camera.name}</span>
          <span className="text-[10px] text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded">OFFLINE</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>{camera.zone}</span>
          <span className="text-amber-500/70">{camera.densityLevel || 'medium'} density</span>
        </div>
      </div>
    </div>
  );
}
