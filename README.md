# AI-Triaged Support Ticket Dashboard

An enterprise-grade, high-performance Support Ticket Dashboard built with **Next.js 16 (App Router)**, **React 19**, **Redux Toolkit**, **TailwindCSS v4**, and **shadcn/ui**.

This system processes ~5,000 synthetic tickets alongside 12 canonical edge-case test tickets, featuring automated AI triage, real-time SLA deadline tracking, security defenses (XSS/URL sanitization), state machine status transitions, and chaos resilience engineering.

---

## 🚀 Features

- **📊 Comprehensive Ticket Dashboard (`/tickets`)**:
  - Live filtering by status, priority, category, and triage decision with bi-directional URL parameter sync.
  - Full-text instant search across external IDs, subjects, bodies, and summaries.
  - Real-time live update polling with interactive update notification banners.
  - Data quality audit flag indicators on rows with corrupted or auto-fixed data.

- **🔍 Ticket Detail View (`/tickets/[id]`)**:
  - **XSS & URL Security**: Strips malicious HTML tags (`stripHtml()`) and verifies attachment URL safety (`isSafeUrl()`) to block code execution attempts (e.g. `javascript:` URI schemes).
  - **RTL Script Support**: Auto-detects Arabic/Hebrew character sets (`isRtlText()`) to align text direction dynamically (e.g., T-2007).
  - **Interactive Actions**: Ticket claiming with race-condition handling (simulated 409 conflict retries), status state machine transitions (`open` → `in_progress` → `resolved` → `closed`), and server-side AI re-triage.
  - **SLA Countdown Engine**: Real-time per-second timer with visual status indicators (`on_track`, `at_risk`, `late`).
  - **Triage Review & Override**: Manual agent override form with required reason validation (>= 10 chars) and Enterprise P1 floor enforcement.

- **⚠️ Manual Triage Review Queue (`/review`)**:
  - Dedicated view filtering tickets assigned `manual_review` or flagged by AI safety policies (low confidence, prompt injection attempts, empty content, schema violations).

- **🛡️ Enterprise SLA & Business Rules Engine**:
  - **Enterprise Floor Rule**: Enterprise tickets assigned P2 or P3 are automatically elevated to P1, logging `ai_priority` and recording `review_reason: "rule_adjusted"`.
  - **Strict Status Transitions**: Enforces state machine transitions to prevent illegal status jumps.

- **💥 Chaos Resilience Engineering**:
  - API routes wrapped in `withChaos()` middleware simulating latency (300ms–1500ms) and random 10% 500 server errors.
  - Custom client hook (`useFetchWithRetry`) implements exponential backoff retries (3 attempts).

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   cd "d:/support ticket dashboard/frontend"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root of the frontend folder:
   ```env
   TRIAGE_API_KEY=dev-secret-key-123
   # Optional: set CHAOS=off to disable simulated 500 errors during local UI development
   # CHAOS=off
   ```

### Running the Application

- **Development Server**:
  ```bash
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Run Unit Tests (Vitest)**:
  ```bash
  npm test
  ```

- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

---

## 📁 Project Architecture

```
frontend/
├── app/                        # Next.js App Router
│   ├── api/tickets/            # REST API Route Handlers
│   │   ├── route.js            # GET /api/tickets (filtering & pagination)
│   │   ├── updates/route.js    # GET /api/tickets/updates (polling)
│   │   └── [id]/               # Single ticket operations
│   │       ├── route.js        # GET single ticket
│   │       ├── claim/route.js  # POST claim ticket
│   │       ├── status/route.js # PATCH status transition
│   │       ├── triage/route.js # PATCH triage review/override
│   │       └── retriage/route.js # POST server-side AI re-triage
│   ├── review/page.js          # Manual Triage Review Queue page
│   ├── tickets/
│   │   ├── page.js             # Main Tickets Dashboard page
│   │   └── [id]/page.js        # Ticket Detail Orchestrator page
│   ├── layout.js               # Root layout with StoreProvider & Light theme
│   └── page.js                 # Redirects to /tickets
├── components/                 # React UI Components
│   ├── DashboardHeader.js      # Header with Agent Picker & live counters
│   ├── FilterBar.js            # Search input & 4 filter dropdowns
│   ├── TicketTable.js          # Table component with deadline countdowns
│   ├── LiveBanner.js           # Animated notification banner for updates
│   ├── ticket-detail/          # Modular Sub-components for Ticket Detail Page
│   │   ├── TicketBodyCard.js   # Title, RTL script, AI summary & attachment guard
│   │   ├── TicketTriageCard.js # Manual triage review form
│   │   ├── TicketClaimCard.js  # Agent assignment & claim button
│   │   ├── TicketSlaCard.js    # Live SLA countdown timer & progress bar
│   │   ├── TicketStatusCard.js # Status state machine transition buttons
│   │   └── TicketMetaCard.js   # Customer plan, priority & metadata badges
│   └── ui/                     # shadcn/ui components (badge, button, select, table)
├── lib/                        # Domain Core & Utility Functions
│   ├── db.js                   # In-memory store with 5,000 synthetic + 12 test tickets
│   ├── normalize.js            # Data quality pipeline & ticket normalization
│   ├── rules.js                # Priority enums, categories, & transition state machine
│   ├── deadline.js             # Real-time SLA countdown calculation engine
│   ├── sanitize.js             # XSS HTML stripping & safe URL verification
│   ├── chaos.js                # Middleware simulating 10% 500 errors & latency
│   ├── useFetchWithRetry.js    # Exponential backoff retry fetch hook
│   ├── useFilterSync.js        # Bi-directional Redux ↔ URL search param sync
│   └── useLiveUpdates.js       # Background updates polling hook
├── store/                      # Redux Toolkit State Management
│   ├── index.js                # Store configuration
│   ├── StoreProvider.js        # Client store provider (React 19 compliant)
│   ├── agentSlice.js           # Active agent identity & localStorage persistence
│   ├── filterSlice.js          # Active dashboard search & filter state
│   └── counterSlice.js         # Live badge counter tracking
├── tests/                      # Automated Unit Test Suites
│   └── normalize.test.js       # Vitest test cases for normalization & security
└── DECISIONS.md                # Comprehensive architectural design document
```

---

## 🧪 Testing Strategy

Automated unit tests are written with **Vitest**:

```bash
npm test
```

Test cases cover:
- Ticket data normalization (`lib/normalize.js`) for canon test tickets T-2001 through T-2012.
- Enterprise priority floor escalation (`P2`/`P3` → `P1`).
- XSS HTML stripping (`stripHtml`) and malicious attachment URL blocking (`isSafeUrl`).
- Status transition state machine validation (`canMove`).
- Timezone parsing and future creation date clamping.

---

## 📖 Architectural Decisions

For an in-depth breakdown of architectural choices, security defenses, normalization pipelines, and state management strategies, refer to [DECISIONS.md](file:///d:/support%20ticket%20dashboard/DECISIONS.md).
