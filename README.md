# 🍫 CacaoConnect

**AI-Driven Supply Chain Visibility Platform for Cacao de Davao**

> Solving material reliability challenges by connecting processors with farmers through real-time supply tracking, AI-powered forecasting, and early-warning systems.

---

## 📋 Table of Contents

- [The Challenge](#the-challenge)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Status Workflows](#status-workflows)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## 🎯 The Challenge

**Cacao de Davao** is a family-rooted chocolate company dedicated to supporting local farmers and strengthening Davao's reputation as the "cacao capital of the Philippines." Despite strong branding and market presence, the company faces a critical operational challenge:

### Material Reliability Crisis

**Unpredictable harvests lead to an unstable supply of cacao beans**, which cascades into:

| Impact Area | Problem |
|-------------|---------|
| **Production** | Slowdowns and idle time when beans aren't available |
| **Inventory** | Inconsistent product availability for customers |
| **Financial** | Significant losses from delayed orders and wasted capacity |
| **Planning** | Unable to forecast production or make commitments to buyers |

### Root Causes

1. **Zero Visibility** - No real-time view into what farmers have available
2. **No Early Warnings** - Supply gaps discovered only when it's too late
3. **Communication Gap** - Farmers don't know what the processor needs or when
4. **No Forecasting** - Cannot predict supply based on weather, season, or trends

---

## 💡 Our Solution

**CacaoConnect** is a dual-portal platform that creates **end-to-end visibility** between Cacao de Davao and their farmer network, enabling:

### For the Processor (Cacao de Davao HQ)

✅ **Real-time supply visibility** - See exactly what beans are available across all farmers  
✅ **Demand broadcasting** - Publish orders that reach all farmers instantly  
✅ **AI-powered forecasting** - Predict supply gaps before they happen  
✅ **Early warning alerts** - Get notified of weather risks, low commitments, or supply shortfalls  
✅ **Partner performance tracking** - Know which farmers are reliable and have stock  

### For Farmers

✅ **Market access** - See exactly what the processor needs and at what price  
✅ **AI harvest advisor** - Get recommendations on when to commit based on weather  
✅ **Fair pricing** - Transparent quality grading (A/B/C) with clear price multipliers  
✅ **Status tracking** - Know exactly where their beans are in the supply chain  

### The Result

📊 **Predictable supply flow** → Consistent production → Reliable product availability → Financial stability

---

## ✨ Key Features

### Supply Visibility & Forecasting

| Feature | How It Solves the Problem |
|---------|---------------------------|
| **Partner Network Dashboard** | Real-time view of all farmer inventory, stock levels, and locations |
| **Regional Supply Aggregation** | See total available beans by type across the entire farmer network |
| **AI Supply Forecasts** | Predict next week/month supply with confidence levels |
| **Ready-for-Pickup Alerts** | Instant notification when farmers have beans ready to collect |

### Early Warning System

| Feature | How It Solves the Problem |
|---------|---------------------------|
| **Order Fill Tracking** | Live progress bars show if orders are on track to be filled |
| **Risk Alerts** | AI identifies weather risks, supply shortfalls, and logistics delays |
| **Pending Review Counter** | See how many farmer offers need processor attention |
| **Reliability Scores** | Track which farmers consistently deliver on commitments |

### Demand-Supply Matching

| Feature | How It Solves the Problem |
|---------|---------------------------|
| **Order Broadcasting** | Publish demand to all farmers instantly - no more phone calls |
| **Commitment Management** | Farmers commit specific volumes; processor approves/rejects |
| **Quality Grading** | A/B/C grades with automatic price adjustment |
| **Volume Tracking** | Know exactly how much is committed vs. target |

### AI-Powered Insights (OpenAI GPT-4o-mini)

| Feature | How It Solves the Problem |
|---------|---------------------------|
| **Order Recommendations** | AI suggests when to order, how much, and at what price |
| **Demand Forecasting** | Predict next week/month demand based on patterns |
| **Supply Forecasting** | Estimate incoming supply from farmer network |
| **Opportunity Detection** | Identify bulk purchase opportunities or price advantages |

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
   └─→ Live fill % updates as commitments are approved

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

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Processor     │         │     Farmer      │
│   Dashboard     │         │   Mobile App    │
│   (Desktop)     │         │   (Mobile-first)│
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌───────────────┐      │
         └────►   Supabase    ◄──────┘
              │   (PostgreSQL) │
              │   Real-time DB │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │   OpenAI      │
              │  GPT-4o-mini  │
              │  (Forecasts)  │
              └───────────────┘
```

### Component Architecture

```
CacaoConnectMVP/
├── Portal Selector (Entry Point)
│   └── Role-based routing
│
├── ProcessorApp (Desktop Dashboard)
│   ├── KPI Dashboard
│   │   ├── Committed Volume
│   │   ├── Active Orders
│   │   ├── Pending Review (early warning)
│   │   └── In Transit
│   ├── Regional Supply View
│   │   └── Aggregated farmer inventory
│   ├── Order Management
│   │   ├── Create Order (broadcast demand)
│   │   ├── Order Table with Status Filters
│   │   └── Order Detail Modal
│   │       ├── Fill Progress
│   │       ├── Commitment List
│   │       └── Actions (Approve/Reject/Collect)
│   ├── Partner Network View
│   │   ├── Farmer list with stock
│   │   ├── Reliability scores
│   │   └── Ready-for-pickup alerts
│   ├── Supply Tracking View
│   │   └── Progress timelines
│   └── AI Insights View
│       ├── Order Recommendations
│       ├── Supply Forecasts
│       ├── Risk Alerts
│       └── Opportunities
│
└── FarmerApp (Mobile-First)
    ├── Home (Order Feed)
    │   ├── Weather Widget
    │   └── Quick Stats
    ├── Order Detail
    │   ├── AI Harvest Advisor
    │   ├── Quality Grade Selection
    │   └── Commitment Form
    ├── Inventory View
    │   └── Stock by bean type
    └── My Commitments
        ├── Status Timeline
        └── Mark Ready action
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | React framework with SSR |
| **Styling** | Tailwind CSS 4 | Utility-first responsive design |
| **Database** | Supabase (PostgreSQL) | Real-time database with REST API |
| **AI/ML** | OpenAI GPT-4o-mini | Forecasting, recommendations, risk analysis |
| **TTS** | Web Speech API | Accessibility for farmers |
| **Icons** | Lucide React | Consistent icon system |

---

## 📊 Database Schema

### Core Tables

#### `orders`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Order description |
| `volume_kg` | INTEGER | Target volume required |
| `price_per_kg` | DECIMAL | Buying price offer |
| `bean_type` | TEXT | Wet Beans, Dried Beans, Fermented |
| `deadline` | DATE | Fulfillment deadline |
| `status` | TEXT | Order status (default: 'open') |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modification |

#### `commitments`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | FK to orders |
| `farmer_id` | UUID | FK to farmers (optional for demo) |
| `committed_volume_kg` | INTEGER | Offered volume |
| `bean_type` | TEXT | Type of beans offered |
| `quality_grade` | CHAR(1) | A, B, or C grade |
| `status` | TEXT | Commitment lifecycle status |
| `location` | TEXT | Pickup location |
| `created_at` | TIMESTAMP | Submission time |
| `updated_at` | TIMESTAMP | Last status change |

#### `inventory`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_type` | TEXT | 'farmer' or 'processor' |
| `owner_id` | UUID | FK to user (optional) |
| `bean_type` | TEXT | Bean classification |
| `quantity_kg` | INTEGER | Available stock |
| `quality_notes` | TEXT | Condition notes |
| `created_at` | TIMESTAMP | Creation time |

---

## 🔄 Status Workflows

### Order Status (Auto-Derived)

Order status is automatically calculated based on commitment states:

```
OPEN → FILLED → IN_TRANSIT → DELIVERED → COMPLETED
```

| Status | Condition | What It Means |
|--------|-----------|---------------|
| `open` | fillPercentage < 100% | Still accepting farmer commitments |
| `filled` | fillPercentage >= 100% | Target volume reached, ready for collection |
| `in_transit` | Any commitment collected | Beans being transported |
| `delivered` | deliveredVolume > 0 | Some beans arrived at warehouse |
| `completed` | deliveryPercentage >= 100% | All beans delivered |

### Commitment Status Workflow

```
PENDING → APPROVED → READY → COLLECTED → DELIVERED → PAID
    ↓
REJECTED
```

| Status | Actor | Description |
|--------|-------|-------------|
| `pending` | Farmer | Offer submitted, awaiting processor review |
| `approved` | Processor | Commitment accepted, waiting for harvest |
| `rejected` | Processor | Commitment declined (quality/volume/timing) |
| `ready` | Farmer | Beans harvested and ready for pickup |
| `collected` | Processor | Picked up from farm by logistics |
| `delivered` | Processor | Arrived at processor warehouse |
| `paid` | Processor | Payment released to farmer |

**Database Constraint Required:**

```sql
ALTER TABLE commitments DROP CONSTRAINT IF EXISTS commitments_status_check;
ALTER TABLE commitments ADD CONSTRAINT commitments_status_check 
CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'ready', 'collected', 'delivered', 'paid']));
```

### Quality Grade Pricing

| Grade | Multiplier | Criteria |
|-------|------------|----------|
| A | 100% | Premium, fully fermented, no defects |
| B | 85% | Good quality, minor defects |
| C | 70% | Acceptable, requires sorting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/cacaoconnect.git
cd cacaoconnect/cacaoconnect-dashboard

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## ⚙️ Environment Setup

### API Keys

Currently configured in `app/components/CacaoConnectMVP.jsx`:

```javascript
const SUPABASE_URL = "https://faupcdnglrfilagceykz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGci...";
const OPENAI_API_KEY = "sk-proj-...";
```

For production, migrate to environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-key
```

---

## 🗄️ Database Setup

### 1. Create Tables

```sql
-- Orders table
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

-- Commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_id UUID REFERENCES orders(id),
  farmer_id UUID,
  committed_volume_kg INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  bean_type TEXT,
  quality_grade CHAR(1) DEFAULT 'A',
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT commitments_status_check CHECK (
    status = ANY (ARRAY['pending', 'approved', 'rejected', 'ready', 'collected', 'delivered', 'paid'])
  )
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL,
  owner_id UUID,
  bean_type TEXT NOT NULL,
  quantity_kg INTEGER NOT NULL,
  quality_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commitments_order_id ON commitments(order_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_owner ON inventory(owner_type, owner_id);
```

### 2. Update Existing Constraint

If your database has a limited status constraint:

```sql
ALTER TABLE commitments DROP CONSTRAINT IF EXISTS commitments_status_check;
ALTER TABLE commitments ADD CONSTRAINT commitments_status_check 
CHECK (status = ANY (ARRAY['pending', 'approved', 'rejected', 'ready', 'collected', 'delivered', 'paid']));
```

---

## 📚 API Reference

### DataService Methods

```javascript
// Orders
DataService.getOrdersWithProgress()      // Orders with fill %, delivery %, commitments
DataService.createOrder(orderData)       // Broadcast new demand
DataService.updateOrderStatus(id, status)

// Commitments
DataService.commitToOrder(orderId, volume, farmerId, beanType, grade)
DataService.getFarmerCommitments(farmerId)
DataService.updateCommitmentStatus(id, status)
DataService.markAsReady(commitmentId)

// Supply Visibility
DataService.getInventory(ownerType)      // 'farmer' | 'processor'
DataService.getAggregatedSupply()        // Total farmer stock by bean type
DataService.getPartnerNetwork()          // Farmers with inventory & reliability
DataService.getFarmersReadyForPickup()   // Ready commitments

// Dashboard Stats
DataService.getStats()                   // KPIs for dashboard
```

### AI Functions

```javascript
// Supply chain analysis
callOpenAIJSON(prompt)  // Returns: forecasts, recommendations, alerts

// Accessibility
callTTS(text)           // Browser native text-to-speech
```

---

## 🗺️ Roadmap

### ✅ Phase 1: Core Platform (Complete)
- [x] Dual-portal architecture
- [x] Real-time data polling
- [x] Order broadcasting
- [x] Commitment workflow
- [x] Inventory tracking

### ✅ Phase 2: Supply Visibility (Complete)
- [x] Partner Network dashboard
- [x] Regional supply aggregation
- [x] AI forecasting & recommendations
- [x] Risk alerts
- [x] Quality grading system
- [x] Fill progress tracking

### 🔄 Phase 3: Authentication & Security
- [ ] Supabase Auth (OTP for farmers, email for processors)
- [ ] Row Level Security
- [ ] Environment variable migration

### 📱 Phase 4: Mobile & Offline
- [ ] PWA support
- [ ] Offline sync
- [ ] Push notifications

### 💰 Phase 5: Payments & Logistics
- [ ] GCash/Maya integration
- [ ] GPS tracking
- [ ] SMS alerts

### 🤖 Phase 6: Advanced AI
- [ ] Weather API integration (PAGASA)
- [ ] Price forecasting
- [ ] Multi-language (Bisaya/Tagalog)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Cacao de Davao** - Industry partner and problem owner
- **Davao Cacao Farmers Association** - User testing and feedback
- **OpenAI** - GPT-4o-mini for AI insights
- **Supabase** - Database infrastructure

---

<div align="center">

**Solving Material Reliability for Davao's Cacao Industry**

*Built with ❤️ for Cacao de Davao and their farmer partners*

</div>