# 🍫 CacaoConnect

**AI-Driven Supply Chain Visibility Platform for Cacao de Davao**

> Solving material reliability challenges by connecting chocolate processors with farmers through real-time supply tracking, AI-powered forecasting, and early-warning systems.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Quick Navigation

- **[For Developers](#-for-developers)** - Setup, installation, and technical documentation
- **[For Business Stakeholders](#-the-business-problem)** - Problem overview and solution impact
- **[Features Overview](#-solution-overview)** - What the platform does
- **[Architecture](#-architecture-at-a-glance)** - How it works
- **[Roadmap](#-roadmap)** - Future development plans

---

## 🚀 For Developers

**Get started in 5 minutes:**

```bash
# Navigate to dashboard
cd cacaoconnect-dashboard

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Add your API keys to .env

# Start development
pnpm dev

# Optional: Start voice agent
pnpm voice:dev
```

📚 **Complete Technical Documentation:**
- **[Developer Guide](./cacaoconnect-dashboard/README.md)** - Full setup, API keys, troubleshooting
- **[Voice Assistant Setup](./cacaoconnect-dashboard/VOICE_ASSISTANT_README.md)** - Voice AI integration
- **[API Reference](./cacaoconnect-dashboard/README.md#api-reference)** - DataService methods
- **[Database Schema](#database-schema)** - Tables and relationships

**Tech Stack:** Next.js 16 • React 19 • Supabase • OpenAI • LiveKit • Groq • Deepgram

---

## 🎯 The Business Problem

**Cacao de Davao** is a family-rooted chocolate company supporting local farmers in Davao, the "cacao capital of the Philippines." Despite strong branding and market presence, they face a critical operational challenge:

### Material Reliability Crisis

**Unpredictable harvests create an unstable supply of cacao beans**, causing:

| Impact Area | Problem |
|-------------|---------|
| **Production** | Slowdowns and idle time when beans aren't available |
| **Inventory** | Inconsistent product availability for customers |
| **Financial** | Significant losses from delayed orders and wasted capacity |
| **Planning** | Unable to forecast production or commit to buyers |

### Root Causes

1. **Zero Visibility** - No real-time view into farmer inventory
2. **No Early Warnings** - Supply gaps discovered too late
3. **Communication Gap** - Farmers unaware of processor needs
4. **No Forecasting** - Cannot predict supply based on weather/trends

---

## 💡 Solution Overview

**CacaoConnect** creates **end-to-end visibility** between Cacao de Davao and their farmer network through a dual-portal platform.

### For the Processor (Cacao de Davao HQ)

✅ **Real-time supply visibility** - See available beans across all farmers  
✅ **Demand broadcasting** - Publish orders reaching farmers instantly  
✅ **AI-powered forecasting** - Predict supply gaps before they happen  
✅ **Early warning alerts** - Weather risks, low commitments, supply shortfalls  
✅ **Partner performance tracking** - Reliability scores and stock levels  

### For Farmers

✅ **Market access** - See processor needs and pricing instantly  
✅ **AI harvest advisor** - Weather-based commitment recommendations  
✅ **Fair pricing** - Transparent quality grading (A/B/C) with multipliers  
✅ **Status tracking** - Real-time bean location in supply chain  
✅ **Voice assistant** - Hands-free interaction for field work  

### The Result

📊 **Predictable supply flow** → Consistent production → Reliable product availability → Financial stability

---

## ✨ Key Features

### 1. Supply Visibility & Forecasting

| Feature | Business Value |
|---------|----------------|
| **Partner Network Dashboard** | Real-time inventory across all farmers |
| **Regional Supply Aggregation** | Total available beans by type/region |
| **AI Supply Forecasts** | 7-30 day predictions with confidence levels |
| **Ready-for-Pickup Alerts** | Instant notification when beans available |

### 2. Early Warning System

| Feature | Risk Mitigation |
|---------|----------------|
| **Order Fill Tracking** | Live progress bars on fulfillment status |
| **AI Risk Alerts** | Weather warnings, supply shortfalls, logistics delays |
| **Pending Review Counter** | Track farmer offers needing attention |
| **Reliability Scores** | Identify dependable partners |

### 3. Demand-Supply Matching

| Feature | Efficiency Gain |
|---------|----------------|
| **Order Broadcasting** | Eliminate manual calls to farmers |
| **Commitment Management** | Digital approval/rejection workflow |
| **Quality Grading** | Automatic price adjustment (A: 100%, B: 85%, C: 70%) |
| **Volume Tracking** | Real-time committed vs. target |

### 4. Voice AI Assistant

| Feature | Accessibility |
|---------|--------------|
| **Voice Commands** | Hands-free operation for farmers |
| **Multi-language Support** | English, Bisaya, Tagalog (planned) |
| **Natural Conversations** | "Check my inventory", "Commit 50kg to order ABC" |
| **Farming Context** | Weather, market prices, quality tips |

---

## 🔄 How It Works

### The Supply Chain Flow

```
1. PROCESSOR BROADCASTS DEMAND
   └─→ "Need 5,000kg Wet Beans by Jan 15 @ ₱48/kg"

2. FARMERS SEE & RESPOND
   └─→ AI advises: "Weather looks good, commit 500kg Grade A"
   └─→ Farmer commits with quality grade

3. PROCESSOR REVIEWS & APPROVES
   └─→ See all offers, approve/reject based on grade & reliability
   └─→ Live fill % updates as commitments approved

4. FARMER MARKS READY
   └─→ Beans harvested and prepared for pickup
   └─→ Processor gets alert: "3 farmers ready for pickup"

5. LOGISTICS & DELIVERY
   └─→ Processor schedules pickup
   └─→ Track: Collected → In Transit → Delivered

6. PAYMENT
   └─→ Auto-calculated: Volume × Price × Grade Multiplier
   └─→ Transparent breakdown for farmer
```

### Real-Time Visibility Loop

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   FARMER INVENTORY    →    PROCESSOR DASHBOARD  │
│   (Stock updates)          (Live aggregation)   │
│                                                 │
│   COMMITMENTS         →    FILL TRACKING        │
│   (Farmer offers)          (Progress %)         │
│                                                 │
│   STATUS CHANGES      →    ALERTS & KPIs        │
│   (Ready/Collected)        (Early warnings)     │
│                                                 │
└─────────────────────────────────────────────────┘
        ↑                              │
        │      3-5 second polling      │
        └──────────────────────────────┘
```

---

## 🏗️ Architecture at a Glance

### System Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Processor     │         │     Farmer      │
│   Dashboard     │         │   Mobile App    │
│   (Desktop)     │         │ (Mobile-first)  │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌───────────────┐      │
         └────►   Supabase    ◄──────┘
              │  PostgreSQL   │
              │  Real-time DB │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼─────┐ ┌─────▼─────┐ ┌─────▼────┐
   │ OpenAI   │ │   Groq    │ │Deepgram │
   │GPT-4o-mini│ │  Llama3   │ │ STT/TTS │
   │(Insights)│ │  (Voice)  │ │ (Audio) │
   └───────────┘ └───────────┘ └─────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | React framework with SSR |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Database** | Supabase (PostgreSQL) | Real-time database with REST API |
| **AI/ML** | OpenAI GPT-4o-mini | Supply chain insights & forecasting |
| **Voice LLM** | Groq Llama3 70B | Conversational AI for farmers |
| **Voice Infra** | LiveKit | Real-time audio communication |
| **Speech** | Deepgram | Speech-to-Text + Text-to-Speech |
| **Icons** | Lucide React | Consistent icon system |

---

## 📊 Database Schema

### Core Tables

#### `orders` - Demand Broadcasting
```sql
id              UUID PRIMARY KEY
title           TEXT
volume_kg       INTEGER
price_per_kg    DECIMAL(10,2)
bean_type       TEXT
deadline        DATE
status          TEXT DEFAULT 'open'
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### `commitments` - Farmer Offers
```sql
id                      UUID PRIMARY KEY
order_id                UUID REFERENCES orders(id)
farmer_id               UUID
committed_volume_kg     INTEGER
bean_type               TEXT
quality_grade           CHAR(1)  -- A, B, C
status                  TEXT DEFAULT 'pending'
location                TEXT
created_at              TIMESTAMP
updated_at              TIMESTAMP

CONSTRAINT status_check CHECK (
  status IN ('pending', 'approved', 'rejected', 'ready', 
             'collected', 'delivered', 'paid')
)
```

#### `inventory` - Stock Tracking
```sql
id              UUID PRIMARY KEY
owner_type      TEXT  -- 'farmer' or 'processor'
owner_id        UUID
bean_type       TEXT
quantity_kg     INTEGER
quality_notes   TEXT
created_at      TIMESTAMP
```

### Status Workflows

**Order Status (Auto-Derived):**
```
OPEN → FILLED → IN_TRANSIT → DELIVERED → COMPLETED
```

**Commitment Status:**
```
PENDING → APPROVED → READY → COLLECTED → DELIVERED → PAID
    ↓
REJECTED
```

**Quality Grade Pricing:**
- Grade A: 100% (premium, fully fermented, no defects)
- Grade B: 85% (good quality, minor defects)
- Grade C: 70% (acceptable, requires sorting)

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Platform (Complete)
- [x] Dual-portal architecture (Processor + Farmer)
- [x] Real-time data polling (3-5 second updates)
- [x] Order broadcasting and commitment workflow
- [x] Inventory tracking by bean type and grade

### ✅ Phase 2: Supply Visibility (Complete)
- [x] Partner Network dashboard with reliability scores
- [x] Regional supply aggregation
- [x] AI forecasting & recommendations (OpenAI GPT-4o-mini)
- [x] Risk alerts and early warnings
- [x] Quality grading system (A/B/C)
- [x] Fill progress tracking with live percentages

### ✅ Phase 3: Voice Assistant (Complete)
- [x] Voice AI infrastructure (LiveKit + Deepgram + Groq)
- [x] Farming-specific voice commands
- [x] Natural language understanding
- [x] Voice feedback indicators
- [x] Floating assistant widget

### 🔄 Phase 4: Authentication & Security (In Progress)
- [ ] Supabase Auth (OTP for farmers, email for processors)
- [ ] Row Level Security (RLS) policies
- [ ] Environment variable migration to production
- [ ] Audit logging for sensitive actions

### 📱 Phase 5: Mobile & Offline (Planned)
- [ ] Progressive Web App (PWA) support
- [ ] Offline data sync with background queuing
- [ ] Push notifications for critical alerts
- [ ] Native mobile apps (iOS/Android)

### 💰 Phase 6: Payments & Logistics (Planned)
- [ ] GCash/Maya payment integration
- [ ] GPS tracking for deliveries
- [ ] SMS alerts for farmers without internet
- [ ] Automated payment calculations

### 🤖 Phase 7: Advanced AI (Planned)
- [ ] Weather API integration (PAGASA)
- [ ] Price forecasting based on market trends
- [ ] Multi-language voice support (Bisaya, Tagalog)
- [ ] Crop yield predictions
- [ ] Disease detection from photos

---

## 🚀 Getting Started

### Quick Start for Developers

```bash
# 1. Clone repository
git clone https://github.com/your-org/cacaoconnect.git
cd cacaoconnect/cacaoconnect-dashboard

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Start development server
pnpm dev

# 5. Optional: Start voice agent
pnpm voice:dev
```

**See [Developer Guide](./cacaoconnect-dashboard/README.md) for complete setup instructions.**

### For Business Users

1. **Access the Platform**: Visit `https://cacaoconnect.app` (or your deployment URL)
2. **Choose Your Portal**: Select "Farmer App" or "Processor Dashboard"
3. **Farmer Portal**: Mobile-optimized interface with voice assistant
4. **Processor Portal**: Desktop dashboard with analytics and AI insights

---

## 📈 Business Impact

### Measurable Outcomes

| Metric | Before CacaoConnect | After CacaoConnect |
|--------|---------------------|-------------------|
| **Supply Visibility** | 0% (no system) | 100% real-time |
| **Order Fill Rate** | ~60% (unreliable) | 85%+ (targeted) |
| **Planning Horizon** | 2-3 days (reactive) | 14-30 days (proactive) |
| **Farmer Communication** | Manual calls (hours) | Instant broadcast (seconds) |
| **Supply Gap Warnings** | None (reactive) | 7-14 days advance |

### ROI Drivers

1. **Reduced Production Downtime**: Fewer idle hours waiting for beans
2. **Improved Fill Rates**: Better matching of supply to demand
3. **Lower Communication Costs**: Eliminate manual farmer calls
4. **Enhanced Planning**: Ability to commit to buyers with confidence
5. **Quality Premiums**: Transparent grading encourages better beans

---

## 🤝 Contributing

We welcome contributions from developers, designers, and domain experts!

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration for code style
- Write clear, descriptive commit messages
- Update documentation for new features
- Test voice agent functionality when making audio-related changes
- Ensure responsive design for mobile (Farmer App)

---

## 📞 Support & Community

### Getting Help

- **Technical Issues**: See [Troubleshooting Guide](./cacaoconnect-dashboard/README.md#troubleshooting)
- **Feature Requests**: Open an issue with the `enhancement` label
- **Bug Reports**: Use the bug report template in Issues
- **Questions**: Start a discussion in GitHub Discussions

### Documentation

- **[Developer Setup](./cacaoconnect-dashboard/README.md)** - Complete technical guide
- **[Voice Assistant](./cacaoconnect-dashboard/VOICE_ASSISTANT_README.md)** - Voice AI integration
- **[API Documentation](./cacaoconnect-dashboard/README.md#api-reference)** - DataService methods
- **[Database Schema](#database-schema)** - Tables and relationships

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Cacao de Davao** - Industry partner and problem owner
- **Davao Cacao Farmers Association** - User testing and invaluable feedback
- **OpenAI** - GPT-4o-mini for AI insights and forecasting
- **Groq** - Llama3 70B for voice conversation intelligence
- **Supabase** - Real-time database infrastructure
- **LiveKit** - Low-latency voice communication platform
- **Deepgram** - Speech recognition and synthesis

---

<div align="center">

**🌱 Empowering Davao's Cacao Farmers with AI-Driven Supply Chain Solutions 🌱**

*Built with ❤️ for Cacao de Davao and their farmer partners*

**[View Live Demo](#) • [Read the Docs](./cacaoconnect-dashboard/README.md) • [Report Bug](../../issues) • [Request Feature](../../issues)**

</div>