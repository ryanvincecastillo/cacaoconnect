#!/bin/bash

# CacaoConnect Voice Agent Startup Script
# This script starts the voice agent server using PM2

echo "🌱 Starting CacaoConnect Voice Agent..."

# Check if required environment variables are set
if [ -z "$LIVEKIT_URL" ] || [ -z "$LIVEKIT_API_KEY" ] || [ -z "$LIVEKIT_API_SECRET" ]; then
    echo "❌ Error: LiveKit environment variables are not set"
    echo "Please set the following environment variables:"
    echo "  - LIVEKIT_URL"
    echo "  - LIVEKIT_API_KEY"
    echo "  - LIVEKIT_API_SECRET"
    echo "  - DEEPGRAM_API_KEY"
    echo "  - GROQ_API_KEY"
    exit 1
fi

# Check if voice agent file exists
if [ ! -f "./agent/voice-agent.js" ]; then
    echo "❌ Error: Voice agent file not found at ./agent/voice-agent.js"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ Error: PM2 is not installed"
    echo "Please install PM2: npm install -g pm2"
    exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start or restart the voice agent
echo "🚀 Starting voice agent with PM2..."
pm2 start ecosystem.config.js

# Check if the process started successfully
if pm2 list | grep -q "cacao-voice-agent.*online"; then
    echo "✅ Voice agent started successfully!"
    echo ""
    echo "📊 Process Information:"
    pm2 show cacao-voice-agent
    echo ""
    echo "📝 To view logs: pm2 logs cacao-voice-agent"
    echo "🛑 To stop: pm2 stop cacao-voice-agent"
    echo "🔄 To restart: pm2 restart cacao-voice-agent"
    echo "📈 To monitor: pm2 monit"
else
    echo "❌ Failed to start voice agent"
    echo "Check logs for more information:"
    pm2 logs cacao-voice-agent --lines 20
    exit 1
fi

# Save PM2 configuration to restart on server reboot
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script (run once per server)
if ! pm2 startup | grep -q "already been executed"; then
    echo "⚠️  To enable automatic startup on server reboot, run:"
    echo "  sudo pm2 startup"
    echo "  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME"
fi

echo ""
echo "🎉 CacaoConnect Voice Agent is now running!"
echo "🔗 Make sure your LiveKit server is accessible and configured correctly."