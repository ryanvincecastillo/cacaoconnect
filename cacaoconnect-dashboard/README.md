# 🍫 CacaoConnect Dashboard

**AI-Driven Supply Chain Visibility Platform for Cacao de Davao**

A comprehensive dual-portal platform that connects chocolate processors with farmers through real-time supply tracking, AI-powered forecasting, and an advanced voice assistant system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Voice Agent Setup](#voice-agent-setup)
- [Available Commands](#available-commands)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Development Guide](#development-guide)

---

## 🌟 Overview

CacaoConnect solves material reliability challenges for Cacao de Davao by creating end-to-end visibility between chocolate processors and their farmer network through:

### **Key Features**
- **📊 Real-time Supply Chain Dashboard** - Live inventory and order tracking
- **🤖 AI-Powered Voice Assistant** - Conversational AI for farmers (Mobile-first)
- **📱 Dual-Portal System** - Processor dashboard + Farmer mobile interface
- **🔮 Predictive Analytics** - AI forecasting using OpenAI GPT-4o-mini
- **⚠️ Early Warning System** - Risk alerts and supply gap predictions
- **🎯 Order Management** - Demand broadcasting and commitment tracking

---

## 🛠️ Prerequisites

### **System Requirements**
- **Node.js** 18+ (recommended: Node.js 20)
- **Package Manager**: pnpm (recommended) or npm
- **Git** for version control

### **Required API Keys**
You'll need API keys from these services:

| Service | Purpose | Cost |
|---------|---------|------|
| **[Supabase](https://supabase.com)** | Database & Real-time | Free tier available |
| **[OpenAI](https://platform.openai.com)** | AI Insights & Forecasting | Pay-as-you-go |
| **[Groq](https://console.groq.com)** | Voice Assistant LLM | Free tier available |
| **[Deepgram](https://console.deepgram.com)** | Speech-to-Text & Text-to-Speech | Free tier available |
| **[LiveKit](https://cloud.livekit.io)** | Real-time Audio Communication | Free tier available |

---

## 🚀 Quick Start

### **1. Clone & Navigate**
```bash
git clone <repository-url>
cd cacaoconnect/cacaoconnect-dashboard
```

### **2. Install Dependencies**
```bash
# Recommended (faster and more efficient)
pnpm install

# Alternative
npm install
```

### **3. Environment Setup**
```bash
# Copy the example environment file (if exists)
cp .env.example .env

# Edit .env with your API keys (see Environment Setup section below)
```

### **4. Start Development**
```bash
# Start main application (http://localhost:3000)
pnpm dev

# Start voice agent in separate terminal (optional)
pnpm voice:dev
```

---

## ⚙️ Environment Setup

### **Create .env File**
Create a `.env` file in the project root with the following variables:

```bash
# === DATABASE (Supabase) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# === AI SERVICES ===
OPENAI_API_KEY=sk-proj-your-openai-key
GROQ_API_KEY=gsk_your-groq-key

# === VOICE INFRASTRUCTURE ===
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
DEEPGRAM_API_KEY=your_deepgram_api_key

# === VOICE ASSISTANT CONFIGURATION ===
ASSISTANT_VOICE=en-US-Ava
NEXT_PUBLIC_ASSISTANT_ENABLED=true
```

### **API Key Setup Guide**

#### **1. Supabase (Database)**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings → API
3. Copy the **URL** and **anon/public** key
4. Set up the required database tables (see Database Setup section)

#### **2. OpenAI (AI Insights)**
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create an API key from API Keys section
3. Add the key to your `.env` file

#### **3. Groq (Voice Assistant LLM)**
1. Sign up at [console.groq.com](https://console.groq.com)
2. Get your API key from the dashboard
3. Add to `GROQ_API_KEY`

#### **4. Deepgram (Speech Services)**
1. Create account at [console.deepgram.com](https://console.deepgram.com)
2. Get your API key from the dashboard
3. Add to `DEEPGRAM_API_KEY`

#### **5. LiveKit (Voice Infrastructure)**
1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Create a new project
3. Get your API key and secret
4. Configure your LiveKit server URL

---

## 🏃‍♂️ Running the Application

### **Main Dashboard Application**

#### **Development Mode**
```bash
# Start development server with hot reload
pnpm dev
# or
npm run dev

# Application will be available at:
# http://localhost:3000
```

#### **Production Mode**
```bash
# Build the application
pnpm build
# or
npm run build

# Start production server
pnpm start
# or
npm start
```

### **Application Access**
- **Main Dashboard**: http://localhost:3000
- **Portal Selection**: Choose between "Farmer App" and "Processor App"
- **Voice Assistant**: Floating widget in bottom-right corner (when configured)

---

## 🎤 Voice Agent Setup

### **Development Mode**
```bash
# Start voice agent with development logging
pnpm voice:dev
# or
npm run voice:dev
```

### **Production Mode**
```bash
# Start with PM2 process manager
pnpm voice:pm2

# Check status
pnpm voice:status

# View logs
pnpm voice:logs

# Stop agent
pnpm voice:stop
```

### **Voice Agent Features**
When running, the voice agent supports:

- **🗣️ Voice Commands**: "Check my inventory", "Commit 50kg to order ABC"
- **🌤️ Weather Information**: "Weather forecast", "Rain forecast"
- **📦 Delivery Tracking**: "Check my deliveries", "Pending deliveries"
- **💰 Market Information**: "Market prices", "Cocoa prices"
- **🔍 Quality Assessment**: "Quality check", "Grade assessment"
- **🚚 Logistics**: "Schedule pickup", "Arrange pickup"

### **Voice Agent Verification**
When the voice agent starts successfully, you should see:
```bash
🍫 Starting CacaoConnect Voice Agent...
✅ Groq API Key: SET
✅ Supabase URL: SET
✅ Deepgram API Key: SET
✅ LiveKit URL: SET
🎉 Voice agent is ready to use!
```

---

## 📜 Available Commands

### **Application Commands**
```bash
# Development
pnpm dev              # Start Next.js development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### **Voice Agent Commands**
```bash
# Voice Agent Management
pnpm voice:dev        # Start voice agent in development mode
pnpm voice:start      # Start voice agent in production mode
pnpm voice:pm2        # Start with PM2 process manager
pnpm voice:stop       # Stop voice agent
pnpm voice:restart    # Restart voice agent
pnpm voice:logs       # View voice agent logs
pnpm voice:status     # Check voice agent status
pnpm voice:setup      # Setup and start voice agent
```

### **Package Manager Alternatives**
All commands work with both `pnpm` and `npm`:
```bash
# npm equivalents
npm run dev
npm run voice:dev
# etc.
```

---

## 🏗️ Architecture

### **System Overview**
```
┌─────────────────┐         ┌─────────────────┐
│   Processor     │         │     Farmer      │
│   Dashboard     │         │   Mobile App    │
│   (Desktop)     │         │   (Mobile-first)│
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌───────────────┐      │
         └────►   Supabase    ◄──────┘
              │   PostgreSQL   │
              │   Real-time DB │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼─────┐ ┌─────▼─────┐ ┌─────▼────┐
   │ OpenAI   │ │   Groq    │ │Deepgram │
   │GPT-4o-mini│ │ Llama3    │ │ STT/TTS │
   │ (Insights)│ │ (Voice)   │ │ (Audio) │
   └───────────┘ └───────────┘ └─────────┘
```

### **Technology Stack**
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **AI Services**: OpenAI GPT-4o-mini, Groq Llama3 70B
- **Voice**: LiveKit (real-time audio), Deepgram (STT/TTS)
- **Process Management**: PM2 for voice agent

### **Project Structure**
```
cacaoconnect-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── components/        # Page components
│   └── layout.js          # Root layout with voice assistant
├── components/            # Shared React components
│   ├── VoiceAssistantComponent.jsx
│   ├── FloatingVoiceAssistant.jsx
│   └── ...
├── agent/                 # Voice agent server
│   ├── voice-agent.js     # Original voice agent
│   └── voice-agent-simple.js # Simplified working version
├── lib/                   # Utilities and business logic
│   ├── env-validation.js  # Environment validation
│   └── voiceService.js    # Voice service utilities
├── scripts/               # Management scripts
├── ecosystem.config.js    # PM2 configuration
└── package.json
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Port Already in Use**
```bash
# Error: Port 3000 is already in use
# Solution: Kill existing process or use different port
lsof -ti:3000 | xargs kill -9
```

#### **2. Environment Variables Not Working**
```bash
# Issue: NEXT_PUBLIC_ variables not accessible in browser
# Solution: Ensure they're prefixed with NEXT_PUBLIC_ and restart server

# Verify variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### **3. Voice Agent Not Starting**
```bash
# Error: Cannot find module or API key missing
# Solution: Check .env file and dependencies

# Verify environment variables
pnpm voice:dev
# Look for ✅ SET confirmations in output
```

#### **4. LiveKit Connection Issues**
```bash
# Error: Failed to connect to LiveKit
# Solution: Verify LIVEKIT_URL and API keys
# Ensure URL starts with wss:// for secure connections
```

#### **5. Database Connection Issues**
```bash
# Error: Supabase connection failed
# Solution: Verify URL and anon key format
# Check network connectivity to Supabase
```

### **Getting Help**
1. Check the browser console for detailed error messages
2. Verify all API keys are correctly set in `.env`
3. Ensure all dependencies are installed
4. Check that Node.js version is 18+

### **Debug Mode**
```bash
# Enable verbose logging
DEBUG=* pnpm voice:dev

# Check application logs
pnpm dev
# Look for detailed error messages in terminal
```

---

## 👨‍💻 Development Guide

### **Development Workflow**

#### **1. Setup Development Environment**
```bash
# Clone repository
git clone <repository-url>
cd cacaoconnect/cacaoconnect-dashboard

# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and fill with your API keys

# Start development server
pnpm dev
```

#### **2. Voice Agent Development**
```bash
# Start voice agent in development mode
pnpm voice:dev

# Monitor logs for real-time feedback
# Voice agent will run with debugging enabled
```

#### **3. Testing the Application**
- **Main Dashboard**: Visit http://localhost:3000
- **Voice Assistant**: Click the floating voice widget in bottom-right
- **Portal Selection**: Choose between Farmer and Processor interfaces

### **Key Development Features**

#### **Real-time Updates**
- 3-5 second polling for live data
- Supabase real-time subscriptions for instant updates
- WebSocket connections for voice communication

#### **Environment Validation**
- Automatic validation of required environment variables
- Client-side validation for public variables
- Server-side validation for private keys

#### **Voice Assistant Integration**
- Floating widget appears in bottom-right corner
- Supports both voice commands and text input
- Farming-specific command recognition
- Real-time audio processing

### **Code Quality**
- ESLint configuration for code consistency
- TypeScript/JavaScript best practices
- Component-based architecture
- Environment variable validation

### **Database Schema**
Core tables:
- `orders` - Demand broadcasting and tracking
- `commitments` - Farmer offers and commitments
- `inventory` - Stock tracking by bean type and grade

---

## 🚀 Deployment

### **Production Deployment Steps**

#### **1. Build Application**
```bash
# Build optimized production version
pnpm build

# Test production build locally
pnpm start
```

#### **2. Set Production Environment**
```bash
# Set production environment variables
export NODE_ENV=production

# Ensure all production API keys are set
# Use environment-specific configurations
```

#### **3. Deploy Voice Agent**
```bash
# Setup voice agent for production
pnpm voice:setup

# Start with PM2 for process management
pnpm voice:pm2

# Verify voice agent is running
pnpm voice:status
```

### **Deployment Platforms**
- **Vercel**: Recommended for Next.js applications
- **Railway**: Good for full-stack applications with databases
- **DigitalOcean**: For custom server deployments
- **AWS**: For enterprise-scale deployments

---

## 📞 Support

### **Getting Help**
- Check the browser console for detailed error messages
- Verify all API keys are correctly configured
- Ensure all required services are accessible
- Review the troubleshooting section above

### **Documentation**
- See `/VOICE_ASSISTANT_README.md` for detailed voice assistant setup
- Check component files for inline documentation
- Review environment validation logic in `/lib/env-validation.js`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Standards**
- Follow ESLint configuration
- Write clear commit messages
- Update documentation for new features
- Test voice agent functionality when making audio-related changes

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">

**🍫 Empowering Cacao Farmers with AI-Driven Supply Chain Solutions**

*Built with ❤️ for Cacao de Davao and their farmer partners*

</div>