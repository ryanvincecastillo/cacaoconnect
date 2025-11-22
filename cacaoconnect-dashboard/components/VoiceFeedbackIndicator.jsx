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
  className = ''
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
    if (isListening) {
      return {
        bgColor: 'bg-red-500',
        statusIcon: <Mic className={`${iconSize} text-white animate-pulse`} />,
        textColor: 'text-red-600'
      };
    }

    if (isSpeaking) {
      return {
        bgColor: 'bg-blue-500',
        statusIcon: <Volume2 className={`${iconSize} text-white`} />,
        textColor: 'text-blue-600'
      };
    }

    if (!isConnected) {
      return {
        bgColor: 'bg-gray-400',
        statusIcon: <WifiOff className={`${iconSize} text-white`} />,
        textColor: 'text-gray-600'
      };
    }

    return {
      bgColor: 'bg-emerald-500',
      statusIcon: <Bot className={`${iconSize} text-white`} />,
      textColor: 'text-emerald-600'
    };
  };

  const { bgColor, statusIcon, textColor } = getStatusConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main indicator circle */}
      <div className="relative">
        <div className={`${container} ${bgColor} rounded-full flex items-center justify-center transition-all duration-300 ${
          isListening ? 'animate-pulse ring-4 ring-red-200' : ''
        }`}>
          {statusIcon}
        </div>

        {/* Connection status indicator */}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}

        {/* Volume bars when listening */}
        <VolumeBars isListening={isListening} volume={volume} />
      </div>

      {/* Status text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${textColor}`}>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : status}
          </span>
          {!isConnected && (
            <span className="text-xs text-red-500">Disconnected</span>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceFeedbackIndicator;
