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
  Settings,
  Play,
  Pause
} from 'lucide-react';

// LiveKit imports
import { LiveKitRoom, useConnectionState, ConnectionState } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

// Environment validation
import { isVoiceAssistantConfigured, getEnvVars, validateClientEnv } from '../../../lib/env-validation';
import { VoiceService } from '../../../lib/voiceService';
import { useWakeWordDetection } from '../../../hooks/useWakeWordDetection';
import VoiceFeedbackIndicator from './VoiceFeedbackIndicator';
import VoiceVisualizer from './VoiceVisualizer';
import VoiceVisualizerControls from './VoiceVisualizerControls';
import { CircularAudioBuffer } from '../../../lib/audioBuffer';

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
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  
  // Visualizer state
  const [visualizerMode, setVisualizerMode] = useState('waveform');
  const [visualizerTheme, setVisualizerTheme] = useState('default');
  const [visualizerSensitivity, setVisualizerSensitivity] = useState(0.7);
  const [visualizerHeight, setVisualizerHeight] = useState(120);
  const [showVisualizerControls, setShowVisualizerControls] = useState(false);
  const [audioStream, setAudioStream] = useState(null);

  // Refs
  const roomRef = useRef(null);
  const audioRef = useRef(null);

  // Handle wake word detection
  const handleWakeWordDetected = async (detection) => {
    console.log('🎯 Wake word detected:', detection);
    
    try {
      // Send audio to server for confirmation if available
      if (detection.audioData && isConnected) {
        const audioBuffer = detection.audioData;
        const int16Data = CircularAudioBuffer.floatToInt16(audioBuffer.data);
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
        
        const response = await fetch('/api/wake-word/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: base64Audio,
            wakeWord: detection.wakeWord,
            confidence: detection.score,
            userId: userId
          })
        });
        
        const result = await response.json();
        
        if (result.confirmed) {
          console.log('✅ Wake word confirmed by server');
          setVoiceStatus('Wake word confirmed! Activating...');
          showToast?.('Wake word detected! Say your command...', 'success');
          
          // Start listening for command after a short delay
          setTimeout(() => {
            startListening();
          }, 1000);
        } else {
          console.log('❌ Wake word not confirmed by server');
          showToast?.('Wake word not confirmed. Please try again.', 'info');
        }
      } else {
        // Fallback to client-side detection
        setVoiceStatus('Wake word detected! Activating...');
        showToast?.('Wake word detected! Say your command...', 'success');
        
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } catch (error) {
      console.error('Wake word confirmation error:', error);
      // Fallback to activation even if confirmation fails
      setVoiceStatus('Wake word detected! Activating...');
      startListening();
    }
  };

  // Wake word detection
  const wakeWordDetection = useWakeWordDetection({
    autoStart: wakeWordEnabled,
    sensitivity: 0.7,
    wakeWords: ['hey jodex', 'hi jodex'],
    onWakeWordDetected: handleWakeWordDetected,
    onError: (error) => {
      console.error('Wake word detection error:', error);
      if (wakeWordEnabled) {
        showToast?.('Wake word detection error: ' + error.message, 'warning');
      }
    },
    onStatusChange: (newStatus, oldStatus) => {
      console.log(`Wake word status: ${oldStatus} → ${newStatus}`);
    }
  });

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

    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      setVoiceStatus('Speech recognition not supported');
      showToast?.('Speech recognition is not supported in your browser', 'error');
      return;
    }

    try {
      setIsListening(true);
      setVoiceStatus('Listening...');
      setError(null);

      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognized:', transcript);
        handleVoiceCommand(transcript);
        stopListening();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        let errorMessage = 'Speech recognition failed';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Speech recognition requires HTTPS. You can also type your command below.';
            // Show text input fallback after a delay
            setTimeout(() => {
              const userInput = prompt('Speech recognition failed. Type your command:');
              if (userInput && userInput.trim()) {
                handleVoiceCommand(userInput.trim());
              }
            }, 1000);
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        setError(errorMessage);
        setVoiceStatus('Error');
        showToast?.(errorMessage, 'error');
        stopListening();
      };

      recognition.onend = () => {
        if (isListening) {
          stopListening();
        }
      };

      // Store recognition instance and start
      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error('Microphone access error:', err);
      setError('Microphone access denied');
      setIsListening(false);
      setVoiceStatus('Microphone access denied');
      showToast?.('Please allow microphone access', 'error');
    }
  };

  // Ref to store recognition instance
  const recognitionRef = useRef(null);

  // Stop voice recording
  const stopListening = () => {
    setIsListening(false);
    setVoiceStatus('Ready');

    // Stop speech recognition if it's running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.log('Speech recognition already stopped or not running');
      }
    }

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

      // Use VoiceService for sophisticated command parsing and response generation
      const command = VoiceService.parseCommand(transcript);
      const response = await VoiceService.generateResponse(command, { userId });

      handleAssistantResponse(response);

    } catch (err) {
      console.error('Voice command processing error:', err);
      setError('Failed to process voice command');
      setVoiceStatus('Error processing command');
      showToast?.('Voice command failed', 'error');
    }
  };


  // Handle assistant response
  const handleAssistantResponse = async (response) => {
    try {
      setLastResponse(response.text);
      setVoiceStatus('Speaking...');
      setIsSpeaking(true);

      // Set up audio stream for visualizer
      if ('speechSynthesis' in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(response.text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = volume;

        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;

        // Capture audio stream for visualizer
        utterance.onstart = () => {
          // Create audio context and destination
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const destination = audioContext.createMediaStreamDestination();
          const source = audioContext.createMediaStreamSource();
          
          // Connect utterance to destination
          const gainNode = audioContext.createGain();
          gainNode.gain.value = volume;
          
          source.connect(gainNode);
          gainNode.connect(destination);
          
          // Store the stream for visualizer
          setAudioStream(destination.stream);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setVoiceStatus('Ready');
          setAudioStream(null);
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          setIsSpeaking(false);
          setVoiceStatus('Ready');
          setAudioStream(null);
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
      setAudioStream(null);
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
          <VoiceFeedbackIndicator
            isListening={isListening}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
            volume={volume}
            status={voiceStatus}
            showText={false}
            size="sm"
            isWakeWordActive={wakeWordDetection.isActive}
            wakeWordStatus={wakeWordDetection.status}
            wakeWordDetected={wakeWordDetection.isDetected}
            audioLevel={wakeWordDetection.audioLevel}
          />
          <div>
            <h3 className="font-semibold text-gray-900">Voice Assistant</h3>
            <p className="text-sm text-gray-500">{voiceStatus}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Wake Word Toggle */}
          <button
            onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              wakeWordEnabled
                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={wakeWordEnabled ? 'Disable wake word' : 'Enable wake word'}
          >
            {wakeWordEnabled ? (
              <Bot className="w-5 h-5" />
            ) : (
              <Bot className="w-5 h-5 opacity-50" />
            )}
          </button>

          {/* Visualizer Toggle */}
          <button
            onClick={() => setShowVisualizerControls(!showVisualizerControls)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title={showVisualizerControls ? 'Hide visualizer' : 'Show visualizer'}
          >
            <Settings className="w-5 h-5" />
          </button>

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

        {/* Voice Visualizer */}
        <div className="mb-4">
          <VoiceVisualizer
            isActive={isSpeaking || isListening}
            mode={visualizerMode}
            theme={visualizerTheme}
            sensitivity={visualizerSensitivity}
            height={visualizerHeight}
            audioStream={audioStream}
            showControls={true}
          />
        </div>

        {/* Visualizer Controls Overlay */}
        {showVisualizerControls && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
              <VoiceVisualizerControls
                mode={visualizerMode}
                theme={visualizerTheme}
                sensitivity={visualizerSensitivity}
                height={visualizerHeight}
                showControls={true}
                onModeChange={setVisualizerMode}
                onThemeChange={setVisualizerTheme}
                onSensitivityChange={setVisualizerSensitivity}
                onHeightChange={setVisualizerHeight}
                onControlsToggle={() => setShowVisualizerControls(false)}
                className="w-full"
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowVisualizerControls(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice Tips */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {isConnected
              ? wakeWordEnabled
                ? `Say "Hey Jodex" to activate, or try: "Check my inventory", "Check deliveries", "Weather forecast", "Market prices"`
                : `Try saying: "Check my inventory", "Check deliveries", "Weather forecast", "Market prices"`
              : 'Connecting to voice service...'
            }
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
