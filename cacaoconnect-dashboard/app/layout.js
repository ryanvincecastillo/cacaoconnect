"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from 'react';
import FloatingVoiceAssistant from '../components/FloatingVoiceAssistant';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState('farmer');

  // Simulate user authentication - in real app, this would come from auth system
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        // Get user info from localStorage or auth context
        const userInfo = localStorage.getItem('cacaoUser');
        if (userInfo) {
          const user = JSON.parse(userInfo);
          setCurrentUser(user.id || 'demo-user');
          setUserType(user.type || 'farmer');
        } else {
          // Demo user for development
          setCurrentUser('demo-user');
          setUserType('farmer');
        }
      } catch (error) {
        console.error('Error reading user data:', error);
        setCurrentUser('demo-user');
        setUserType('farmer');
      }
    }
  }, []);

  const handleVoiceCommand = async (command) => {
    console.log('Voice command received:', command);

    try {
      // Call the voice command API for dynamic responses
      const response = await fetch('/api/voice-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command.originalText || command.text || 'Unknown command',
          userId: currentUser,
          userType: userType
        })
      });

      if (!response.ok) {
        throw new Error(`API response: ${response.status}`);
      }

      const data = await response.json();
      console.log('Voice command API response:', data);

      return data;

    } catch (error) {
      console.error('Voice command API error:', error);

      // Fallback response if API fails
      return {
        text: "I'm having trouble connecting to my systems right now. Please try again in a moment. You can ask me about inventory, deliveries, weather, or market prices.",
        action: 'error',
        data: null
      };
    }
  };

  const showToast = (message, type = 'info') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'success' ? 'bg-emerald-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* Floating Voice Assistant */}
        {currentUser && (
          <FloatingVoiceAssistant
            userId={currentUser}
            userType={userType}
            onVoiceCommand={handleVoiceCommand}
            showToast={showToast}
            position="bottom-right"
          />
        )}
      </body>
    </html>
  );
}
