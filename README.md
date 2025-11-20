# 🍫 CacaoConnect

**AI-Driven Cacao Supply Chain Management Platform**

> Bridging the gap between smallholder farmers and cacao processors through intelligent demand-supply matching, real-time tracking, and AI-powered insights.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Status Workflows](#status-workflows)
- [Getting Started](#getting-started)
- [Roadmap](#roadmap)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## 🌟 Overview

CacaoConnect is a dual-portal platform designed to digitize and optimize the cacao supply chain in Davao, Philippines. It connects:

- **Processors (Buyers)**: Cacao de Davao HQ - Creates demand, tracks fulfillment, manages supply chain
- **Farmers (Suppliers)**: Smallholder farmers - Receives orders, commits supply, tracks payments

### The Problem

1. **Information Asymmetry**: Farmers don't know market prices or demand
2. **Supply Uncertainty**: Processors can't predict incoming volume
3. **No Traceability**: No visibility once beans leave the farm
4. **Weather Risks**: No early warning system for harvest decisions

### Our Solution

A mobile-first platform that provides:
- Real-time demand broadcasting
- AI-powered harvest recommendations
- End-to-end supply chain tracking
- Transparent pricing and payments

---

## ✨ Key Features

### For Processors (HQ Dashboard)

| Feature | Description |
|---------|-------------|
| **Order Broadcasting** | Create and publish demand orders to all registered farmers |
| **Commitment Management** | Review, approve/reject farmer offers with quality grading |
| **Live Fill Tracking** | Real-time progress bars showing order fulfillment % |
| **Supply Movement Tracker** | Visual timeline of beans from farm → transit → warehouse |
| **Regional Supply View** | Aggregated inventory available across farmer network |
| **KPI Dashboard** | Active orders, pending reviews, in-transit shipments |

### For Farmers (Mobile App)

| Feature | Description |
|---------|-------------|
| **Order Feed** | Browse open orders with price, volume, and deadlines |
| **AI Harvest Advisor** | Weather-adjusted recommendations for optimal commitment |
| **Quality Grading** | Self-assess beans (Grade A/B/C) affecting price multiplier |
| **Commitment Tracking** | Monitor status: Pending → Approved → Ready → Collected → Paid |
| **Inventory Management** | Log available stock by bean type |
| **Text-to-Speech** | Audio playback of AI advice for hands-free operation |

---

## 🏗️ Architecture

### High-Level Flow

```
┌─────────────────┐         ┌─────────────────┐
│   Processor     │         │     Farmer      │
│   Dashboard     │         │   Mobile App    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌───────────────┐      │
         └────►   Supabase    ◄──────┘
              │   (PostgreSQL) │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │  Gemini AI    │
              │  (Analysis)   │
              └───────────────┘
```

### Component Architecture

```
CacaoConnectMVP/
├── Portal Selector (Entry Point)
│   └── Role-based routing
├── ProcessorApp
│   ├── KPI Dashboard
│   ├── Order Management
│   │   ├── Create Order Modal
│   │   ├── Order Table with Filters
│   │   └── Order Detail Modal
│   │       └── Commitment Actions
│   └── Supply Tracking View
│       └── Progress Timeline
└── FarmerApp
    ├── Home (Order Feed)
    │   └── Weather Widget
    ├── Order Detail
    │   ├── AI Analysis
    │   └── Commitment Form
    ├── Inventory View
    └── Commitments History
        └── Status Actions
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 (App Router) | React framework with server components |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Database** | Supabase (PostgreSQL) | Real-time database with RLS |
| **AI/ML** | Google Gemini 2.5 Flash | Harvest analysis & recommendations |
| **TTS** | Gemini TTS | Voice output for accessibility |
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
| `bean_type` | TEXT | Wet Beans, Dried, Fermented |
| `deadline` | DATE | Fulfillment deadline |
| `status` | ENUM | Order lifecycle status |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modification |

#### `commitments`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | FK to orders |
| `farmer_id` | UUID | FK to farmers |
| `committed_volume_kg` | INTEGER | Offered volume |
| `bean_type` | TEXT | Type of beans offered |
| `quality_grade` | CHAR(1) | A, B, or C grade |
| `status` | ENUM | Commitment lifecycle |
| `location` | TEXT | Pickup location |
| `created_at` | TIMESTAMP | Submission time |
| `updated_at` | TIMESTAMP | Last status change |

#### `inventory`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_type` | ENUM | 'farmer' or 'processor' |
| `owner_id` | UUID | FK to user |
| `bean_type` | TEXT | Bean classification |
| `quantity_kg` | INTEGER | Available stock |
| `quality_notes` | TEXT | Condition notes |

---

## 🔄 Status Workflows

### Order Lifecycle

```
DRAFT → OPEN → FILLED → IN_TRANSIT → DELIVERED → COMPLETED
                 ↓
            CANCELLED
```

| Status | Description | Trigger |
|--------|-------------|---------|
| `draft` | Created but not published | Manual |
| `open` | Accepting farmer commitments | Publish action |
| `filled` | Target volume reached (approved commits) | Auto-calculated |
| `in_transit` | Beans being collected/transported | Any commitment collected |
| `delivered` | Arrived at processor warehouse | All commitments delivered |
| `completed` | Payment processed | All commitments paid |
| `cancelled` | Order cancelled | Manual action |

### Commitment Lifecycle

```
PENDING → APPROVED → READY → COLLECTED → DELIVERED → PAID
    ↓
REJECTED
```

| Status | Actor | Description |
|--------|-------|-------------|
| `pending` | Farmer | Offer submitted, awaiting review |
| `approved` | Processor | Commitment accepted |
| `rejected` | Processor | Commitment declined |
| `ready` | Farmer | Beans harvested, ready for pickup |
| `collected` | Processor/Logistics | Picked up from farm |
| `delivered` | Processor | Arrived at warehouse |
| `paid` | Processor | Payment released |

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

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/cacaoconnect.git
cd cacaoconnect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Gemini API keys

# Run development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
```

### Database Setup

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_commitments_order_id ON commitments(order_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_inventory_owner ON inventory(owner_type, owner_id);
```

---

## 🗺️ Roadmap

### Phase 1: MVP Complete ✅
**Status: Current**

- [x] Dual-portal architecture (Farmer/Processor)
- [x] Real-time data polling (3-5s intervals)
- [x] Order creation and broadcasting
- [x] Basic commitment workflow
- [x] AI harvest analysis with Gemini
- [x] Text-to-Speech accessibility
- [x] Inventory tracking by owner type

### Phase 2: Enhanced Workflows ✅
**Status: Just Completed**

- [x] Complete order lifecycle (Draft → Completed)
- [x] Full commitment status workflow
- [x] Processor commitment review (Approve/Reject)
- [x] Farmer "Mark as Ready" action
- [x] Supply movement tracking view
- [x] Progress timeline visualization
- [x] Quality grading system (A/B/C)
- [x] Order detail modal with commitment management
- [x] My Commitments history view for farmers
- [x] Status filtering on orders table

### Phase 3: Authentication & Security 🔄
**Target: Q1 2025**

- [ ] Supabase Auth integration
  - [ ] Phone number OTP for farmers
  - [ ] Email/password for processors
- [ ] Role-based access control (RBAC)
- [ ] Row Level Security policies
  - [ ] Farmers see only their commitments
  - [ ] Processors see only their orders
- [ ] Session management
- [ ] Secure API key handling

### Phase 4: Offline & Performance 📱
**Target: Q1 2025**

- [ ] Progressive Web App (PWA) configuration
- [ ] Service worker for offline caching
- [ ] TanStack Query for data management
  - [ ] Background refetching
  - [ ] Optimistic updates
  - [ ] Offline persistence
- [ ] Local storage fallback
- [ ] Sync queue for offline actions
- [ ] Image optimization and lazy loading

### Phase 5: Payments & Finance 💰
**Target: Q2 2025**

- [ ] Payment gateway integration
  - [ ] GCash API
  - [ ] Maya/PayMaya API
- [ ] Automated payment calculation
  - [ ] Volume × Price × Grade Multiplier
- [ ] Payment status tracking
- [ ] Transaction history
- [ ] Digital receipts
- [ ] Payout scheduling

### Phase 6: Logistics & Tracking 🚚
**Target: Q2 2025**

- [ ] GPS tracking integration
- [ ] Route optimization
- [ ] ETA calculations
- [ ] Driver assignment
- [ ] Delivery confirmation with photo
- [ ] SMS notifications
- [ ] QR code scanning for verification

### Phase 7: Advanced AI Features 🤖
**Target: Q3 2025**

- [ ] Weather API integration (PAGASA/OpenWeather)
- [ ] Soil data correlation
- [ ] Historical yield analysis
- [ ] Price forecasting
- [ ] Demand prediction
- [ ] Multi-language support (Bisaya, Tagalog)
- [ ] Voice input for farmers

### Phase 8: Analytics & Reporting 📊
**Target: Q3 2025**

- [ ] Processor dashboard analytics
  - [ ] Volume trends
  - [ ] Supplier performance
  - [ ] Cost analysis
- [ ] Farmer earnings dashboard
- [ ] Export to CSV/PDF
- [ ] Scheduled reports
- [ ] Regional aggregation maps

### Phase 9: Marketplace Expansion 🌐
**Target: Q4 2025**

- [ ] Multi-processor support
- [ ] Competitive bidding
- [ ] Farmer ratings
- [ ] Quality certification badges
- [ ] Contract farming agreements
- [ ] Cooperative management

### Phase 10: Sustainability & Compliance 🌱
**Target: Q4 2025**

- [ ] Carbon footprint tracking
- [ ] Fair trade certification
- [ ] Organic verification
- [ ] Export documentation
- [ ] Government compliance reporting
- [ ] Traceability certificates

---

## 📚 API Reference

### DataService Methods

```javascript
// Orders
DataService.getOrdersWithProgress()     // Get enriched orders
DataService.createOrder(orderData)       // Create new order
DataService.updateOrderStatus(id, status) // Update status

// Commitments
DataService.commitToOrder(orderId, volume, farmerId, beanType, grade)
DataService.getFarmerCommitments(farmerId)
DataService.updateCommitmentStatus(id, status)
DataService.markAsReady(commitmentId)

// Inventory
DataService.getInventory(ownerType)      // 'farmer' | 'processor'
DataService.getAggregatedSupply()        // Regional farmer totals

// Stats
DataService.getStats()                   // Dashboard KPIs
```

### AI Integration

```javascript
// Harvest Analysis
callGeminiJSON(prompt) // Returns structured recommendation

// Text-to-Speech
callGeminiTTS(text)    // Plays audio output
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint configuration provided
- Follow React best practices
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Cacao de Davao** - Industry partner and domain expertise
- **Davao Cacao Farmers Association** - User testing and feedback
- **Google AI** - Gemini API access
- **Supabase** - Database infrastructure

---

<div align="center">

**Built with ❤️ for Davao's Cacao Farmers**

[Report Bug](https://github.com/your-org/cacaoconnect/issues) · [Request Feature](https://github.com/your-org/cacaoconnect/issues)

</div>