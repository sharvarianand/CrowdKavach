// Gets the video stream from localhost:8000/stream-with-boxes and displays it in a box
'use client';

import { Pause, VideoOff, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface VideoBoxProps {
    className?: string;
    isPaused?: boolean;
    cameraId?: string;
    showLabel?: boolean;
    cameraName?: string;
}

function VideoBox({ className = "", isPaused = false, cameraId, showLabel = false, cameraName }: VideoBoxProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [hasError, setHasError] = useState(false);
    const [key, setKey] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [privacyMaskingEnabled, setPrivacyMaskingEnabled] = useState(false);

    // Build stream URL based on privacy masking setting and camera ID
    const baseUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';
    const streamEndpoint = privacyMaskingEnabled ? 'stream-with-privacy' : 'stream-with-boxes';
    // Build query params properly
    const buildStreamUrl = (timestamp: number | null) => {
        const params = new URLSearchParams();
        if (cameraId) params.set('camera_id', cameraId);
        if (timestamp) params.set('t', String(timestamp));
        const queryString = params.toString();
        return `${baseUrl}/${streamEndpoint}${queryString ? `?${queryString}` : ''}`;
    };

    // Load privacy masking setting from localStorage
    useEffect(() => {
        setIsMounted(true);
        setKey(Date.now());
        
        // Load settings
        try {
            const savedSettings = localStorage.getItem('crowdkavach_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                setPrivacyMaskingEnabled(settings.privacyMaskingEnabled || false);
            }
        } catch (error) {
            console.error('Error loading privacy settings:', error);
        }

        // Listen for storage changes (when settings are updated)
        const handleStorageChange = () => {
            try {
                const savedSettings = localStorage.getItem('crowdkavach_settings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    setPrivacyMaskingEnabled(settings.privacyMaskingEnabled || false);
                }
            } catch (error) {
                console.error('Error loading privacy settings:', error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Reload stream when privacy setting or cameraId changes
    useEffect(() => {
        if (isMounted) {
            setKey(Date.now());
            setHasError(false);
        }
    }, [privacyMaskingEnabled, isMounted, cameraId]);

    // Handle stream resumption by forcing a reload
    useEffect(() => {
        if (!isPaused) {
            setKey(Date.now());
            setHasError(false);
        }
    }, [isPaused]);

    // Retry connection on error
    useEffect(() => {
        if (hasError) {
            const timer = setTimeout(() => {
                setKey(Date.now());
                setHasError(false);
            }, 5000); // Retry every 5 seconds
            return () => clearTimeout(timer);
        }
    }, [hasError]);

    return (
        <div className={`overflow-hidden shadow-sm bg-black flex items-center justify-center relative ${className}`}>
            {!isMounted ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <VideoOff className="w-12 h-12 text-cyan-500/30" />
                    <div className="text-cyan-500/50 text-sm">Initializing stream...</div>
                </div>
            ) : !hasError ? (
                <>
                    <img
                        key={key}
                        ref={imgRef}
                        src={buildStreamUrl(key)}
                        alt="Live Video Stream"
                        className={`w-full h-full object-contain ${isPaused ? 'opacity-50' : ''}`}
                        onError={() => setHasError(true)}
                    />
                    {/* Privacy Mode Indicator */}
                    {privacyMaskingEnabled && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                            <ShieldCheck className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-purple-400 font-bold">PRIVACY</span>
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <VideoOff className="w-12 h-12 text-cyan-500/30" />
                    <div className="text-cyan-500/50 text-sm">Connecting to stream...</div>
                    <div className="text-cyan-500/30 text-xs">Retrying in 5s</div>
                </div>
            )}
            
            {/* Paused overlay */}
            {isPaused && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
                            <Pause className="w-8 h-8 text-amber-400" />
                        </div>
                        <span className="text-amber-400 text-sm font-bold tracking-wider">PAUSED</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoBox;