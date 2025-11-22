import React, { useState, useCallback, useRef } from 'react';

/**
 * Wake Word Detection Hook
 *
 * This hook provides wake word detection functionality for the voice assistant.
 * It supports both client-side and server-side detection methods.
 *
 * Wake words: "Hey Cacao", "Okay Cacao", "Hi Assistant"
 */

const WAKE_WORDS = [
  'hey cacao',
  'okay cacao',
  'hi assistant',
  'hello cacao',
  'cacao assistant'
];

const WAKE_WORD_CONFIDENCE_THRESHOLD = 0.7;

export function useWakeWordDetection(options = {}) {
  const {
    onWakeWordDetected = () => {},
    onWakeWordConfirmed = () => {},
    enabled = true,
    confirmationRequired = true,
    clientSideDetection = true
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timeoutRef = useRef(null);

  // Client-side wake word detection using Web Speech API
  const startClientSideDetection = useCallback(() => {
    if (!clientSideDetection || typeof window === 'undefined') {
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        return false;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        console.log('Wake word detection started');
      };

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();

        // Check if any wake word is detected
        const detectedWakeWord = WAKE_WORDS.find(wakeWord =>
          transcript.includes(wakeWord)
        );

        if (detectedWakeWord) {
          console.log(`Wake word detected: "${detectedWakeWord}"`);
          setWakeWordDetected(true);

          if (confirmationRequired) {
            confirmWakeWord(detectedWakeWord);
          } else {
            onWakeWordDetected(detectedWakeWord);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);

        // Restart detection if still enabled
        if (enabled && !wakeWordDetected) {
          setTimeout(() => startClientSideDetection(), 100);
        }
      };

      recognitionRef.current.start();
      return true;

    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start speech recognition');
      return false;
    }
  }, [clientSideDetection, confirmationRequired, onWakeWordDetected, enabled, wakeWordDetected]);

  // Server-side wake word confirmation
  const confirmWakeWord = useCallback(async (detectedWakeWord) => {
    try {
      console.log(`Confirming wake word: "${detectedWakeWord}"`);

      const response = await fetch('/api/wake-word-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wakeWord: detectedWakeWord,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const result = await response.json();

        if (result.confirmed) {
          console.log('Wake word confirmed by server');
          setWakeWordDetected(true);
          onWakeWordDetected(detectedWakeWord);
          onWakeWordConfirmed(result);
        } else {
          console.log('Wake word not confirmed by server');
          setWakeWordDetected(false);
        }
      } else {
        console.warn('Wake word confirmation failed, proceeding anyway');
        setWakeWordDetected(true);
        onWakeWordDetected(detectedWakeWord);
      }
    } catch (error) {
      console.error('Error confirming wake word:', error);
      // Proceed with client-side detection if server confirmation fails
      setWakeWordDetected(true);
      onWakeWordDetected(detectedWakeWord);
    }
  }, [onWakeWordDetected, onWakeWordConfirmed]);

  // Audio level detection for activation
  const startAudioLevelDetection = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          const source = audioContextRef.current.createMediaStreamSource(stream);

          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);

          const checkAudioLevel = () => {
            if (!isActive && !isListening) return;

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            // If audio level is high enough, consider it as potential wake word
            if (average > 30 && !isListening) {
              startClientSideDetection();
            }

            if (isActive) {
              requestAnimationFrame(checkAudioLevel);
            }
          };

          checkAudioLevel();
        })
        .catch(error => {
          console.error('Failed to access microphone:', error);
          setError('Microphone access denied');
        });
    } catch (error) {
      console.error('Audio level detection failed:', error);
    }
  }, [isActive, isListening, startClientSideDetection]);

  // Start wake word detection
  const start = useCallback(() => {
    if (!enabled) return;

    console.log('Starting wake word detection...');
    setIsActive(true);
    setWakeWordDetected(false);
    setError(null);

    // Start client-side detection
    const clientSideStarted = startClientSideDetection();

    // If client-side detection fails, try audio level detection
    if (!clientSideStarted) {
      startAudioLevelDetection();
    }
  }, [enabled, startClientSideDetection, startAudioLevelDetection]);

  // Stop wake word detection
  const stop = useCallback(() => {
    console.log('Stopping wake word detection...');
    setIsActive(false);
    setIsListening(false);
    setWakeWordDetected(false);

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Reset detection state
  const reset = useCallback(() => {
    setWakeWordDetected(false);
    setError(null);

    // Restart detection if active
    if (isActive) {
      stop();
      setTimeout(start, 100);
    }
  }, [isActive, start, stop]);

  // Auto-stop detection after wake word is detected
  React.useEffect(() => {
    if (wakeWordDetected && confirmationRequired) {
      timeoutRef.current = setTimeout(() => {
        if (isActive) {
          stop();
        }
      }, 30000); // Stop after 30 seconds
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [wakeWordDetected, confirmationRequired, isActive, stop]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    // State
    isActive,
    isListening,
    wakeWordDetected,
    error,

    // Methods
    start,
    stop,
    reset,
    confirmWakeWord,

    // Status
    isSupported: typeof window !== 'undefined' &&
                 (window.SpeechRecognition || window.webkitSpeechRecognition),
    supportedWakeWords: WAKE_WORDS
  };
}

export default useWakeWordDetection;