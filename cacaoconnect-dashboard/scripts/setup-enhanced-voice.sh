#!/bin/bash

# Enhanced Voice Setup Script
# Sets up and restarts the voice agent with emotional intelligence

echo "🎤 Setting up Enhanced Voice Assistant with Emotional Intelligence"
echo "=================================================================="

# Check if required environment variables are set
if [ -z "$DEEPGRAM_API_KEY" ]; then
    echo "❌ DEEPGRAM_API_KEY not found in .env file"
    echo "Please add your Deepgram API key to continue"
    exit 1
fi

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ GROQ_API_KEY not found in .env file"
    echo "Please add your Groq API key to continue"
    exit 1
fi

echo "✅ Environment variables verified"

# Stop existing voice agent if running
echo "🛑 Stopping existing voice agent..."
pnpm voice:stop 2>/dev/null || echo "No existing voice agent to stop"

# Wait a moment for clean shutdown
sleep 2

# Start voice agent with enhanced features
echo "🚀 Starting enhanced voice agent..."
echo "Using voice: ${ASSISTANT_VOICE:-aura-asteria-en}"
echo "Emotional responses: ${TTS_EMOTIONAL_RESPONSE:-true}"

# Start in development mode for testing
if [ "$NODE_ENV" = "development" ]; then
    echo "🔧 Starting in development mode..."
    pnpm voice:dev
else
    echo "🏭 Starting in production mode with PM2..."
    pnpm voice:pm2
fi

echo ""
echo "✨ Enhanced Voice Assistant is now running!"
echo ""
echo "🎯 Features enabled:"
echo "  • Emotional Intelligence (detects and responds with appropriate emotions)"
echo "  • Deepgram Aura TTS (natural human-like voice)"
echo "  • Dynamic voice parameters (rate, pitch, volume based on emotion)"
echo "  • Enhanced text responses with emotional context"
echo ""
echo "🧪 Test with commands like:"
echo "  'Check my inventory' (neutral response)"
echo "  'Great! Commit 50kg to order ABC' (enthusiastic response)"
echo "  'I have a problem with my delivery' (concerned response)"
echo ""
echo "📊 Monitor logs with: pnpm voice:logs"
