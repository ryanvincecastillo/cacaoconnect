"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Send,
  Loader2,
  Wifi,
  WifiOff,
  Settings
} from 'lucide-react';

import VoiceAssistantComponent from './VoiceAssistantComponent';
import VoiceFeedbackIndicator from './VoiceFeedbackIndicator';
import ErrorBoundary from './ErrorBoundary';

const FloatingVoiceAssistant = ({
  userId,
  userType = 'farmer',
  onVoiceCommand,
  showToast,
  position = 'bottom-right' // bottom-right, bottom-left, top-right, top-left
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Position classes
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300';

    switch (position) {
      case 'bottom-right':
        return `${baseClasses} bottom-6 right-6`;
      case 'bottom-left':
        return `${baseClasses} bottom-6 left-6`;
      case 'top-right':
        return `${baseClasses} top-6 right-6`;
      case 'top-left':
        return `${baseClasses} top-6 left-6`;
      default:
        return `${baseClasses} bottom-6 right-6`;
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Handle voice command from voice component
  const handleVoiceCommand = async (command) => {
    try {
      // Add voice command to chat
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: command.originalText || command.text || 'Voice command',
        timestamp: new Date(),
        isVoice: true
      };

      setChatHistory(prev => [...prev, userMessage]);
      setIsTyping(true);

      // Process the command
      if (onVoiceCommand) {
        const response = await onVoiceCommand(command);

        // Add assistant response to chat
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.text || 'I processed your command.',
          timestamp: new Date(),
          action: response.action,
          data: response.data
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      }

      setIsTyping(false);

      // Update unread count if chat is minimized
      if (isMinimized || !isOpen) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (error) {
      console.error('Voice command error:', error);
      setIsTyping(false);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date(),
        isError: true
      };

      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  // Handle text message submission
  const handleTextSubmit = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date(),
      isText: true
    };

    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Process text command
      const command = {
        originalText: message.trim(),
        intent: 'text_query',
        entities: { query: message.trim() }
      };

      if (onVoiceCommand) {
        const response = await onVoiceCommand(command);

        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: response.text || 'I understand your message.',
          timestamp: new Date(),
          action: response.action,
          data: response.data
        };

        setChatHistory(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Text message error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Sorry, I had trouble understanding that. Could you try rephrasing?',
        timestamp: new Date(),
        isError: true
      };

      setChatHistory(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setUnreadCount(0); // Clear unread count when closing
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className={getPositionClasses()}>
        <button
          onClick={toggleChat}
          className="relative bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
        >
          <MessageCircle className="w-6 h-6" />

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {/* Hover hint */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Voice Assistant
          </div>
        </button>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className={`${getPositionClasses()} ${isExpanded ? 'w-96' : 'w-80'} ${isMinimized ? 'h-14' : 'h-[500px]'} bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300`}>

      {/* Header */}
      <div className="bg-emerald-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Voice Assistant</h3>
            <p className="text-xs opacity-90">Powered by CacaoConnect AI</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {/* Minimize/Maximize */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {/* Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={toggleChat}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      {!isMinimized && (
        <>
          {/* Voice Assistant Component */}
          <div className="border-b border-gray-100">
            <ErrorBoundary
              errorMessage="The voice assistant is currently unavailable. Please try again later."
              onError={(error, errorInfo) => {
                console.error('Voice Assistant Error:', error, errorInfo);
                showToast?.('Voice assistant encountered an error', 'error');
              }}
            >
              <VoiceAssistantComponent
                userId={userId}
                userType={userType}
                onVoiceCommand={handleVoiceCommand}
                showToast={showToast}
                className="border-0 shadow-none"
              />
            </ErrorBoundary>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Hi! I'm your cocoa farming assistant. Ask me about inventory, orders, deliveries, or weather!
                </p>
                <div className="mt-4 space-y-1 text-xs text-gray-400">
                  <p>• Try: "Check my inventory"</p>
                  <p>• Try: "Commit 50kg to order ABC"</p>
                  <p>• Try: "What's the weather?"</p>
                </div>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-emerald-500 text-white'
                        : msg.isError
                        ? 'bg-red-100 text-red-700'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-1 mb-1">
                      {msg.type === 'user' ? (
                        <>
                          <span className="text-xs opacity-75">You</span>
                          {msg.isVoice && <Mic className="w-3 h-3" />}
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3" />
                          <span className="text-xs opacity-75">Assistant</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.type === 'user' ? 'text-emerald-100' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleTextSubmit} className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message or use voice..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!message.trim() || isTyping}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingVoiceAssistant;