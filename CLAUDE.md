# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CacaoConnect** is an AI-Driven Supply Chain Visibility Platform for Cacao de Davao that connects chocolate processors with farmers through real-time supply tracking, AI-powered forecasting, and voice assistant capabilities.

## Architecture

This is a **dual-portal platform** built with Next.js 16:

- **Processor Dashboard** (Desktop-focused) - Main supply chain management interface
- **Farmer Portal** (Mobile-first) - Voice-enabled interface for farmers
- **Voice Assistant System** - Advanced AI conversational interface using LiveKit, Deepgram, and Groq

### Key Directory Structure

```
cacaoconnect/
├── cacaoconnect-dashboard/           # Main Next.js application
│   ├── app/                         # Next.js App Router pages and API routes
│   │   ├── api/livekit-token/       # LiveKit authentication endpoint
│   │   └── layout.js               # Root layout with voice assistant
│   ├── components/                  # React components including voice interface
│   ├── lib/                        # Business logic and utilities
│   ├── agent/                      # Voice assistant Node.js server
│   ├── scripts/                    # Deployment and management scripts
│   └── ecosystem.config.js         # PM2 process configuration
```

## Development Commands

### Main Application

Navigate to `cacaoconnect-dashboard/` first:

```bash
# Development
npm run dev              # Start Next.js development server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Package management
pnpm install             # Install dependencies (preferred over npm)
npm install              # Alternative package management
```

### Voice Assistant System

The voice assistant is a separate Node.js process that can run independently:

```bash
# Development mode
npm run voice:dev        # Start voice agent with development logging

# Production management (PM2)
npm run voice:pm2        # Start voice agent with PM2 process manager
npm run voice:stop       # Stop voice agent
npm run voice:restart     # Restart voice agent
npm run voice:logs       # View voice agent logs
npm run voice:status     # Check voice agent status
npm run voice:setup      # Setup and start voice agent (production script)

# Direct execution
npm run voice:start      # Start voice agent directly (no PM2)
```

## Technology Stack

### Core Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **AI/ML**:
  - OpenAI GPT-4o-mini (supply chain insights and forecasting)
  - Groq Llama3 70B (voice assistant conversations)
- **Voice Infrastructure**:
  - LiveKit (real-time audio communication)
  - Deepgram (Speech-to-Text + Text-to-Speech)
- **Process Management**: PM2 for voice agent server
- **Icons**: Lucide React

### Voice Assistant Architecture

The voice assistant is a separate Node.js server (`agent/voice-agent.js`) that:
- Handles real-time audio processing via LiveKit
- Uses Deepgram for speech recognition and synthesis
- Integrates with Groq for conversational AI
- Connects to Supabase for data operations
- Supports farming-specific voice commands

## Environment Setup

### Required Environment Variables

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
OPENAI_API_KEY=your_openai_api_key          # For supply chain insights
GROQ_API_KEY=your_groq_api_key              # For voice assistant
DEEPGRAM_API_KEY=your_deepgram_api_key      # For STT/TTS

# Voice Infrastructure (LiveKit)
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
ASSISTANT_VOICE=en-US-Ava                   # TTS voice preference
NEXT_PUBLIC_ASSISTANT_ENABLED=true          # Enable/disable voice features
```

### API Key Setup

1. **Supabase**: Create project at https://supabase.com
2. **OpenAI**: Get API key at https://platform.openai.com
3. **Groq**: Get API key at https://console.groq.com
4. **Deepgram**: Get API key at https://console.deepgram.com
5. **LiveKit**: Set up at https://cloud.livekit.io

## Database Schema

The application uses PostgreSQL with these core tables:

- **orders**: Demand broadcasting and tracking (status: open → filled → in_transit → delivered → completed)
- **commitments**: Farmer offers and commitments (status: pending → approved → ready → collected → delivered → paid)
- **inventory**: Stock tracking by bean type and quality grade

### Quality Grade System

- Grade A: 100% price multiplier (premium quality)
- Grade B: 85% price multiplier (good quality, minor defects)
- Grade C: 70% price multiplier (acceptable, requires sorting)

## Voice Assistant Features

### Supported Voice Commands
- Order management: "Commit 50kg to order ABC"
- Inventory queries: "Check my inventory", "What do I have?"
- Delivery status: "Check my deliveries", "Pending deliveries"
- Weather information: "Weather forecast", "Rain forecast"
- Market prices: "Market prices", "Cocoa prices"
- Quality assessment: "Quality check", "Grade assessment"
- Pickup scheduling: "Schedule pickup", "Arrange pickup"

### Voice Components
- **FloatingVoiceAssistant**: Main voice interaction widget
- **VoiceFeedbackIndicator**: Real-time status display
- **VoiceAssistantComponent**: Core voice functionality

## Development Workflow

### Starting Development

1. Navigate to main directory: `cd cacaoconnect-dashboard`
2. Install dependencies: `pnpm install`
3. Set up environment variables in `.env`
4. Start main application: `npm run dev`
5. Start voice assistant (optional): `npm run voice:dev`

### Voice Agent Development

The voice agent runs as a separate process and can be developed independently:

```bash
# For voice-related changes
npm run voice:dev    # Start with hot reload in development
npm run voice:logs   # Monitor voice agent logs
npm run voice:status # Check if voice agent is running
```

### Production Deployment

1. Build application: `npm run build`
2. Setup voice agent: `npm run voice:setup`
3. Start production server: `npm run start`

## Real-time Features

The application uses 3-5 second polling for real-time updates between:
- Farmer inventory changes
- Order commitment status
- Supply chain tracking
- KPI dashboard updates

## Key Business Logic

### Order Status Workflow
Orders automatically progress through statuses based on commitment states:
- `open`: Accepting farmer commitments (fill < 100%)
- `filled`: Target volume reached, ready for collection
- `in_transit`: Beans being transported
- `delivered`: Some beans arrived at warehouse
- `completed`: All beans delivered

### Commitment Status Workflow
- `pending`: Farmer submitted offer, awaiting processor review
- `approved`: Processor accepted commitment
- `ready`: Farmer harvested beans, ready for pickup
- `collected`: Logistics picked up from farm
- `delivered`: Arrived at processor warehouse
- `paid`: Payment released to farmer

## Process Management (PM2)

The voice agent uses PM2 for production process management with:
- Auto-restart on failure
- Memory limits (500MB)
- Log rotation and management
- Health checks and monitoring
- Development and development environment configurations

## Security Considerations

- All API keys are server-side only
- LiveKit tokens are short-lived
- Audio data is encrypted in transit
- Row Level Security (RLS) should be implemented in Supabase
- Environment variables should never be committed to version control