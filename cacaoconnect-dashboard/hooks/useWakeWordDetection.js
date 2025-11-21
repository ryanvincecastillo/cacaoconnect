import { useState, useEffect, useRef, useCallback } from 'react';
import { WakeWordDetector } from '../lib/wakeWordDetector';
import { CircularAudioBuffer } from '../lib/audioBuffer';

/**
 * React hook for managing wake word detection state and lifecycle
 */
export const useWakeWordDetection = (options = {}) => {
  // Wake word detector instance
  const detectorRef = useRef(null);
  const audioBufferRef = useRef(null);
  
  // State management
  const [status, setStatus] = useState('idle');
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [lastDetection, setLastDetection] = useState(null);
  const [sensitivity, setSensitivity] = useState(options.sensitivity || 0.7);
  const [wakeWords, setWakeWords] = useState(options.wakeWords || ['hey jodex', 'hi jodex']);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  
  // Event callbacks
  const onWakeWordDetectedRef = useRef(options.onWakeWordDetected);
  const onErrorRef = useRef(options.onError);
  const onStatusChangeRef = useRef(options.onStatusChange);
  
  // Update callback refs when options change
  useEffect(() => {
    onWakeWordDetectedRef.current = options.onWakeWordDetected;
    onErrorRef.current = options.onError;
    onStatusChangeRef.current = options.onStatusChange;
  }, [options.onWakeWordDetected, options.onError, options.onStatusChange]);
  
  // Initialize wake word detector
  const initialize = useCallback(async () => {
    try {
      setError(null);
      
      // Check browser support
      const hasSupport = 'webkitSpeechRecognition' in window || 
                        'SpeechRecognition' in window ||
                        'AudioContext' in window ||
                        'webkitAudioContext' in window;
      
      if (!hasSupport) {
        setIsSupported(false);
        throw new Error('Wake word detection is not supported in this browser');
      }
      
      // Create wake word detector
      detectorRef.current = new WakeWordDetector({
        wakeWords,
        sensitivity,
        onWakeWordDetected: handleWakeWordDetected,
        onError: handleDetectorError,
        onStatusChange: handleStatusChange,
        ...options.detectorOptions
      });
      
      // Create audio buffer for monitoring
      audioBufferRef.current = new CircularAudioBuffer({
        maxDuration: 3000,
        sampleRate: 16000,
        ...options.bufferOptions
      });
      
      // Initialize detector
      await detectorRef.current.initialize();
      
      setStatus('ready');
      
    } catch (err) {
      setError(err.message);
      setStatus('error');
      onErrorRef.current?.(err);
    }
  }, [wakeWords, sensitivity, options.detectorOptions, options.bufferOptions]);
  
  // Handle wake word detection
  const handleWakeWordDetected = useCallback((detection) => {
    console.log('🎯 Wake word detected:', detection);
    
    setLastDetection(detection);
    setDetectionHistory(prev => [...prev.slice(-9), detection]);
    setStatus('detected');
    setIsActive(true);
    
    // Reset to detecting state after a short delay
    setTimeout(() => {
      if (detectorRef.current) {
        detectorRef.current.setStatus('detecting');
      }
      setStatus('detecting');
    }, 1000);
    
    onWakeWordDetectedRef.current?.(detection);
  }, []);
  
  // Handle detector errors
  const handleDetectorError = useCallback((error) => {
    console.error('Wake word detector error:', error);
    setError(error.message);
    setStatus('error');
    onErrorRef.current?.(error);
  }, []);
  
  // Handle status changes
  const handleStatusChange = useCallback((newStatus, oldStatus) => {
    console.log(`Wake word status: ${oldStatus} → ${newStatus}`);
    setStatus(newStatus);
    onStatusChangeRef.current?.(newStatus, oldStatus);
  }, []);
  
  // Start wake word detection
  const start = useCallback(async () => {
    if (!detectorRef.current) {
      await initialize();
    }
    
    if (detectorRef.current) {
      detectorRef.current.start();
    }
  }, [initialize]);
  
  // Stop wake word detection
  const stop = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.stop();
    }
    setIsActive(false);
  }, []);
  
  // Toggle wake word detection
  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);
  
  // Update sensitivity
  const updateSensitivity = useCallback((newSensitivity) => {
    const normalizedSensitivity = Math.max(0.1, Math.min(1.0, newSensitivity));
    setSensitivity(normalizedSensitivity);
    
    if (detectorRef.current) {
      detectorRef.current.setSensitivity(normalizedSensitivity);
    }
  }, []);
  
  // Update wake words
  const updateWakeWords = useCallback((newWakeWords) => {
    const wordsArray = Array.isArray(newWakeWords) ? newWakeWords : [newWakeWords];
    setWakeWords(wordsArray);
    
    if (detectorRef.current) {
      detectorRef.current.setWakeWords(wordsArray);
    }
  }, []);
  
  // Clear detection history
  const clearHistory = useCallback(() => {
    setDetectionHistory([]);
    setLastDetection(null);
    
    if (detectorRef.current) {
      detectorRef.current.clearHistory();
    }
  }, []);
  
  // Get detector statistics
  const getStats = useCallback(() => {
    if (!detectorRef.current) return null;
    
    return {
      status,
      isActive,
      detectionHistory: detectorRef.current.getDetectionHistory(),
      sensitivity,
      wakeWords,
      error,
      audioStats: audioBufferRef.current?.getStats()
    };
  }, [status, isActive, sensitivity, wakeWords, error]);
  
  // Monitor audio level
  useEffect(() => {
    if (!audioBufferRef.current) return;
    
    const interval = setInterval(() => {
      const level = audioBufferRef.current.getAudioLevel(500);
      setAudioLevel(level);
    }, 100);
    
    return () => clearInterval(interval);
  }, [status]);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
    
    return () => {
      // Cleanup on unmount
      if (detectorRef.current) {
        detectorRef.current.cleanup();
        detectorRef.current = null;
      }
      
      if (audioBufferRef.current) {
        audioBufferRef.current = null;
      }
    };
  }, []); // Only run once on mount
  
  // Auto-start if autoStart option is true
  useEffect(() => {
    if (options.autoStart && status === 'ready') {
      start();
    }
  }, [options.autoStart, status, start]);
  
  // Handle visibility change (pause when tab is not visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        stop();
      } else if (!document.hidden && options.autoStart && status === 'ready') {
        start();
      }
    };
    
    if (options.pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    return () => {
      if (options.pauseOnHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [isActive, status, options.autoStart, options.pauseOnHidden, start, stop]);
  
  return {
    // State
    status,
    isActive,
    isSupported,
    error,
    detectionHistory,
    lastDetection,
    sensitivity,
    wakeWords,
    audioLevel,
    
    // Actions
    initialize,
    start,
    stop,
    toggle,
    updateSensitivity,
    updateWakeWords,
    clearHistory,
    getStats,
    
    // Computed values
    isReady: status === 'ready',
    isDetecting: status === 'detecting',
    isDetected: status === 'detected',
    isError: status === 'error',
    isInitializing: status === 'initializing',
    
    // Status helpers
    canStart: isReady && !isActive && !error,
    canStop: isActive,
    needsPermission: error?.includes('microphone')
  };
};

/**
 * Simplified hook for basic wake word detection
 */
export const useSimpleWakeWord = (onWakeWord, options = {}) => {
  const result = useWakeWordDetection({
    onWakeWordDetected: onWakeWord,
    autoStart: true,
    sensitivity: 0.7,
    wakeWords: ['hey jodex'],
    ...options
  });
  
  return {
    isActive: result.isActive,
    error: result.error,
    isSupported: result.isSupported,
    start: result.start,
    stop: result.stop,
    lastDetection: result.lastDetection
  };
};

export default useWakeWordDetection;
