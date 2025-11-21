"use client";

import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Volume2, Zap, Palette } from 'lucide-react';

/**
 * Voice Visualizer Controls Component
 * Provides controls for customizing voice visualization
 */

const VoiceVisualizerControls = ({
  mode = 'waveform',
  theme = 'default',
  sensitivity = 0.7,
  height = 120,
  showControls = true,
  onModeChange,
  onThemeChange,
  onSensitivityChange,
  onHeightChange,
  onControlsToggle,
  className = ''
}) => {
  const [localShowControls, setLocalShowControls] = useState(showControls);
  const [localSettings, setLocalSettings] = useState({
    mode,
    theme,
    sensitivity,
    height
  });

  const visualizationModes = [
    { value: 'waveform', label: 'Waveform', icon: '🌊', description: 'Classic oscilloscope waveform' },
    { value: 'spectrum', label: 'Spectrum', icon: '📊', description: 'Frequency spectrum analyzer' },
    { value: 'circular', label: 'Circular', icon: '⭕', description: 'Radial frequency visualization' },
    { value: 'particles', label: 'Particles', icon: '✨', description: 'Interactive particle effects' },
    { value: 'minimal', label: 'Minimal', icon: '━', description: 'Clean, simple visualization' }
  ];

  const themes = [
    { value: 'default', label: 'Default', colors: { primary: '#10b981', secondary: '#059669' } },
    { value: 'energetic', label: 'Energetic', colors: { primary: '#f59e0b', secondary: '#d97706' } },
    { value: 'professional', label: 'Professional', colors: { primary: '#3b82f6', secondary: '#1e40af' } },
    { value: 'minimal', label: 'Minimal', colors: { primary: '#6b7280', secondary: '#4b5563' } }
  ];

  const handleModeChange = (newMode) => {
    setLocalSettings(prev => ({ ...prev, mode: newMode }));
    onModeChange?.(newMode);
  };

  const handleThemeChange = (newTheme) => {
    setLocalSettings(prev => ({ ...prev, theme: newTheme }));
    onThemeChange?.(newTheme);
  };

  const handleSensitivityChange = (newSensitivity) => {
    setLocalSettings(prev => ({ ...prev, sensitivity: newSensitivity }));
    onSensitivityChange?.(newSensitivity);
  };

  const handleHeightChange = (newHeight) => {
    setLocalSettings(prev => ({ ...prev, height: newHeight }));
    onHeightChange?.(newHeight);
  };

  const toggleControls = () => {
    const newValue = !localShowControls;
    setLocalShowControls(newValue);
    onControlsToggle?.(newValue);
  };

  const presetConfigs = [
    {
      name: 'Performance',
      settings: { mode: 'minimal', theme: 'default', sensitivity: 0.9, height: 80 },
      description: 'Optimized for performance'
    },
    {
      name: 'Balanced',
      settings: { mode: 'waveform', theme: 'default', sensitivity: 0.7, height: 120 },
      description: 'Good balance of visuals and performance'
    },
    {
      name: 'Rich',
      settings: { mode: 'particles', theme: 'energetic', sensitivity: 0.6, height: 160 },
      description: 'Maximum visual richness'
    },
    {
      name: 'Professional',
      settings: { mode: 'spectrum', theme: 'professional', sensitivity: 0.8, height: 140 },
      description: 'Clean, professional appearance'
    }
  ];

  const applyPreset = (preset) => {
    setLocalSettings(preset.settings);
    onModeChange?.(preset.settings.mode);
    onThemeChange?.(preset.settings.theme);
    onSensitivityChange?.(preset.settings.sensitivity);
    onHeightChange?.(preset.settings.height);
  };

  const currentModeInfo = visualizationModes.find(m => m.value === localSettings.mode);
  const currentThemeInfo = themes.find(t => t.value === localSettings.theme);

  return (
    <div className={`voice-visualizer-controls ${className}`}>
      {/* Settings Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Visualizer Settings
          </h3>
          
          <button
            onClick={toggleControls}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            title={localShowControls ? 'Hide controls' : 'Show controls'}
          >
            {localShowControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Settings Grid */}
        {localShowControls && (
          <div className="space-y-4">
            {/* Visualization Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualization Mode
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {visualizationModes.map((modeOption) => (
                  <button
                    key={modeOption.value}
                    onClick={() => handleModeChange(modeOption.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.mode === modeOption.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">{modeOption.icon}</div>
                      <div className="text-sm font-medium">{modeOption.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{modeOption.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.theme === themeOption.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border-2"
                        style={{ backgroundColor: themeOption.colors.primary }}
                      />
                      <div className="w-6 h-6 rounded-full border-2"
                           style={{ backgroundColor: themeOption.colors.secondary }}
                      />
                    </div>
                    <div className="text-xs font-medium mt-1">{themeOption.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitivity Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sensitivity: {Math.round(localSettings.sensitivity * 100)}%
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={localSettings.sensitivity}
                  onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Less Sensitive</span>
                    <span>More Sensitive</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.1</span>
                    <span>1.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Height Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height: {localSettings.height}px
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="60"
                  max="200"
                  step="10"
                  value={localSettings.height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Compact</span>
                    <span>Large</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>60px</span>
                    <span>200px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preset Configurations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presetConfigs.map((preset, index) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {preset.settings.mode}
                        </span>
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {preset.settings.theme}
                        </span>
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {preset.settings.sensitivity}
                        </span>
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                          {preset.settings.height}px
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Settings Display */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Mode:</span>
                  <span className="font-medium text-gray-900">
                    {currentModeInfo?.label || 'Waveform'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Theme:</span>
                  <span className="font-medium text-gray-900">
                    {currentThemeInfo?.label || 'Default'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sensitivity:</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(localSettings.sensitivity * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Height:</span>
                  <span className="font-medium text-gray-900">
                    {localSettings.height}px
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls Toggle */}
        {!localShowControls && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={toggleControls}
              className="w-full p-3 text-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Settings className="w-5 h-5 inline mr-2" />
              Show Visualizer Controls
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .voice-visualizer-controls {
          position: relative;
          z-index: 10;
        }
        
        .voice-visualizer-controls input[type="range"] {
          background: linear-gradient(to right, #e5e7eb, #d1d5db);
        }
        
        .voice-visualizer-controls input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .voice-visualizer-controls input[type="range"]::-moz-range-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #10b981;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VoiceVisualizerControls;
