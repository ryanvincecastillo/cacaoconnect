"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Mic, Volume2, Activity } from 'lucide-react';

/**
 * Voice Visualizer Component
 * Provides multiple visualization modes for voice assistant audio feedback
 */

const VoiceVisualizer = ({
  isActive = false,
  audioStream = null,
  mode = 'waveform', // waveform, spectrum, circular, particles, minimal
  theme = 'default', // default, energetic, professional, minimal
  sensitivity = 0.7,
  className = '',
  height = 120,
  showControls = false
}) => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [volume, setVolume] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [particles, setParticles] = useState([]);

  // Theme configurations
  const themes = useMemo(() => ({
    default: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      background: 'rgba(0, 0, 0, 0.02)',
      particles: '#34d399'
    },
    energetic: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fbbf24',
      background: 'rgba(0, 0, 0, 0.05)',
      particles: '#fbbf24'
    },
    professional: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#60a5fa',
      background: 'rgba(0, 0, 0, 0.03)',
      particles: '#60a5fa'
    },
    minimal: {
      primary: '#6b7280',
      secondary: '#4b5563',
      accent: '#9ca3af',
      background: 'rgba(0, 0, 0, 0.01)',
      particles: '#9ca3af'
    }
  }), []);

  const currentTheme = themes[theme] || themes.default;

  // Initialize audio context and analyser
  const initializeAudio = useCallback(async () => {
    if (!audioStream || !canvasRef.current) return;

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      // Connect audio stream
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      
      // Store references
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setIsInitialized(true);
      
    } catch (error) {
      console.error('Failed to initialize audio visualizer:', error);
    }
  }, [audioStream]);

  // Generate initial particles
  const generateParticles = useCallback((count = 20) => {
    return Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      life: 1.0,
      maxLife: Math.random() * 2 + 1,
      color: currentTheme.particles
    }));
  }, [currentTheme]);

  // Update particles
  const updateParticles = useCallback((audioIntensity) => {
    setParticles(prev => prev.map(particle => {
      // Update position
      let newX = particle.x + particle.vx * audioIntensity;
      let newY = particle.y + particle.vy * audioIntensity;
      
      // Bounce off walls
      if (newX <= 0 || newX >= 100) particle.vx *= -1;
      if (newY <= 0 || newY >= 100) particle.vy *= -1;
      
      // Update life
      const newLife = particle.life - 0.01;
      
      return {
        ...particle,
        x: Math.max(0, Math.min(100, newX)),
        y: Math.max(0, Math.min(100, newY)),
        life: Math.max(0, newLife)
      };
    }).filter(particle => particle.life > 0));
  }, []);

  // Draw waveform visualization
  const drawWaveform = useCallback((ctx, analyser, width, height) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = currentTheme.primary;
    ctx.beginPath();

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentTheme.accent;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [currentTheme]);

  // Draw spectrum visualization
  const drawSpectrum = useCallback((ctx, analyser, width, height) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * height;

      // Create gradient for bars
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, currentTheme.accent);
      gradient.addColorStop(0.5, currentTheme.primary);
      gradient.addColorStop(1, currentTheme.secondary);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }, [currentTheme]);

  // Draw circular visualization
  const drawCircular = useCallback((ctx, analyser, width, height) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Draw frequency bars in circle
    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const barHeight = (dataArray[i] / 255) * radius;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, currentTheme.secondary);
      gradient.addColorStop(1, currentTheme.accent);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = currentTheme.primary;
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [currentTheme]);

  // Draw particles
  const drawParticles = useCallback((ctx, width, height) => {
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    particles.forEach(particle => {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(
        (particle.x / 100) * width,
        (particle.y / 100) * height,
        particle.size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }, [particles, currentTheme]);

  // Draw minimal visualization
  const drawMinimal = useCallback((ctx, analyser, width, height) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, width, height);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    const normalizedVolume = average / 255;

    // Draw simple volume bar
    const barWidth = width * 0.8;
    const barHeight = height * 0.6;
    const x = (width - barWidth) / 2;
    const y = (height - barHeight) / 2;

    // Background bar
    ctx.fillStyle = currentTheme.secondary;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Volume bar
    ctx.fillStyle = currentTheme.primary;
    ctx.fillRect(x, y + barHeight * (1 - normalizedVolume), barWidth, barHeight * normalizedVolume);

    // Volume text
    ctx.fillStyle = currentTheme.primary;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(normalizedVolume * 100)}%`, width / 2, height - 10);
  }, [currentTheme]);

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // Get audio data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    // Calculate volume and frequency
    let sum = 0;
    let maxFreq = 0;
    let maxFreqIndex = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
      if (dataArray[i] > maxFreq) {
        maxFreq = dataArray[i];
        maxFreqIndex = i;
      }
    }
    
    const average = sum / bufferLength;
    const normalizedVolume = average / 255;
    const dominantFrequency = (maxFreqIndex / bufferLength) * (analyser.context.sampleRate / 2);

    setVolume(normalizedVolume);
    setFrequency(dominantFrequency);

    // Draw based on mode
    switch (mode) {
      case 'waveform':
        drawWaveform(ctx, analyser, width, height);
        break;
      case 'spectrum':
        drawSpectrum(ctx, analyser, width, height);
        break;
      case 'circular':
        drawCircular(ctx, analyser, width, height);
        break;
      case 'particles':
        drawSpectrum(ctx, analyser, width, height);
        updateParticles(normalizedVolume);
        drawParticles(ctx, width, height);
        break;
      case 'minimal':
        drawMinimal(ctx, analyser, width, height);
        break;
      default:
        drawWaveform(ctx, analyser, width, height);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [mode, isActive, drawWaveform, drawSpectrum, drawCircular, drawParticles, drawMinimal, updateParticles]);

  // Handle audio stream changes
  useEffect(() => {
    if (audioStream && isActive) {
      initializeAudio();
    } else {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      setIsInitialized(false);
    }
  }, [audioStream, isActive, initializeAudio]);

  // Start/stop animation
  useEffect(() => {
    if (isInitialized && isActive) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [isInitialized, isActive, animate]);

  // Initialize particles
  useEffect(() => {
    if (mode === 'particles') {
      setParticles(generateParticles(15));
    }
  }, [mode, generateParticles]);

  const modeNames = {
    waveform: 'Waveform',
    spectrum: 'Spectrum',
    circular: 'Circular',
    particles: 'Particles',
    minimal: 'Minimal'
  };

  return (
    <div className={`voice-visualizer ${className}`}>
      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full h-full rounded-lg"
        style={{
          background: currentTheme.background,
          display: isActive ? 'block' : 'none'
        }}
      />
      
      {/* Controls overlay */}
      {showControls && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>{modeNames[mode] || 'Waveform'}</span>
            <span className="ml-2">Vol: {Math.round(volume * 100)}%</span>
            <span>Freq: {Math.round(frequency)}Hz</span>
          </div>
        </div>
      )}
      
      {/* Status indicators */}
      <div className="flex items-center justify-center mt-2 space-x-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Active</span>
        </div>
        {volume > 0.1 && (
          <div className="flex items-center space-x-1">
            <Volume2 className="w-3 h-3" />
            <span>Speaking</span>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .voice-visualizer {
          position: relative;
          width: 100%;
          height: ${height}px;
        }
        
        .voice-visualizer canvas {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default VoiceVisualizer;
