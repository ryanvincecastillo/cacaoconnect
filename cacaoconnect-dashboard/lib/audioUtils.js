/**
 * Audio Buffer Utilities
 *
 * Utility functions for handling audio buffers, conversions, and processing
 * in the CacaoConnect voice assistant system.
 */

/**
 * Convert audio buffer to different formats
 */
export class AudioBufferUtils {

  /**
   * Convert Web Audio API AudioBuffer to WAV format
   */
  static audioBufferToWAV(audioBuffer) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2 + 44;
    const outputBuffer = new ArrayBuffer(length);
    const view = new DataView(outputBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };

    const setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // file length
    setUint32(length - 8);
    // RIFF type
    setUint32(0x45564157);
    // format chunk identifier
    setUint32(0x20746d66);
    // format chunk length
    setUint32(16);
    // sample format (raw)
    setUint16(1);
    // channel count
    setUint16(numberOfChannels);
    // sample rate
    setUint32(audioBuffer.sampleRate);
    // byte rate
    setUint32(audioBuffer.sampleRate * numberOfChannels * 2);
    // block align
    setUint16(numberOfChannels * 2);
    // bits per sample
    setUint16(16);
    // data chunk identifier
    setUint32(0x61746164);
    // data chunk length
    setUint32(length - pos - 4);

    // Write interleaved data
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return outputBuffer;
  }

  /**
   * Convert Float32Array to Int16Array
   */
  static floatToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    return int16Array;
  }

  /**
   * Convert Int16Array to Float32Array
   */
  static int16ToFloat(int16Array) {
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 0x8000;
    }
    return float32Array;
  }

  /**
   * Create audio buffer from raw audio data
   */
  static createAudioBuffer(audioContext, audioData, sampleRate = 16000) {
    const float32Data = this.int16ToFloat(new Int16Array(audioData));
    return audioContext.createBuffer(1, float32Data.length, sampleRate);
  }

  /**
   * Merge multiple audio buffers
   */
  static mergeAudioBuffers(buffers, audioContext) {
    if (buffers.length === 0) return null;
    if (buffers.length === 1) return buffers[0];

    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const numberOfChannels = buffers[0].numberOfChannels;
    const sampleRate = buffers[0].sampleRate;

    const mergedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

    for (let channel = 0; channel < numberOfChannels; channel++) {
      const mergedChannel = mergedBuffer.getChannelData(channel);
      let offset = 0;

      for (const buffer of buffers) {
        const sourceChannel = buffer.getChannelData(channel);
        mergedChannel.set(sourceChannel, offset);
        offset += buffer.length;
      }
    }

    return mergedBuffer;
  }

  /**
   * Split audio buffer into chunks
   */
  static splitAudioBuffer(audioBuffer, chunkSize) {
    const chunks = [];
    const numberOfChannels = audioBuffer.numberOfChannels;
    const totalLength = audioBuffer.length;

    for (let start = 0; start < totalLength; start += chunkSize) {
      const end = Math.min(start + chunkSize, totalLength);
      const chunkLength = end - start;

      const chunk = audioBuffer.context.createBuffer(
        numberOfChannels,
        chunkLength,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sourceChannel = audioBuffer.getChannelData(channel);
        const targetChannel = chunk.getChannelData(channel);
        targetChannel.set(sourceChannel.subarray(start, end));
      }

      chunks.push(chunk);
    }

    return chunks;
  }
}

/**
 * Audio processing utilities
 */
export class AudioProcessor {

  /**
   * Apply noise reduction to audio data
   */
  static applyNoiseReduction(audioData, threshold = 0.01) {
    const processedData = new Float32Array(audioData.length);

    for (let i = 0; i < audioData.length; i++) {
      // Simple gate: reduce audio below threshold
      const sample = Math.abs(audioData[i]);
      if (sample < threshold) {
        processedData[i] = audioData[i] * (sample / threshold);
      } else {
        processedData[i] = audioData[i];
      }
    }

    return processedData;
  }

  /**
   * Normalize audio levels
   */
  static normalizeAudio(audioData) {
    const maxAmplitude = Math.max(...audioData.map(Math.abs));

    if (maxAmplitude === 0) return audioData; // Silent audio

    const normalizationFactor = 1 / maxAmplitude;
    return audioData.map(sample => sample * normalizationFactor);
  }

  /**
   * Apply fade in/out to audio
   */
  static applyFade(audioData, fadeInDuration = 0.1, fadeOutDuration = 0.1, sampleRate = 16000) {
    const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
    const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);
    const length = audioData.length;
    const fadedAudio = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let gain = 1.0;

      // Apply fade in
      if (i < fadeInSamples) {
        gain = i / fadeInSamples;
      }
      // Apply fade out
      else if (i >= length - fadeOutSamples) {
        gain = (length - i) / fadeOutSamples;
      }

      fadedAudio[i] = audioData[i] * gain;
    }

    return fadedAudio;
  }

  /**
   * Calculate audio volume/RMS
   */
  static calculateVolume(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }

  /**
   * Detect silence in audio
   */
  static detectSilence(audioData, threshold = 0.01, minSilenceDuration = 0.5, sampleRate = 16000) {
    const minSilenceSamples = Math.floor(minSilenceDuration * sampleRate);
    let silenceStart = -1;
    let silenceEnd = -1;

    for (let i = 0; i < audioData.length; i++) {
      const amplitude = Math.abs(audioData[i]);
      const isSilent = amplitude < threshold;

      if (isSilent && silenceStart === -1) {
        silenceStart = i;
      } else if (!isSilent && silenceStart !== -1) {
        silenceEnd = i;

        // Check if silence duration meets minimum
        if (silenceEnd - silenceStart >= minSilenceSamples) {
          return {
            start: silenceStart / sampleRate,
            end: silenceEnd / sampleRate,
            duration: (silenceEnd - silenceStart) / sampleRate
          };
        }

        silenceStart = -1;
        silenceEnd = -1;
      }
    }

    return null;
  }

  /**
   * Apply audio effects
   */
  static applyEffects(audioData, effects = {}) {
    const {
      pitch = 1.0,
      tempo = 1.0,
      reverb = 0.0
    } = effects;

    let processedData = [...audioData];

    // Pitch shifting (simplified)
    if (pitch !== 1.0) {
      processedData = this.applyPitchShift(processedData, pitch);
    }

    // Tempo adjustment (simplified)
    if (tempo !== 1.0) {
      processedData = this.applyTempoAdjustment(processedData, tempo);
    }

    // Reverb effect (simplified)
    if (reverb > 0) {
      processedData = this.applyReverb(processedData, reverb);
    }

    return processedData;
  }

  static applyPitchShift(audioData, pitchFactor) {
    // Simplified pitch shifting - in a real implementation, you'd use
    // more sophisticated algorithms like PSOLA or phase vocoder
    const newLength = Math.floor(audioData.length / pitchFactor);
    const pitchedData = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * pitchFactor);
      pitchedData[i] = audioData[Math.min(sourceIndex, audioData.length - 1)];
    }

    return pitchedData;
  }

  static applyTempoAdjustment(audioData, tempoFactor) {
    // Simplified tempo adjustment
    const newLength = Math.floor(audioData.length / tempoFactor);
    const tempoAdjustedData = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * tempoFactor);
      tempoAdjustedData[i] = audioData[Math.min(sourceIndex, audioData.length - 1)];
    }

    return tempoAdjustedData;
  }

  static applyReverb(audioData, reverbAmount) {
    // Simple delay-based reverb
    const delayTime = 0.03; // 30ms delay
    const delaySamples = Math.floor(delayTime * 16000); // Assuming 16kHz
    const reverbedData = new Float32Array(audioData.length + delaySamples);

    // Copy original audio
    for (let i = 0; i < audioData.length; i++) {
      reverbedData[i] = audioData[i];
    }

    // Add delayed, attenuated version for reverb
    for (let i = 0; i < audioData.length; i++) {
      const delayedIndex = i + delaySamples;
      if (delayedIndex < reverbedData.length) {
        reverbedData[delayedIndex] += audioData[i] * reverbAmount * 0.3;
      }
    }

    return reverbedData.slice(0, audioData.length);
  }
}

/**
 * Audio format utilities
 */
export class AudioFormat {

  /**
   * Detect audio format from buffer or file extension
   */
  static detectFormat(buffer, filename = '') {
    // Check file extension first
    const extension = filename.toLowerCase().split('.').pop();

    if (['wav', 'wave'].includes(extension)) return 'wav';
    if (['mp3', 'mpeg'].includes(extension)) return 'mp3';
    if (['webm'].includes(extension)) return 'webm';
    if (['ogg'].includes(extension)) return 'ogg';

    // Check magic bytes from buffer
    if (buffer && buffer.byteLength >= 12) {
      const view = new DataView(buffer);

      // WAV
      if (view.getUint32(0, false) === 0x52494646 && // "RIFF"
          view.getUint32(8, false) === 0x57415645) { // "WAVE"
        return 'wav';
      }

      // MP3
      if (view.getUint16(0, false) === 0xFFFB || // MPEG 1 Layer 3
          view.getUint16(0, false) === 0xFFF3 || // MPEG 2 Layer 3
          view.getUint16(0, false) === 0xFFF2) { // MPEG 2.5 Layer 3
        return 'mp3';
      }

      // WebM
      if (view.getUint32(0, false) === 0x1A45DFA3) {
        return 'webm';
      }
    }

    return 'unknown';
  }

  /**
   * Get MIME type for audio format
   */
  static getMimeType(format) {
    const mimeTypes = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg'
    };

    return mimeTypes[format] || 'audio/octet-stream';
  }
}

export default {
  AudioBufferUtils,
  AudioProcessor,
  AudioFormat
};