# CacaoConnect Voice Assistant Implementation

## Overview

This document describes the enhanced AI voice assistant implementation for CacaoConnect, built with Next.js, LiveKit, Groq, and Deepgram. The voice assistant provides farming-specific voice commands and real-time conversation capabilities.

## Architecture

### Technology Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Voice Infrastructure**: LiveKit (real-time audio)
- **Speech-to-Text**: Deepgram Nova model
- **Text-to-Speech**: Deepgram TTS + Browser fallback
- **Language Model**: Groq (Llama3 70B)
- **Backend**: Supabase (database)
- **Process Management**: PM2

### Project Structure

```
cacaoconnect-dashboard/
├── agent/
│   └── voice-agent.js              # Node.js voice agent server
├── app/
│   ├── api/livekit-token/
│   │   └── route.js               # LiveKit token generation
│   └── layout.js                  # Main layout with voice assistant
├── components/
│   ├── VoiceAssistantComponent.jsx # Voice interaction component
│   ├── VoiceFeedbackIndicator.jsx # Voice status indicator
│   └── FloatingVoiceAssistant.jsx # Floating assistant widget
├── lib/
│   └── voiceService.js            # Voice service utilities
├── scripts/
│   └── start-voice-agent.sh       # Voice agent startup script
├── ecosystem.config.js            # PM2 configuration
└── VOICE_ASSISTANT_README.md      # This documentation
```

## Features

### Voice Commands

The assistant understands these farming-specific commands:

- **Order Management**: "Commit 50kg to order ABC"
- **Inventory Queries**: "Check my inventory", "What do I have?"
- **Delivery Status**: "Check my deliveries", "Pending deliveries"
- **Weather Information**: "Weather forecast", "Rain forecast"
- **Market Prices**: "Market prices", "Cocoa prices"
- **Quality Assessment**: "Quality check", "Grade assessment"
- **Pickup Scheduling**: "Schedule pickup", "Arrange pickup"

### User Interface Components

1. **Floating Voice Assistant**: Bottom-right floating widget
2. **Voice Feedback Indicator**: Real-time status display
3. **Voice Controls**: Microphone, volume, mute controls
4. **Chat Interface**: Text + voice conversation history

## Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server-url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Groq Configuration (LLM)
GROQ_API_KEY=your_groq_api_key

# Deepgram Configuration (STT + TTS)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Voice Assistant Configuration
ASSISTANT_VOICE=en-US-Ava
NEXT_PUBLIC_ASSISTANT_ENABLED=true

# Existing Supabase and OpenAI configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

### 2. API Key Setup

#### LiveKit Cloud
1. Sign up at [https://cloud.livekit.io](https://cloud.livekit.io)
2. Create a new project
3. Get your API key and secret
4. Configure your LiveKit server URL

#### Groq
1. Sign up at [https://console.groq.com](https://console.groq.com)
2. Get your API key from the dashboard
3. Add to `GROQ_API_KEY`

#### Deepgram
1. Sign up at [https://console.deepgram.com](https://console.deepgram.com)
2. Get your API key from the dashboard
3. Add to `DEEPGRAM_API_KEY`

### 3. Development Setup

```bash
# Install dependencies
pnpm install

# Start Next.js development server
pnpm dev

# Start voice agent in development mode
pnpm voice:dev

# Or use PM2 for production-like experience
pnpm voice:pm2
```

### 4. Production Deployment

```bash
# Build the Next.js application
pnpm build

# Start voice agent with PM2
pnpm voice:setup

# Or manually:
./scripts/start-voice-agent.sh

# Start the main application
pnpm start
```

## Usage

### For Farmers

1. Click the floating voice assistant button in the bottom-right corner
2. Click the microphone button to start speaking
3. Say commands like:
   - "Check my inventory"
   - "Commit 25kg to order ABC123"
   - "What's the weather forecast?"
   - "Check my delivery status"

### For Developers

### Voice Command Integration

```javascript
// In your components, use the VoiceAssistantComponent
import VoiceAssistantComponent from './components/VoiceAssistantComponent';

const handleVoiceCommand = async (command) => {
  switch (command.intent) {
    case 'commit_volume':
      // Handle order commitment
      break;
    case 'check_inventory':
      // Handle inventory query
      break;
    // ... other commands
  }
};

<VoiceAssistantComponent
  userId={user.id}
  userType="farmer"
  onVoiceCommand={handleVoiceCommand}
  showToast={showToast}
/>
```

### Voice Service Integration

```javascript
import { VoiceService, SpeechToTextService, TextToSpeechService } from '../lib/voiceService';

// Parse a voice command
const command = VoiceService.parseCommand("Commit 50kg to order ABC");

// Generate farming-specific response
const response = await VoiceService.generateResponse(command, userContext);

// Transcribe audio (Deepgram)
const transcript = await SpeechToTextService.transcribeAudio(audioData);

// Synthesize speech (TTS)
await TextToSpeechService.synthesizeSpeech(response.text);
```

## Voice Agent Server

The Node.js voice agent (`agent/voice-agent.js`) handles:

- Real-time audio processing via LiveKit
- Speech-to-text conversion
- Command parsing and context management
- LLM integration with Groq
- Database operations with Supabase
- Text-to-speech synthesis

### PM2 Process Management

```bash
# Start voice agent
pnpm voice:pm2

# Stop voice agent
pnpm voice:stop

# Restart voice agent
pnpm voice:restart

# View logs
pnpm voice:logs

# Check status
pnpm voice:status
```

## Monitoring and Debugging

### Logs

- Voice agent logs: `logs/voice-agent-*.log`
- Next.js logs: Console output
- PM2 logs: `pm2 logs cacao-voice-agent`

### Health Checks

```bash
# Check voice agent status
pnpm voice:status

# Check PM2 processes
pm2 list

# Monitor performance
pm2 monit
```

## Troubleshooting

### Common Issues

1. **Voice Assistant Not Connecting**
   - Check LiveKit API keys in `.env`
   - Verify LiveKit server is running
   - Check network connectivity

2. **Microphone Access Denied**
   - Ensure browser has microphone permissions
   - Use HTTPS in production
   - Check browser security settings

3. **Speech Recognition Not Working**
   - Verify Deepgram API key
   - Check audio input device
   - Ensure Deepgram service is available

4. **Voice Agent Server Not Starting**
   - Check environment variables
   - Verify Node.js dependencies
   - Check PM2 configuration

### Debug Mode

```bash
# Enable debug logging
DEBUG=* pnpm voice:dev

# Or for specific modules
DEBUG=livekit:* pnpm voice:dev
```

## Performance Optimization

### Audio Quality

- Use `echoCancellation: true` for microphone access
- Set appropriate sample rate (16kHz for voice)
- Implement audio buffering for smooth playback

### Network Optimization

- Configure LiveKit server regions
- Use WebRTC for low-latency audio
- Implement audio compression

### Memory Management

- Clean up audio streams properly
- Limit conversation history
- Use PM2 memory limits

## Security Considerations

- All API keys are server-side only
- LiveKit tokens are short-lived
- Audio data is encrypted in transit
- User authentication required for voice access

## Future Enhancements

### Planned Features

- **Multi-language Support**: Spanish, French, Portuguese
- **Advanced Analytics**: Voice usage patterns and insights
- **Offline Mode**: Limited offline voice capabilities
- **Voice Profiles**: User-specific voice recognition
- **Advanced Commands**: Complex multi-step operations

### Integration Opportunities

- **IoT Devices**: Voice control for farm equipment
- **Mobile Apps**: Native mobile voice assistant
- **Smart Speakers**: Alexa/Google Assistant integration
- **SMS/Voice**: Phone-based voice interface

## Contributing

When adding new voice commands:

1. Update `FARMING_COMMANDS` in `voiceService.js`
2. Add corresponding handler in the voice agent
3. Update UI components for new command types
4. Add tests for the new functionality
5. Update documentation

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify environment configuration
3. Test with different browsers/devices
4. Review the troubleshooting section
5. Check for service status updates

---

**Built with ❤️ for cocoa farmers using modern voice AI technology**