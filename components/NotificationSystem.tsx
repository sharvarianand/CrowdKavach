'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, Bell } from 'lucide-react';

export interface Notification {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    zone?: string;
    timestamp: Date;
    autoDismiss?: boolean;
}

interface NotificationSystemProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const NotificationToast: React.FC<{
    notification: Notification;
    onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (notification.autoDismiss !== false) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, 8000); // Auto dismiss after 8 seconds
            return () => clearTimeout(timer);
        }
    }, [notification.id]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(notification.id);
        }, 300);
    };

    const getStyles = () => {
        switch (notification.type) {
            case 'critical':
                return {
                    bg: 'bg-gradient-to-r from-red-900/90 to-red-800/90',
                    border: 'border-red-500/50',
                    icon: AlertTriangle,
                    iconColor: 'text-red-400',
                    titleColor: 'text-red-100',
                    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                };
            case 'warning':
                return {
                    bg: 'bg-gradient-to-r from-amber-900/90 to-amber-800/90',
                    border: 'border-amber-500/50',
                    icon: AlertCircle,
                    iconColor: 'text-amber-400',
                    titleColor: 'text-amber-100',
                    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                };
            case 'success':
                return {
                    bg: 'bg-gradient-to-r from-emerald-900/90 to-emerald-800/90',
                    border: 'border-emerald-500/50',
                    icon: CheckCircle,
                    iconColor: 'text-emerald-400',
                    titleColor: 'text-emerald-100',
                    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-cyan-900/90 to-cyan-800/90',
                    border: 'border-cyan-500/50',
                    icon: Info,
                    iconColor: 'text-cyan-400',
                    titleColor: 'text-cyan-100',
                    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                };
        }
    };

    const styles = getStyles();
    const IconComponent = styles.icon;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div
            className={`
                relative w-96 rounded-lg border backdrop-blur-md overflow-hidden
                ${styles.bg} ${styles.border} ${styles.glow}
                transform transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
                animate-slideIn
            `}
        >
            {/* Progress bar for auto-dismiss */}
            {notification.autoDismiss !== false && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
                    <div 
                        className={`h-full ${notification.type === 'critical' ? 'bg-red-400' : notification.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'}`}
                        style={{ animation: 'shrink 8s linear forwards' }}
                    />
                </div>
            )}

            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center ${notification.type === 'critical' ? 'animate-pulse' : ''}`}>
                        <IconComponent className={`w-5 h-5 ${styles.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className={`font-bold text-sm ${styles.titleColor} truncate`}>
                                {notification.title}
                            </h4>
                            <button
                                onClick={handleDismiss}
                                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors group"
                                title="Dismiss"
                            >
                                <X className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                            {notification.zone && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-gray-400">
                                    📍 {notification.zone}
                                </span>
                            )}
                            <span className="text-[10px] text-gray-500">
                                {formatTime(notification.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
    notifications,
    onDismiss,
    position = 'top-right'
}) => {
    const positionClasses = {
        'top-right': 'top-20 right-4',
        'top-left': 'top-20 left-4',
        'bottom-right': 'bottom-20 right-4',
        'bottom-left': 'bottom-20 left-4'
    };

    return (
        <>
            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes shrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>

            <div className={`fixed ${positionClasses[position]} z-[100] flex flex-col gap-3 pointer-events-none`}>
                {notifications.map((notification) => (
                    <div key={notification.id} className="pointer-events-auto">
                        <NotificationToast
                            notification={notification}
                            onDismiss={onDismiss}
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

// Hook for managing notifications
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 5)); // Keep max 5 notifications
    }, []);

    const dismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        addNotification,
        dismissNotification,
        clearAll
    };
};

export default NotificationSystem;
