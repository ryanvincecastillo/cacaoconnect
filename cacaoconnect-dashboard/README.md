# CacaoConnect Dashboard - Developer Guide

**Technical documentation for the CacaoConnect AI-driven supply chain platform**

This guide covers setup, development, deployment, and troubleshooting for developers working on the CacaoConnect dashboard application.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Development](#-development)
- [Voice Assistant](#-voice-assistant)
- [Database Configuration](#-database-configuration)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

**Get running in 5 minutes:**

```bash
# 1. Navigate to dashboard directory
cd cacaoconnect-dashboard

# 2. Install dependencies (use pnpm for faster installs)
pnpm install
# or: npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your API keys (see Environment Setup below)

# 4. Start development server
pnpm dev
# Application will be available at http://localhost:3000

# 5. (Optional) Start voice agent in another terminal
pnpm voice:dev
```

**First time setup?** See the [detailed prerequisites](#-prerequisites) and [environment setup](#-environment-setup) sections.

---

## 🛠️ Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher (20 recommended)
- **Package Manager**: pnpm (recommended), npm, or yarn
- **Git**: For version control
- **Terminal**: Bash, Zsh, or PowerShell

**Check your versions:**
```bash
node --version  # Should be v18.0.0 or higher
pnpm --version  # Should be 8.0.0 or higher
git --version
```

### Required API Keys

You'll need accounts and API keys from these services:

| Service | Purpose | Cost | Sign Up |
|---------|---------|------|---------|
| **Supabase** | Database & Real-time | Free tier available | [supabase.com](https://supabase.com) |
| **OpenAI** | AI Insights (GPT-4o-mini) | Pay-as-you-go | [platform.openai.com](https://platform.openai.com) |
| **Groq** | Voice LLM (Llama3) | Free tier available | [console.groq.com](https://console.groq.com) |
| **Deepgram** | Speech-to-Text & TTS | Free tier available | [console.deepgram.com](https://console.deepgram.com) |
| **LiveKit** | Voice Infrastructure | Free tier available | [cloud.livekit.io](https://cloud.livekit.io) |

**Pro tip:** Start with free tiers for all services during development. Upgrade to paid plans when deploying to production.

---

## ⚙️ Environment Setup

### 1. Create Environment File

Create a `.env` file in the `cacaoconnect-dashboard/` directory:

```bash
# Copy the example file
cp .env.example .env

# Or create manually
touch .env
```

### 2. Add Environment Variables

Add these variables to your `.env` file:

```bash
# ============================================
# DATABASE (Supabase)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ============================================
# AI SERVICES
# ============================================
# OpenAI - For supply chain insights and forecasting
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Groq - For voice assistant conversations
GROQ_API_KEY=gsk_your-groq-api-key-here

# ============================================
# VOICE INFRASTRUCTURE
# ============================================
# LiveKit - Real-time audio communication
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Deepgram - Speech-to-Text and Text-to-Speech
DEEPGRAM_API_KEY=your_deepgram_api_key

# ============================================
# VOICE ASSISTANT CONFIGURATION
# ============================================
ASSISTANT_VOICE=en-US-Ava
NEXT_PUBLIC_ASSISTANT_ENABLED=true

# ============================================
# OPTIONAL: Base URL (for production)
# ============================================
# NEXT_PUBLIC_BASE_URL=https://your-production-domain.com
```

### 3. Get API Keys

#### Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to **Project Settings → API**
4. Copy the **URL** and **anon/public** key
5. See [Database Configuration](#-database-configuration) for table setup

#### OpenAI Setup
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create account or sign in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-proj-`)
6. Add to `OPENAI_API_KEY`

#### Groq Setup
1. Sign up at [console.groq.com](https://console.groq.com)
2. Navigate to **API Keys** in dashboard
3. Create a new API key
4. Copy the key (starts with `gsk_`)
5. Add to `GROQ_API_KEY`

#### Deepgram Setup
1. Create account at [console.deepgram.com](https://console.deepgram.com)
2. Go to **API Keys** section
3. Create a new key
4. Copy the key
5. Add to `DEEPGRAM_API_KEY`

#### LiveKit Setup
1. Sign up at [cloud.livekit.io](https://cloud.livekit.io)
2. Create a new project
3. Get your **API Key** and **API Secret**
4. Your server URL will be `wss://your-project.livekit.cloud`
5. Add all three values to the respective variables

---

## 💻 Development

### Available Scripts

```bash
# Main Application
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Voice Agent (see Voice Assistant section)
pnpm voice:dev        # Start voice agent with development logging
pnpm voice:pm2        # Start voice agent with PM2
pnpm voice:stop       # Stop voice agent
pnpm voice:restart    # Restart voice agent
pnpm voice:logs       # View voice agent logs
pnpm voice:status     # Check voice agent status
```

### Project Structure

```
cacaoconnect-dashboard/
│
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── livekit-token/      # LiveKit token generation
│   │   ├── chat/               # OpenAI chat endpoint
│   │   └── voice-command/      # Voice command processing
│   ├── components/             # Page-level components
│   │   ├── CacaoConnectMVP.jsx      # Main app component
│   │   ├── ProcessorApp.jsx         # Processor dashboard
│   │   └── FarmerApp.jsx            # Farmer mobile interface
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout with voice assistant
│   └── page.js                 # Home page
│
├── components/                  # Shared React components
│   ├── VoiceAssistantComponent.jsx  # Voice interaction component
│   ├── FloatingVoiceAssistant.jsx   # Floating widget
│   ├── VoiceFeedbackIndicator.jsx   # Voice status indicator
│   ├── ErrorBoundary.jsx            # Error handling
│   └── shared.js                     # Shared UI utilities
│
├── lib/                        # Business logic & utilities
│   ├── env-validation.js       # Environment variable validation
│   └── voiceService.js         # Voice service utilities
│
├── agent/                      # Voice agent server (Node.js)
│   ├── voice-agent.js          # Full voice agent implementation
│   └── voice-agent-simple.js   # Simplified version for testing
│
├── scripts/                    # Deployment & management scripts
│   └── start-voice-agent.sh    # Voice agent startup script
│
├── public/                     # Static assets
├── logs/                       # Application logs (git-ignored)
│
├── ecosystem.config.js         # PM2 process configuration
├── package.json               # Dependencies and scripts
├── next.config.mjs            # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── .env                       # Environment variables (git-ignored)
└── README.md                  # This file
```

### Development Workflow

#### 1. Start Development Environment

```bash
# Terminal 1: Main application
cd cacaoconnect-dashboard
pnpm dev

# Terminal 2: Voice agent (optional)
pnpm voice:dev
```

#### 2. Access the Application

- **Main App**: http://localhost:3000
- **Portal Selection**: Choose "Farmer App" or "Processor Dashboard"
- **Voice Widget**: Floating button in bottom-right corner

#### 3. Make Changes

- **Hot Reload**: Changes to files automatically reload the browser
- **Voice Agent**: Requires manual restart after changes
- **Environment Variables**: Require server restart to take effect

#### 4. Debug Tips

**Browser DevTools:**
```bash
# Open Chrome DevTools
Cmd/Ctrl + Opt/Alt + I

# Useful tabs:
# - Console: JavaScript errors and logs
# - Network: API calls and responses
# - Application: LocalStorage, cookies, service workers
```

**Server Logs:**
```bash
# Next.js logs appear in terminal where pnpm dev is running
# Voice agent logs:
pnpm voice:logs

# Or check log files:
tail -f logs/voice-agent-combined.log
```

---

## 🎤 Voice Assistant

The voice assistant system consists of three main parts:

1. **Client Components** - React components for voice interaction
2. **API Routes** - Next.js API endpoints for token generation
3. **Voice Agent Server** - Node.js server for audio processing

### Voice Assistant Setup

**Minimum configuration needed:**
```bash
# In .env file
NEXT_PUBLIC_LIVEKIT_URL=wss://your-server.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
DEEPGRAM_API_KEY=your_key
GROQ_API_KEY=your_key
NEXT_PUBLIC_ASSISTANT_ENABLED=true
```

### Starting the Voice Agent

**Development mode:**
```bash
# Simple test mode (no LiveKit required)
pnpm voice:dev

# This will:
# ✅ Test Groq connection
# ✅ Test Supabase connection
# ✅ Show available voice commands
# ✅ Run in standalone mode
```

**Production mode:**
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

### Voice Commands

Users can say:

- **Inventory**: "Check my inventory", "What do I have?"
- **Orders**: "Commit 50kg to order ABC"
- **Deliveries**: "Check my deliveries", "Pending deliveries"
- **Weather**: "Weather forecast", "Rain forecast"
- **Market**: "Market prices", "Cocoa prices"
- **Quality**: "Quality check", "Grade assessment"
- **Logistics**: "Schedule pickup", "Arrange pickup"

### Voice Agent Monitoring

**Check if voice agent is running:**
```bash
pnpm voice:status
```

**View real-time logs:**
```bash
pnpm voice:logs
```

**Restart after changes:**
```bash
pnpm voice:restart
```

**For detailed voice assistant documentation, see [VOICE_ASSISTANT_README.md](./VOICE_ASSISTANT_README.md)**

---

## 🗄️ Database Configuration

### Database Setup

CacaoConnect uses Supabase (PostgreSQL) for data storage.

#### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize (~2 minutes)
4. Copy the URL and anon key to your `.env`

#### 2. Create Tables

In your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Create a new query
3. Paste and execute the following SQL:

```sql
-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  volume_kg INTEGER NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  deadline DATE NOT NULL,
  bean_type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMMITMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  farmer_id UUID,
  committed_volume_kg INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  bean_type TEXT,
  quality_grade CHAR(1) DEFAULT 'A',
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT commitments_status_check CHECK (
    status = ANY (ARRAY[
      'pending', 'approved', 'rejected', 'ready', 
      'collected', 'delivered', 'paid'
    ])
  )
);

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID,
  bean_type TEXT NOT NULL,
  quantity_kg INTEGER NOT NULL,
  quality_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_commitments_order_id 
  ON commitments(order_id);

CREATE INDEX IF NOT EXISTS idx_commitments_status 
  ON commitments(status);

CREATE INDEX IF NOT EXISTS idx_inventory_owner 
  ON inventory(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
  ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_deadline 
  ON orders(deadline);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commitments_updated_at 
  BEFORE UPDATE ON commitments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3. Add Sample Data (Optional)

```sql
-- Sample order
INSERT INTO orders (title, volume_kg, price_per_kg, deadline, bean_type)
VALUES (
  'Urgent Wet Beans - Week 47',
  5000,
  48.00,
  CURRENT_DATE + INTERVAL '7 days',
  'Wet Beans'
);

-- Sample inventory
INSERT INTO inventory (owner_type, bean_type, quantity_kg, quality_notes)
VALUES 
  ('farmer', 'Wet Beans', 250, 'Grade A - Fresh harvest'),
  ('farmer', 'Dried Beans', 180, 'Grade B - Sun dried'),
  ('processor', 'Fermented', 500, 'Grade A - Ready for processing');
```

### Database Schema Details

**For complete schema documentation, status workflows, and quality grading system, see the [main README](../README.md#database-schema).**

---

## 📡 API Reference

### DataService Methods

The `DataService` object (in `components/shared.js`) provides methods for database operations:

#### Orders

```javascript
// Get orders with progress calculations
const orders = await DataService.getOrdersWithProgress();

// Create new order
await DataService.createOrder({
  title: "Urgent Wet Beans Batch A",
  volume_kg: 5000,
  price_per_kg: 48.00,
  deadline: "2025-12-31",
  bean_type: "Wet Beans"
});

// Update order status
await DataService.updateOrderStatus(orderId, 'filled');
```

#### Commitments

```javascript
// Commit to an order
await DataService.commitToOrder(
  orderId,           // UUID
  volume,            // number (kg)
  farmerId,          // UUID (optional)
  beanType,          // string
  qualityGrade       // 'A' | 'B' | 'C'
);

// Get farmer commitments
const commitments = await DataService.getFarmerCommitments(farmerId);

// Update commitment status
await DataService.updateCommitmentStatus(commitmentId, 'approved');

// Mark commitment as ready for pickup
await DataService.markAsReady(commitmentId);
```

#### Inventory & Supply

```javascript
// Get inventory by owner type
const farmerStock = await DataService.getInventory('farmer');
const processorStock = await DataService.getInventory('processor');

// Get aggregated supply across all farmers
const supply = await DataService.getAggregatedSupply();
// Returns: [{ type: 'Wet Beans', quantity: 5000 }, ...]

// Get partner network with performance data
const partners = await DataService.getPartnerNetwork();

// Get farmers with beans ready for pickup
const readyCommitments = await DataService.getFarmersReadyForPickup();
```

#### Dashboard Statistics

```javascript
// Get dashboard KPIs
const stats = await DataService.getStats();
// Returns: {
//   totalVol: number,
//   activeFarmers: number,
//   pendingCommitments: number,
//   inTransit: number,
//   activeOrders: number
// }
```

### AI Functions

```javascript
// OpenAI chat completion (for supply chain insights)
const result = await callOpenAIJSON(prompt);

// Text-to-speech (browser-based)
await callTTS(text);
```

### API Routes

#### LiveKit Token Generation

```javascript
// GET /api/livekit-token
const response = await fetch('/api/livekit-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    room: 'cacao-voice-assistant',
    userType: 'farmer',
    userId: 'user-123'
  })
});

const { token, url } = await response.json();
```

#### Voice Command Processing

```javascript
// POST /api/voice-command
const response = await fetch('/api/voice-command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: "Check my inventory",
    userId: "user-123",
    userType: "farmer"
  })
});

const { text, action, data } = await response.json();
```

---

## 🧪 Testing

### Manual Testing

**Test the main application:**
1. Start dev server: `pnpm dev`
2. Open http://localhost:3000
3. Test portal selection
4. Test farmer and processor interfaces
5. Test order creation and commitment flow

**Test voice assistant:**
1. Start voice agent: `pnpm voice:dev`
2. Check console for successful connections
3. Test voice commands through the UI
4. Verify speech recognition works
5. Test text-to-speech output

### Environment Validation

```bash
# Check if environment is configured correctly
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Supabase URL set' : '❌ Missing Supabase URL')"
```

### Database Testing

```sql
-- Test order creation
INSERT INTO orders (title, volume_kg, price_per_kg, deadline, bean_type)
VALUES ('Test Order', 100, 45.00, CURRENT_DATE + 7, 'Wet Beans')
RETURNING *;

-- Test commitment creation
INSERT INTO commitments (order_id, committed_volume_kg, quality_grade)
SELECT id, 50, 'A' FROM orders WHERE title = 'Test Order'
RETURNING *;
```

---

## 🚀 Deployment

### Production Build

```bash
# Build the application
pnpm build

# Test production build locally
pnpm start
```

### Environment Variables for Production

**Create `.env.production` file:**
```bash
# Use production API keys
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key_here
OPENAI_API_KEY=prod_openai_key
# ... etc
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd cacaoconnect-dashboard
vercel

# Or push to GitHub and connect to Vercel dashboard
```

### Deploy Voice Agent

**On your server:**
```bash
# Install PM2 globally
npm install -g pm2

# Setup voice agent
cd cacaoconnect-dashboard
./scripts/start-voice-agent.sh

# Enable auto-restart on server reboot
pm2 startup
pm2 save
```

### Deployment Checklist

- [ ] All environment variables configured in production
- [ ] Database tables created and indexed
- [ ] SSL/TLS enabled for LiveKit connection
- [ ] CORS configured for API routes
- [ ] Voice agent running with PM2
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Error: Port 3000 is already in use
# Solution: Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

#### Environment Variables Not Loading

```bash
# Issue: NEXT_PUBLIC_ variables not accessible in browser
# Solution: 
1. Ensure they're prefixed with NEXT_PUBLIC_
2. Restart the dev server
3. Clear browser cache

# Verify variables are loaded
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### Voice Agent Won't Start

```bash
# Error: Cannot find module or API key missing
# Solution:

1. Check .env file exists and has all required variables
2. Verify environment variables are loaded:
   pnpm voice:dev
   # Look for ✅ SET confirmations

3. Check dependencies installed:
   pnpm install

4. Check PM2 status:
   pm2 list
```

#### Database Connection Failed

```bash
# Error: Supabase connection failed
# Solutions:

1. Verify URL and anon key in .env
2. Check Supabase project is active
3. Test connection in browser:
   https://your-project.supabase.co/rest/v1/
4. Check network/firewall settings
```

#### Speech Recognition Not Working

```bash
# Error: Speech recognition failed
# Solutions:

1. Use HTTPS (required for microphone access)
   # In development, use: localhost (http allowed)
   # In production, must use https://

2. Check microphone permissions in browser

3. Verify Deepgram API key is set

4. Check browser compatibility:
   # Chrome/Edge: Full support
   # Safari: Limited support
   # Firefox: Limited support
```

### Debug Mode

```bash
# Enable verbose logging for Next.js
DEBUG=* pnpm dev

# Enable verbose logging for voice agent
DEBUG=livekit:* pnpm voice:dev

# Check voice agent logs
pnpm voice:logs

# Check PM2 logs
pm2 logs cacao-voice-agent
```

### Getting Help

1. **Check browser console** for JavaScript errors
2. **Check server terminal** for API errors
3. **Review environment variables** - most issues are configuration
4. **Test API endpoints** using Postman or curl
5. **Check service status** (Supabase, LiveKit, etc.)

**Still stuck?** Open an issue on GitHub with:
- Error messages
- Steps to reproduce
- Environment (OS, Node version, browser)
- Relevant logs

---

## 🤝 Contributing

### Development Setup for Contributors

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/cacaoconnect.git
cd cacaoconnect/cacaoconnect-dashboard

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/cacaoconnect.git

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to your fork
git push origin feature/your-feature-name

# Open Pull Request on GitHub
```

### Code Style

- **JavaScript/React**: Follow ESLint configuration
- **Components**: Use functional components with hooks
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions, inline for complex logic

### Testing Your Changes

Before submitting a PR:

```bash
# Run linter
pnpm lint

# Build to check for errors
pnpm build

# Test voice features if modified
pnpm voice:dev

# Test in both portals
# - Farmer App (mobile view)
# - Processor Dashboard (desktop view)
```

### Pull Request Guidelines

1. **Clear Description**: Explain what and why
2. **Small Changes**: One feature per PR
3. **Update Docs**: If adding features
4. **Test**: Ensure it works locally
5. **Screenshots**: For UI changes

---

## 📚 Additional Resources

### Documentation

- **[Main README](../README.md)** - Business overview and features
- **[Voice Assistant Guide](./VOICE_ASSISTANT_README.md)** - Voice AI setup
- **[Database Schema](../README.md#database-schema)** - Tables and workflows

### External Documentation

- **[Next.js Docs](https://nextjs.org/docs)** - Framework reference
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth
- **[LiveKit Docs](https://docs.livekit.io)** - Voice infrastructure
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling

### Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Pull Requests**: Code contributions

---

<div align="center">

**Built with ❤️ for Cacao de Davao**

[Report Bug](../../issues) • [Request Feature](../../issues) • [View Roadmap](../README.md#roadmap)

</div>