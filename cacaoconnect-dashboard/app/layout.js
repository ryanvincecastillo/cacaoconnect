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

    // This would integrate with the voice service
    // For now, return a basic response
    if (command.intent === 'check_inventory') {
      return {
        text: "I'm checking your inventory. You currently have 150kg of Grade A cocoa beans and 75kg of Grade B beans.",
        action: 'inventory_report',
        data: { gradeA: 150, gradeB: 75 }
      };
    }

    if (command.intent === 'check_deliveries') {
      return {
        text: "You have 2 deliveries ready for pickup and 1 in transit. The ready deliveries total 125kg of cocoa beans.",
        action: 'delivery_report',
        data: { ready: 2, inTransit: 1, totalVolume: 125 }
      };
    }

    return {
      text: "I understand your request. How can I help you with your cocoa farming today?",
      action: null,
      data: null
    };
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
