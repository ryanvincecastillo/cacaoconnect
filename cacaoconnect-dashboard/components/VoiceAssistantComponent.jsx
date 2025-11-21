"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Bot,
  User,
  Headphones,
  Settings
} from 'lucide-react';

// LiveKit imports
import { LiveKitRoom, useConnectionState, ConnectionState } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

// Environment validation
import { isVoiceAssistantConfigured, getEnvVars, validateClientEnv } from '../lib/env-validation';

const VoiceAssistantComponent = ({
  userId,
  userType = 'farmer',
  onVoiceCommand,
  showToast,
  className = ''
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState('Ready');
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [envError, setEnvError] = useState(null);

  // Refs
  const roomRef = useRef(null);
  const audioRef = useRef(null);

  // Validate environment and initialize on component mount
  useEffect(() => {
    // Debug: Log environment variables
    const env = getEnvVars();
    console.log('🔧 Voice Assistant Environment Debug:', env);

    const validation = validateClientEnv();
    console.log('✅ Client Environment Validation:', validation);

    // Check if voice assistant is properly configured
    const configured = isVoiceAssistantConfigured();
    console.log('🎤 Voice Assistant Configured:', configured);
    setIsConfigured(configured);

    if (!configured) {
      setEnvError('Voice assistant is not properly configured. Please check environment variables.');

      if (!env.assistantEnabled) {
        console.log('❌ Assistant disabled:', env.assistantEnabled);
        setEnvError('Voice assistant is disabled in configuration.');
      } else if (!env.livekitUrl) {
        console.log('❌ LiveKit URL missing:', env.livekitUrl);
        setEnvError('LiveKit URL is not configured.');
      } else {
        console.log('❌ Other configuration issue');
        console.log('Missing vars:', validation.missingVars);
        setEnvError(`Voice assistant configuration is incomplete. Missing: ${validation.missingVars.join(', ')}`);
      }
      return;
    }

    if (userId) {
      initializeVoiceAssistant();
    }
  }, [userId]);

  // Fetch LiveKit token
  const initializeVoiceAssistant = async () => {
    try {
      setError(null);
      setVoiceStatus('Connecting...');

      const response = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room: 'cacao-voice-assistant',
          userType: userType,
          userId: userId,
          customMetadata: {
            app: 'cacaoconnect',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get voice token');
      }

      const data = await response.json();
      setToken(data.token);
      setVoiceStatus('Connected to voice service');

    } catch (err) {
      console.error('Voice assistant initialization error:', err);
      setError(err.message);
      setVoiceStatus('Connection failed');
      showToast?.('Voice assistant connection failed', 'error');
    }
  };

  // Handle connection state changes
  const handleConnectionChange = (state) => {
    setIsConnected(state === ConnectionState.Connected);

    if (state === ConnectionState.Connected) {
      setVoiceStatus('Ready');
      showToast?.('Voice assistant connected', 'success');
    } else if (state === ConnectionState.Disconnected) {
      setVoiceStatus('Disconnected');
    } else if (state === ConnectionState.Reconnecting) {
      setVoiceStatus('Reconnecting...');
    }
  };

  // Start voice recording
  const startListening = async () => {
    if (!isConnected) {
      showToast?.('Please wait for voice assistant to connect', 'warning');
      return;
    }

    try {
      setIsListening(true);
      setVoiceStatus('Listening...');
      setError(null);

      // For now, simulate voice recognition since we don't have full LiveKit audio setup
      // In production, this would interface with the LiveKit room's audio tracks

      setTimeout(() => {
        // Simulate voice recognition result
        const simulatedTranscript = "check my inventory";
        handleVoiceCommand(simulatedTranscript);
        stopListening();
      }, 2000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setError('Microphone access denied');
      setIsListening(false);
      setVoiceStatus('Microphone access denied');
      showToast?.('Please allow microphone access', 'error');
    }
  };

  // Stop voice recording
  const stopListening = () => {
    setIsListening(false);
    setVoiceStatus('Ready');

    // Stop any ongoing audio streams
    if (audioRef.current) {
      audioRef.current.getTracks().forEach(track => track.stop());
      audioRef.current = null;
    }
  };

  // Handle voice command
  const handleVoiceCommand = async (transcript) => {
    try {
      setLastTranscript(transcript);
      setVoiceStatus('Processing...');

      // Parse the command using our voice service
      const command = parseCommand(transcript);

      // Call the voice command handler if provided
      if (onVoiceCommand) {
        const response = await onVoiceCommand(command);
        handleAssistantResponse(response);
      } else {
        // Fallback to basic command handling
        const response = await handleBasicCommand(command);
        handleAssistantResponse(response);
      }

    } catch (err) {
      console.error('Voice command processing error:', err);
      setError('Failed to process voice command');
      setVoiceStatus('Error processing command');
      showToast?.('Voice command failed', 'error');
    }
  };

  // Parse voice command (simplified version)
  const parseCommand = (text) => {
    const lowerText = text.toLowerCase().trim();

    // Order commitment
    const commitMatch = lowerText.match(/commit\s+(\d+)\s*(?:kg|kilograms?)?\s+(?:to\s+)?order\s*(\w+)/i);
    if (commitMatch) {
      return {
        intent: 'commit_volume',
        entities: {
          volume: parseFloat(commitMatch[1]),
          orderId: commitMatch[2]
        },
        originalText: text
      };
    }

    // Inventory check
    if (/check\s+(?:my\s+)?inventory|what\s+(?:do|i)\s+have/.test(lowerText)) {
      return {
        intent: 'check_inventory',
        entities: {},
        originalText: text
      };
    }

    // Delivery check
    if (/check\s+(?:my\s+)?deliveries|pending\s+deliveries/.test(lowerText)) {
      return {
        intent: 'check_deliveries',
        entities: {},
        originalText: text
      };
    }

    // Weather
    if (/weather\s+forecast|weather\s+update/.test(lowerText)) {
      return {
        intent: 'weather_forecast',
        entities: {},
        originalText: text
      };
    }

    return {
      intent: 'general_query',
      entities: { query: text },
      originalText: text
    };
  };

  // Handle basic voice commands
  const handleBasicCommand = async (command) => {
    const { intent, entities } = command;

    switch (intent) {
      case 'check_inventory':
        return {
          text: "I'll check your current inventory for you. Let me access that information now.",
          action: 'check_inventory',
          data: null
        };

      case 'check_deliveries':
        return {
          text: "I'm checking your delivery status. Let me see what deliveries you have pending.",
          action: 'check_deliveries',
          data: null
        };

      case 'commit_volume':
        return {
          text: `I can help you commit ${entities.volume} kilograms to order ${entities.orderId}. Please confirm this commitment.`,
          action: 'confirm_commitment',
          data: entities
        };

      case 'weather_forecast':
        return {
          text: "The weather forecast looks favorable for cocoa farming this week. Expect moderate rainfall and temperatures between 22-28°C.",
          action: 'weather_report',
          data: null
        };

      default:
        return {
          text: "I'm your cocoa farming assistant. You can ask me about your inventory, deliveries, orders, or weather conditions.",
          action: null,
          data: null
        };
    }
  };

  // Handle assistant response
  const handleAssistantResponse = async (response) => {
    try {
      setLastResponse(response.text);
      setVoiceStatus('Speaking...');
      setIsSpeaking(true);

      // Text-to-speech using browser API
      if ('speechSynthesis' in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = volume;

        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;

        utterance.onend = () => {
          setIsSpeaking(false);
          setVoiceStatus('Ready');
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setVoiceStatus('Ready');
          console.error('Speech synthesis error');
        };

        speechSynthesis.speak(utterance);
      } else {
        // Fallback if TTS is not available or muted
        setTimeout(() => {
          setIsSpeaking(false);
          setVoiceStatus('Ready');
        }, 2000);
      }

      // Trigger action if specified
      if (response.action && onVoiceCommand) {
        await onVoiceCommand({ ...response, type: 'action' });
      }

    } catch (err) {
      console.error('Response handling error:', err);
      setIsSpeaking(false);
      setVoiceStatus('Ready');
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isSpeaking && !isMuted) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setVoiceStatus('Ready');
    }
  };

  // Retry connection
  const retryConnection = () => {
    if (userId) {
      initializeVoiceAssistant();
    }
  };

  // Don't render if assistant is not configured
  if (!isConfigured || envError) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2 text-amber-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{envError || 'Voice assistant is not configured'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Voice Assistant Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className={`relative ${isListening ? 'animate-pulse' : ''}`}>
            <Bot className="w-6 h-6 text-emerald-600" />
            {isListening && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Voice Assistant</h3>
            <p className="text-sm text-gray-500">{voiceStatus}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Volume Control */}
          <button
            onClick={toggleMute}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Connection Status */}
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              onClick={retryConnection}
              className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Voice Interaction Area */}
      <div className="p-4">
        {/* Last Transcript and Response */}
        {(lastTranscript || lastResponse) && (
          <div className="mb-4 space-y-2">
            {lastTranscript && (
              <div className="flex items-start space-x-2">
                <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">You said:</p>
                  <p className="text-sm text-gray-600">{lastTranscript}</p>
                </div>
              </div>
            )}

            {lastResponse && (
              <div className="flex items-start space-x-2">
                <Bot className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Assistant:</p>
                  <p className="text-sm text-gray-600">{lastResponse}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voice Controls */}
        <div className="flex items-center justify-center">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isConnected || isSpeaking}
            className={`relative group ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            } text-white p-4 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}

            {/* Ripple effect when listening */}
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Voice Tips */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {`Try saying: "Check my inventory", "Check deliveries", "Commit 50kg to order ABC"`}
          </p>
        </div>
      </div>

      {/* LiveKit Room Component (when token is available) */}
      {token && (
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          connect={true}
          onConnected={() => handleConnectionChange(ConnectionState.Connected)}
          onDisconnected={() => handleConnectionChange(ConnectionState.Disconnected)}
          audio={true}
          video={false}
        />
      )}
    </div>
  );
};

export default VoiceAssistantComponent;
