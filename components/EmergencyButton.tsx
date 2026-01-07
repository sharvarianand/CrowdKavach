'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Phone, Radio, MapPin, Siren } from 'lucide-react';

interface EmergencyButtonProps {
    onEmergencyActivated?: (data: EmergencyData) => void;
}

interface EmergencyData {
    timestamp: Date;
    type: string;
    message: string;
    zones: string[];
}

const EmergencyButton: React.FC<EmergencyButtonProps> = ({ onEmergencyActivated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActivated, setIsActivated] = useState(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedZones, setSelectedZones] = useState<string[]>([]);
    const [customMessage, setCustomMessage] = useState('');
    const [countdown, setCountdown] = useState<number | null>(null);

    const emergencyTypes = [
        { id: 'stampede', label: 'Stampede Risk', icon: '🏃', color: 'bg-red-600' },
        { id: 'fire', label: 'Fire Emergency', icon: '🔥', color: 'bg-orange-600' },
        { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'bg-blue-600' },
        { id: 'security', label: 'Security Threat', icon: '🚨', color: 'bg-purple-600' },
        { id: 'evacuation', label: 'Evacuation Required', icon: '🚪', color: 'bg-yellow-600' },
        { id: 'other', label: 'Other Emergency', icon: '⚠️', color: 'bg-gray-600' },
    ];

    const zones = [
        'All Zones', 'Main Plaza', 'Entry Gate', 'Exit Gate', 
        'Food Court', 'Stage Area', 'Parking', 'VIP Area'
    ];

    const handleEmergencyClick = () => {
        setIsModalOpen(true);
    };

    const handleActivateEmergency = () => {
        if (!selectedType) return;

        // Start countdown
        setCountdown(3);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    // Activate emergency
                    setIsActivated(true);
                    setIsModalOpen(false);
                    
                    const emergencyData: EmergencyData = {
                        timestamp: new Date(),
                        type: selectedType,
                        message: customMessage || `${emergencyTypes.find(t => t.id === selectedType)?.label} activated`,
                        zones: selectedZones.length > 0 ? selectedZones : ['All Zones']
                    };
                    
                    onEmergencyActivated?.(emergencyData);
                    
                    // Auto-deactivate after 30 seconds for demo
                    setTimeout(() => {
                        setIsActivated(false);
                        setSelectedType('');
                        setSelectedZones([]);
                        setCustomMessage('');
                    }, 30000);
                    
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setCountdown(null);
        setSelectedType('');
        setSelectedZones([]);
        setCustomMessage('');
    };

    const handleDeactivate = () => {
        setIsActivated(false);
        setSelectedType('');
        setSelectedZones([]);
        setCustomMessage('');
    };

    const toggleZone = (zone: string) => {
        if (zone === 'All Zones') {
            setSelectedZones(['All Zones']);
        } else {
            setSelectedZones(prev => {
                const filtered = prev.filter(z => z !== 'All Zones');
                if (filtered.includes(zone)) {
                    return filtered.filter(z => z !== zone);
                }
                return [...filtered, zone];
            });
        }
    };

    return (
        <>
            {/* Emergency Button - Always visible */}
            <button
                onClick={isActivated ? handleDeactivate : handleEmergencyClick}
                className={`
                    fixed bottom-24 right-6 z-50
                    w-16 h-16 rounded-full
                    flex items-center justify-center
                    transition-all duration-300 transform hover:scale-110
                    ${isActivated 
                        ? 'bg-red-600 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.8)]' 
                        : 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    }
                    border-4 border-red-400/50
                `}
                title={isActivated ? 'Click to deactivate emergency' : 'Emergency / Panic Button'}
            >
                {isActivated ? (
                    <Siren className="w-8 h-8 text-white animate-bounce" />
                ) : (
                    <AlertTriangle className="w-8 h-8 text-white" />
                )}
            </button>

            {/* Emergency Label */}
            <div className={`
                fixed bottom-24 right-24 z-50
                px-3 py-1 rounded-lg text-xs font-bold tracking-wider
                transition-all duration-300
                ${isActivated 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-red-900/50 text-red-400 border border-red-500/30'
                }
            `}>
                {isActivated ? '🚨 EMERGENCY ACTIVE' : 'EMERGENCY'}
            </div>

            {/* Active Emergency Banner */}
            {isActivated && (
                <div className="fixed top-16 left-0 right-0 z-40 bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-4 animate-pulse">
                    <Siren className="w-5 h-5" />
                    <span className="font-bold tracking-wider">
                        🚨 EMERGENCY PROTOCOL ACTIVATED - {emergencyTypes.find(t => t.id === selectedType)?.label?.toUpperCase()}
                    </span>
                    <span className="text-sm opacity-80">
                        All security personnel notified
                    </span>
                    <button 
                        onClick={handleDeactivate}
                        className="ml-4 px-3 py-1 bg-white/20 rounded text-sm hover:bg-white/30 transition-colors"
                    >
                        DEACTIVATE
                    </button>
                </div>
            )}

            {/* Emergency Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f1729] border border-red-500/30 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                        {/* Header */}
                        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-6 h-6 text-white" />
                                <h2 className="text-lg font-bold text-white tracking-wider">EMERGENCY ACTIVATION</h2>
                            </div>
                            <button 
                                onClick={handleCancel}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {countdown !== null ? (
                            /* Countdown Screen */
                            <div className="p-8 flex flex-col items-center justify-center">
                                <div className="text-6xl font-bold text-red-500 mb-4">{countdown}</div>
                                <p className="text-gray-400 mb-6">Activating emergency protocol...</p>
                                <button
                                    onClick={handleCancel}
                                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    CANCEL
                                </button>
                            </div>
                        ) : (
                            /* Configuration Screen */
                            <div className="p-6 space-y-6">
                                {/* Emergency Type Selection */}
                                <div>
                                    <label className="text-xs text-gray-400 font-semibold mb-3 block">SELECT EMERGENCY TYPE *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {emergencyTypes.map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setSelectedType(type.id)}
                                                className={`
                                                    p-3 rounded-lg border-2 transition-all text-left
                                                    flex items-center gap-3
                                                    ${selectedType === type.id 
                                                        ? 'border-red-500 bg-red-500/20 text-white' 
                                                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500'
                                                    }
                                                `}
                                            >
                                                <span className="text-xl">{type.icon}</span>
                                                <span className="text-sm font-medium">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Zone Selection */}
                                <div>
                                    <label className="text-xs text-gray-400 font-semibold mb-3 block flex items-center gap-2">
                                        <MapPin className="w-3 h-3" />
                                        AFFECTED ZONES
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {zones.map(zone => (
                                            <button
                                                key={zone}
                                                onClick={() => toggleZone(zone)}
                                                className={`
                                                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                    ${selectedZones.includes(zone)
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                    }
                                                `}
                                            >
                                                {zone}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Message */}
                                <div>
                                    <label className="text-xs text-gray-400 font-semibold mb-2 block flex items-center gap-2">
                                        <Radio className="w-3 h-3" />
                                        BROADCAST MESSAGE (Optional)
                                    </label>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Enter message to broadcast to all security personnel..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500"
                                        rows={2}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleActivateEmergency}
                                        disabled={!selectedType}
                                        className={`
                                            flex-1 px-4 py-3 rounded-lg font-bold tracking-wider transition-all
                                            flex items-center justify-center gap-2
                                            ${selectedType
                                                ? 'bg-red-600 text-white hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <Siren className="w-4 h-4" />
                                        ACTIVATE EMERGENCY
                                    </button>
                                </div>

                                {/* Warning */}
                                <p className="text-[10px] text-gray-500 text-center">
                                    ⚠️ This will immediately notify all security personnel and activate emergency protocols.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default EmergencyButton;
