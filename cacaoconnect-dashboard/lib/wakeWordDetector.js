/**
 * Wake Word Detector for "Hey Jodex" voice activation
 * Uses Web Speech API with continuous listening and pattern matching
 */

export class WakeWordDetector {
  constructor(options = {}) {
    this.wakeWords = options.wakeWords || ['hey jodex', 'hi jodex'];
    this.sensitivity = options.sensitivity || 0.7;
    this.onWakeWordDetected = options.onWakeWordDetected || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    
    this.isListening = false;
    this.recognition = null;
    this.audioContext = null;
    this.microphone = null;
    this.processor = null;
    this.audioBuffer = [];
    this.bufferSize = options.bufferSize || 8192;
    this.maxBufferDuration = options.maxBufferDuration || 3000; // 3 seconds
    
    this.status = 'idle'; // idle, detecting, confirmed, error
    this.detectionHistory = [];
    this.maxHistorySize = 10;
  }

  /**
   * Initialize the wake word detector
   */
  async initialize() {
    try {
      this.setStatus('initializing');
      
      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Speech recognition not supported in this browser');
      }

      // Initialize Web Audio API for audio buffering
      await this.initializeAudioContext();
      
      // Initialize Speech Recognition
      this.initializeSpeechRecognition();
      
      this.setStatus('idle');
      console.log('🎯 Wake Word Detector initialized successfully');
      
    } catch (error) {
      this.setStatus('error');
      this.onError(error);
      throw error;
    }
  }

  /**
   * Check if browser supports required APIs
   */
  checkBrowserSupport() {
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
    const hasMediaDevices = 'mediaDevices' in window && 'getUserMedia' in window.mediaDevices;
    
    return hasSpeechRecognition && hasWebAudio && hasMediaDevices;
  }

  /**
   * Initialize Web Audio API context and microphone
   */
  async initializeAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.processor = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        this.addToBuffer(inputData);
      };
      
      this.microphone.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      
    } catch (error) {
      throw new Error(`Failed to initialize audio context: ${error.message}`);
    }
  }

  /**
   * Initialize speech recognition for continuous listening
   */
  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configure for continuous listening
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;
    
    this.recognition.onresult = (event) => {
      this.handleSpeechResult(event);
    };
    
    this.recognition.onerror = (event) => {
      this.handleRecognitionError(event);
    };
    
    this.recognition.onend = () => {
      // Restart recognition if it was intentionally stopped
      if (this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('Failed to restart recognition:', error);
            }
          }
        }, 100);
      }
    };
  }

  /**
   * Add audio data to circular buffer
   */
  addToBuffer(audioData) {
    const now = Date.now();
    
    // Add timestamped audio data
    this.audioBuffer.push({
      data: new Float32Array(audioData),
      timestamp: now
    });
    
    // Remove old audio data beyond max duration
    const cutoffTime = now - this.maxBufferDuration;
    this.audioBuffer = this.audioBuffer.filter(item => item.timestamp > cutoffTime);
  }

  /**
   * Get recent audio data for confirmation
   */
  getRecentAudio(duration = 2000) {
    const now = Date.now();
    const cutoffTime = now - duration;
    
    const recentAudio = this.audioBuffer.filter(item => item.timestamp > cutoffTime);
    
    if (recentAudio.length === 0) return null;
    
    // Combine all audio data
    const totalLength = recentAudio.reduce((sum, item) => sum + item.data.length, 0);
    const combinedData = new Float32Array(totalLength);
    
    let offset = 0;
    for (const item of recentAudio) {
      combinedData.set(item.data, offset);
      offset += item.data.length;
    }
    
    return {
      data: combinedData,
      sampleRate: this.audioContext.sampleRate,
      duration: totalLength / this.audioContext.sampleRate
    };
  }

  /**
   * Start wake word detection
   */
  start() {
    if (this.isListening) {
      console.log('Wake word detector already listening');
      return;
    }
    
    try {
      this.isListening = true;
      this.setStatus('detecting');
      
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      // Start speech recognition
      this.recognition.start();
      
      console.log('🎯 Wake word detection started');
      
    } catch (error) {
      this.setStatus('error');
      this.onError(error);
    }
  }

  /**
   * Stop wake word detection
   */
  stop() {
    if (!this.isListening) {
      return;
    }
    
    this.isListening = false;
    this.setStatus('idle');
    
    try {
      if (this.recognition) {
        this.recognition.stop();
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.suspend();
      }
      
      console.log('🎯 Wake word detection stopped');
      
    } catch (error) {
      console.error('Error stopping wake word detection:', error);
    }
  }

  /**
   * Handle speech recognition results
   */
  handleSpeechResult(event) {
    const current = event.resultIndex;
    const result = event.results[current];
    
    if (!result.isFinal) {
      return; // Only process final results for wake word detection
    }
    
    // Check all alternatives for wake words
    for (let i = 0; i < result.length; i++) {
      const transcript = result[i].transcript.toLowerCase().trim();
      const confidence = result[i].confidence;
      
      // Check if any wake word is in the transcript
      for (const wakeWord of this.wakeWords) {
        if (transcript.includes(wakeWord)) {
          const detectionScore = this.calculateDetectionScore(transcript, wakeWord, confidence);
          
          if (detectionScore >= this.sensitivity) {
            this.handleWakeWordDetected(transcript, wakeWord, detectionScore);
            return;
          }
        }
      }
    }
  }

  /**
   * Calculate detection score based on transcript match and confidence
   */
  calculateDetectionScore(transcript, wakeWord, confidence) {
    // Exact match gets higher score
    const exactMatch = transcript === wakeWord;
    const containsMatch = transcript.includes(wakeWord);
    
    let score = confidence || 0.5;
    
    if (exactMatch) {
      score *= 1.2;
    } else if (containsMatch) {
      // Check how much extra text there is
      const extraTextRatio = (transcript.length - wakeWord.length) / transcript.length;
      score *= (1 - extraTextRatio * 0.5);
    }
    
    // Check if it's a standalone phrase (not in the middle of other words)
    const words = transcript.split(' ');
    const wakeWordWords = wakeWord.split(' ');
    
    let standaloneBonus = 1.0;
    for (let i = 0; i <= words.length - wakeWordWords.length; i++) {
      const slice = words.slice(i, i + wakeWordWords.length).join(' ');
      if (slice === wakeWord) {
        standaloneBonus = 1.1;
        break;
      }
    }
    
    score *= standaloneBonus;
    
    return Math.min(score, 1.0);
  }

  /**
   * Handle wake word detection
   */
  handleWakeWordDetected(transcript, wakeWord, score) {
    console.log(`🎯 Wake word detected: "${transcript}" (score: ${score.toFixed(2)})`);
    
    // Add to detection history
    this.detectionHistory.push({
      transcript,
      wakeWord,
      score,
      timestamp: Date.now()
    });
    
    // Trim history
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.shift();
    }
    
    // Get recent audio for confirmation
    const recentAudio = this.getRecentAudio();
    
    this.setStatus('confirmed');
    this.onWakeWordDetected({
      transcript,
      wakeWord,
      score,
      audioData: recentAudio,
      timestamp: Date.now()
    });
  }

  /**
   * Handle recognition errors
   */
  handleRecognitionError(event) {
    console.error('Speech recognition error:', event.error);
    
    let errorMessage = 'Speech recognition error';
    
    switch (event.error) {
      case 'no-speech':
        // Normal operation, no error
        return;
      case 'audio-capture':
        errorMessage = 'Microphone not available';
        break;
      case 'not-allowed':
        errorMessage = 'Microphone access denied';
        break;
      case 'network':
        errorMessage = 'Network error';
        break;
      case 'service-not-allowed':
        errorMessage = 'Speech recognition service not allowed';
        break;
      default:
        errorMessage = `Speech recognition error: ${event.error}`;
    }
    
    this.setStatus('error');
    this.onError(new Error(errorMessage));
  }

  /**
   * Update status and notify listeners
   */
  setStatus(newStatus) {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      this.onStatusChange(newStatus, oldStatus);
      console.log(`🎯 Wake word detector status: ${oldStatus} → ${newStatus}`);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get detection history
   */
  getDetectionHistory() {
    return [...this.detectionHistory];
  }

  /**
   * Clear detection history
   */
  clearHistory() {
    this.detectionHistory = [];
  }

  /**
   * Update sensitivity
   */
  setSensitivity(newSensitivity) {
    this.sensitivity = Math.max(0.1, Math.min(1.0, newSensitivity));
    console.log(`🎯 Wake word sensitivity set to: ${this.sensitivity}`);
  }

  /**
   * Update wake words
   */
  setWakeWords(newWakeWords) {
    this.wakeWords = Array.isArray(newWakeWords) ? newWakeWords : [newWakeWords];
    console.log(`🎯 Wake words updated to:`, this.wakeWords);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stop();
    
    try {
      if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
      }
      
      if (this.microphone) {
        this.microphone.disconnect();
        this.microphone = null;
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      if (this.recognition) {
        this.recognition = null;
      }
      
      this.audioBuffer = [];
      this.detectionHistory = [];
      
      console.log('🎯 Wake word detector cleaned up');
      
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default WakeWordDetector;
