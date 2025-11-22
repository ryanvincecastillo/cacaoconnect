"use client";

import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Bot,
  Wifi,
  WifiOff
} from 'lucide-react';

// Volume indicator bars component (moved outside render to avoid re-creation)
const VolumeBars = ({ isListening, volume }) => {
  if (!isListening && volume === 0) return null;

  return (
    <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col space-y-1">
      {[1, 2, 3].map((height) => (
        <div
          key={height}
          className={`w-1 bg-current opacity-60 transition-all duration-100 ${
            volume > height * 0.3 ? 'h-3' : 'h-1'
          }`}
          style={{ height: `${Math.max(volume * 3 * height, 4)}px` }}
        />
      ))}
    </div>
  );
};

const VoiceFeedbackIndicator = ({
  isListening = false,
  isSpeaking = false,
  isConnected = false,
  volume = 0,
  status = 'Ready',
  showText = false,
  size = 'md',
  className = '',
  // Wake word detection props
  isWakeWordActive = false,
  wakeWordStatus = 'idle',
  wakeWordDetected = false,
  audioLevel = 0
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { container: 'w-12 h-12', icon: 'w-6 h-6' }
  };

  const { container, icon: iconSize } = sizeConfig[size] || sizeConfig.md;

  // Determine status colors and icons
  const getStatusConfig = () => {
    // Wake word detection has priority
    if (wakeWordDetected) {
      return {
        bgColor: 'bg-purple-500',
        statusIcon: <Bot className={`${iconSize} text-white animate-bounce`} />,
        textColor: 'text-purple-600',
        ringColor: 'ring-purple-200'
      };
    }

    if (isWakeWordActive) {
      return {
        bgColor: 'bg-orange-500',
        statusIcon: <Bot className={`${iconSize} text-white animate-pulse`} />,
        textColor: 'text-orange-600',
        ringColor: 'ring-orange-200'
      };
    }

    if (isListening) {
      return {
        bgColor: 'bg-red-500',
        statusIcon: <Mic className={`${iconSize} text-white animate-pulse`} />,
        textColor: 'text-red-600',
        ringColor: 'ring-red-200'
      };
    }

    if (isSpeaking) {
      return {
        bgColor: 'bg-blue-500',
        statusIcon: <Volume2 className={`${iconSize} text-white`} />,
        textColor: 'text-blue-600',
        ringColor: 'ring-blue-200'
      };
    }

    if (!isConnected) {
      return {
        bgColor: 'bg-gray-400',
        statusIcon: <WifiOff className={`${iconSize} text-white`} />,
        textColor: 'text-gray-600',
        ringColor: ''
      };
    }

    return {
      bgColor: 'bg-emerald-500',
      statusIcon: <Bot className={`${iconSize} text-white`} />,
      textColor: 'text-emerald-600',
      ringColor: ''
    };
  };

  const { bgColor, statusIcon, textColor, ringColor } = getStatusConfig();

  // Determine status text
  const getStatusText = () => {
    if (wakeWordDetected) return 'Wake word detected!';
    if (isWakeWordActive) {
      switch (wakeWordStatus) {
        case 'detecting': return 'Listening for "Hey Jodex"...';
        case 'confirmed': return 'Wake word confirmed!';
        case 'initializing': return 'Initializing wake word...';
        default: return 'Wake word active';
      }
    }
    if (isListening) return 'Listening...';
    if (isSpeaking) return 'Speaking...';
    return status;
  };

  // Determine if we should show ring animation
  const shouldShowRing = wakeWordDetected || isWakeWordActive || isListening;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main indicator circle */}
      <div className="relative">
        <div className={`${container} ${bgColor} rounded-full flex items-center justify-center transition-all duration-300 ${
          shouldShowRing && ringColor ? `ring-4 ${ringColor}` : ''
        }`}>
          {statusIcon}
        </div>

        {/* Connection status indicator */}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Wake word detection indicator */}
        {isWakeWordActive && !wakeWordDetected && (
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-ping" />
        )}

        {/* Wake word detected indicator */}
        {wakeWordDetected && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-400 rounded-full animate-ping" />
        )}

        {/* Volume bars when listening or wake word active */}
        <VolumeBars isListening={isListening || isWakeWordActive} volume={isWakeWordActive ? audioLevel : volume} />
      </div>

      {/* Status text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${textColor}`}>
            {getStatusText()}
          </span>
          
          {/* Secondary status */}
          {(wakeWordDetected || isWakeWordActive) && (
            <span className="text-xs opacity-75">
              {wakeWordDetected ? 'Activating voice assistant...' : 'Say "Hey Jodex" to start'}
            </span>
          )}
          
          {!isConnected && !isWakeWordActive && (
            <span className="text-xs text-red-500">Disconnected</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceFeedbackIndicator;
