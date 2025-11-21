/**
 * Circular Audio Buffer for Wake Word Detection
 * Manages continuous audio streaming and provides recent audio chunks
 */

export class CircularAudioBuffer {
  constructor(options = {}) {
    this.maxDuration = options.maxDuration || 3000; // 3 seconds default
    this.sampleRate = options.sampleRate || 16000;
    this.channels = options.channels || 1;
    this.maxSize = Math.ceil(this.maxDuration * this.sampleRate * this.channels);
    
    this.buffer = new Float32Array(this.maxSize);
    this.writeIndex = 0;
    this.writeCount = 0;
    this.isFull = false;
    
    // Statistics
    this.totalSamplesWritten = 0;
    this.overrunCount = 0;
    
    console.log(`🎵 Audio buffer initialized: ${this.maxDuration}ms, ${this.sampleRate}Hz`);
  }

  /**
   * Write audio data to the circular buffer
   */
  write(audioData) {
    const dataLength = audioData.length;
    const availableSpace = this.maxSize - this.writeIndex;
    
    if (dataLength <= availableSpace) {
      // Write in one go
      this.buffer.set(audioData, this.writeIndex);
      this.writeIndex += dataLength;
    } else {
      // Write in two parts (wrap around)
      this.buffer.set(audioData.subarray(0, availableSpace), this.writeIndex);
      this.buffer.set(audioData.subarray(availableSpace), 0);
      this.writeIndex = dataLength - availableSpace;
      this.isFull = true;
      this.overrunCount++;
    }
    
    this.writeCount++;
    this.totalSamplesWritten += dataLength;
    
    // Mark as full if we've written enough data
    if (this.totalSamplesWritten >= this.maxSize) {
      this.isFull = true;
    }
  }

  /**
   * Get the most recent audio data of specified duration
   */
  getRecent(duration = 2000) {
    const requestedSamples = Math.floor(duration * this.sampleRate * this.channels);
    
    if (!this.isFull && this.totalSamplesWritten < requestedSamples) {
      // Not enough data yet
      const availableSamples = this.writeIndex;
      return this.buffer.subarray(0, availableSamples);
    }
    
    const recentData = new Float32Array(requestedSamples);
    const startIndex = (this.writeIndex - requestedSamples + this.maxSize) % this.maxSize;
    
    if (startIndex + requestedSamples <= this.maxSize) {
      // Get in one go
      recentData.set(this.buffer.subarray(startIndex, startIndex + requestedSamples));
    } else {
      // Get in two parts (wrap around)
      const firstPart = this.maxSize - startIndex;
      recentData.set(this.buffer.subarray(startIndex), 0);
      recentData.set(this.buffer.subarray(0, requestedSamples - firstPart), firstPart);
    }
    
    return recentData;
  }

  /**
   * Get all audio data in the buffer
   */
  getAll() {
    if (!this.isFull) {
      return this.buffer.subarray(0, this.writeIndex);
    }
    
    const allData = new Float32Array(this.maxSize);
    const startIndex = this.writeIndex;
    
    // Copy from write index to end
    allData.set(this.buffer.subarray(startIndex), 0);
    // Copy from start to write index
    allData.set(this.buffer.subarray(0, startIndex), this.maxSize - startIndex);
    
    return allData;
  }

  /**
   * Clear the buffer
   */
  clear() {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.writeCount = 0;
    this.isFull = false;
    this.totalSamplesWritten = 0;
    this.overrunCount = 0;
    
    console.log('🎵 Audio buffer cleared');
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      maxSize: this.maxSize,
      currentSize: this.isFull ? this.maxSize : this.writeIndex,
      utilization: this.isFull ? 1.0 : (this.writeIndex / this.maxSize),
      writeCount: this.writeCount,
      totalSamplesWritten: this.totalSamplesWritten,
      overrunCount: this.overrunCount,
      durationMs: (this.isFull ? this.maxSize : this.writeIndex) / (this.sampleRate * this.channels) * 1000,
      isFull: this.isFull
    };
  }

  /**
   * Convert Float32Array to Int16Array (for sending to APIs)
   */
  static floatToInt16(floatData) {
    const int16Data = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      int16Data[i] = Math.max(-32768, Math.min(32767, floatData[i] * 32767));
    }
    return int16Data;
  }

  /**
   * Convert Int16Array to Float32Array
   */
  static int16ToFloat(int16Data) {
    const floatData = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      floatData[i] = int16Data[i] / 32767.0;
    }
    return floatData;
  }

  /**
   * Get audio data as WAV format (for debugging/testing)
   */
  getWAV(duration = 2000) {
    const audioData = this.getRecent(duration);
    const int16Data = CircularAudioBuffer.floatToInt16(audioData);
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + int16Data.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, this.channels, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * this.channels * 2, true);
    view.setUint16(32, this.channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, int16Data.length * 2, true);
    
    // Combine header and data
    const wavFile = new Uint8Array(wavHeader.byteLength + int16Data.length * 2);
    wavFile.set(new Uint8Array(wavHeader), 0);
    wavFile.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavFile;
  }

  /**
   * Calculate audio level (RMS)
   */
  getAudioLevel(duration = 500) {
    const audioData = this.getRecent(duration);
    
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    
    const rms = Math.sqrt(sum / audioData.length);
    return Math.max(0, Math.min(1, rms * 10)); // Normalize to 0-1
  }

  /**
   * Detect silence in recent audio
   */
  isSilent(duration = 1000, threshold = 0.01) {
    const level = this.getAudioLevel(duration);
    return level < threshold;
  }

  /**
   * Get buffer fill percentage
   */
  getFillPercentage() {
    if (this.isFull) return 100;
    return (this.writeIndex / this.maxSize) * 100;
  }
}

/**
 * Audio Buffer Manager - High-level interface for audio buffering
 */
export class AudioBufferManager {
  constructor(options = {}) {
    this.buffers = new Map();
    this.defaultOptions = {
      maxDuration: 3000,
      sampleRate: 16000,
      channels: 1
    };
    
    // Create default buffer
    this.defaultBuffer = new CircularAudioBuffer({
      ...this.defaultOptions,
      ...options
    });
    
    this.buffers.set('default', this.defaultBuffer);
    
    // Statistics
    this.totalBuffersCreated = 1;
    this.totalWrites = 0;
  }

  /**
   * Create a new named buffer
   */
  createBuffer(name, options = {}) {
    if (this.buffers.has(name)) {
      console.warn(`Buffer "${name}" already exists`);
      return this.buffers.get(name);
    }
    
    const buffer = new CircularAudioBuffer({
      ...this.defaultOptions,
      ...options
    });
    
    this.buffers.set(name, buffer);
    this.totalBuffersCreated++;
    
    console.log(`🎵 Created audio buffer "${name}"`);
    return buffer;
  }

  /**
   * Get a buffer by name
   */
  getBuffer(name = 'default') {
    return this.buffers.get(name);
  }

  /**
   * Write to default buffer
   */
  write(audioData) {
    this.defaultBuffer.write(audioData);
    this.totalWrites++;
  }

  /**
   * Write to specific buffer
   */
  writeToBuffer(name, audioData) {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      console.error(`Buffer "${name}" not found`);
      return false;
    }
    
    buffer.write(audioData);
    this.totalWrites++;
    return true;
  }

  /**
   * Get recent audio from default buffer
   */
  getRecent(duration = 2000) {
    return this.defaultBuffer.getRecent(duration);
  }

  /**
   * Get recent audio from specific buffer
   */
  getRecentFromBuffer(name, duration = 2000) {
    const buffer = this.buffers.get(name);
    if (!buffer) {
      console.error(`Buffer "${name}" not found`);
      return null;
    }
    
    return buffer.getRecent(duration);
  }

  /**
   * Clear all buffers
   */
  clearAll() {
    for (const buffer of this.buffers.values()) {
      buffer.clear();
    }
    console.log('🎵 All audio buffers cleared');
  }

  /**
   * Clear specific buffer
   */
  clearBuffer(name) {
    const buffer = this.buffers.get(name);
    if (buffer) {
      buffer.clear();
    }
  }

  /**
   * Get statistics for all buffers
   */
  getStats() {
    const stats = {
      totalBuffersCreated: this.totalBuffersCreated,
      totalWrites: this.totalWrites,
      buffers: {}
    };
    
    for (const [name, buffer] of this.buffers.entries()) {
      stats.buffers[name] = buffer.getStats();
    }
    
    return stats;
  }

  /**
   * Cleanup all buffers
   */
  cleanup() {
    this.buffers.clear();
    this.defaultBuffer = null;
    this.totalBuffersCreated = 0;
    this.totalWrites = 0;
    
    console.log('🎵 Audio buffer manager cleaned up');
  }
}

export default CircularAudioBuffer;
