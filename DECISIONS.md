# Architectural & Design Decisions: AI-Triaged Support Ticket Dashboard

This document details the architectural decisions, design patterns, security defenses, state management strategy, and business rules implemented in the AI-Triaged Support Ticket Dashboard.

---

## 1. Architecture Overview

The system is built using **Next.js 16 (App Router)** with **React 19**, **Redux Toolkit**, **TailwindCSS v4**, and **shadcn/ui** components.

### Key Architectural Layers:
- **Presentation Layer**: Client Components for responsive UI (`DashboardHeader`, `FilterBar`, `TicketTable`, `LiveBanner`, Ticket Detail view).
- **State Management Layer**: Redux Toolkit for active agent identity, live ticket counters, and bi-directional URL query sync for search filters.
- **API Router Layer**: Next.js Route Handlers (`/api/tickets`, `/api/tickets/[id]`, `/api/tickets/[id]/claim`, `/api/tickets/[id]/status`, `/api/tickets/[id]/triage`, `/api/tickets/[id]/retriage`, `/api/tickets/updates`).
- **Domain & Normalization Core**: Pure JavaScript modules (`normalize.js`, `rules.js`, `deadline.js`, `sanitize.js`) isolated from UI dependencies for testability.
- **In-Memory Store**: Singleton database (`db.js`) seeded with the 12 canonical test tickets and ~4,988 synthetic tickets.

```
+-----------------------------------------------------------------------+
|                            Next.js Frontend                           |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | Ticket Dashboard   |  | Ticket Detail View |  | Review Queue    |  |
|  +---------+----------+  +---------+----------+  +--------+--------+  |
|            |                       |                      |           |
|            +-----------------------+----------------------+           |
|                                    |                                  |
|                            Redux & URL Sync                           |
+------------------------------------+----------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------+
|                          Next.js API Routes                           |
|  /api/tickets | /claim | /status | /triage | /retriage | /updates     |
+------------------------------------+----------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------+
|                       Normalization & Rules Engine                    |
|  normalize.js  |  rules.js  |  deadline.js  |  sanitize.js            |
+------------------------------------+----------------------------------+
                                     |
                                     v
+-----------------------------------------------------------------------+
|                      In-Memory DB Store (db.js)                       |
|   12 Test Tickets + 4,988 Synthetic Tickets (Deduplicated & Cleaned)  |
+-----------------------------------------------------------------------+
```

---

## 2. Normalization & Data Quality Pipeline

Raw incoming tickets (from synthetic batch generation or external webhooks) often contain invalid enums, missing fields, missing timezones, future dates, or malicious payloads.

### Normalization Pipeline (`lib/normalize.js`):
1. **Enum Sanitization**: Values for `category`, `customer_plan`, `priority`, `status`, and `triage_decision` are validated against strict allowed lists (`rules.js`). Invalid values are mapped to fallbacks (`other`, `free`, `P3`, `open`, `manual_review`) and appended to `data_flags`.
2. **Date Normalization**:
   - Inputs without timezone info (e.g., `"2026-09-20 11:30:00"`) are parsed as UTC and flagged with `created_at_no_timezone`.
   - Dates set in the future (e.g., T-2008 with `"2027-01-01T00:00:00Z"`) are flagged with `created_at_in_future` and capped to the current system timestamp.
3. **Deduplication**: Duplicate external IDs (e.g., `T-2001` and `T-2001-DUP`) are deduplicated during database initialization in `db.js`.
4. **Data Quality Audit Flags**: Every modification records an explicit flag in `data_flags` (e.g., `unsafe_attachment_removed`, `enterprise_priority_raised`, `invalid_agent`).

---

## 3. Business Rules & SLA Enforcement

### Enterprise Floor Rule
- Customers on the `enterprise` plan have strict SLA commitments.
- Any Enterprise ticket assigned a priority of `P2` or `P3` is automatically raised to `P1`, recording `ai_priority` (the original AI assessment) and flagging `enterprise_priority_raised` (`review_reason: "rule_adjusted"`).
- Agents are blocked from manually downgrading Enterprise tickets below `P1`.

### Status Transition State Machine
Transitions follow a non-bypassable state machine:
- `open` -> `in_progress`
- `in_progress` -> `resolved`
- `resolved` -> `open`
- `closed` -> (Terminal state; no outgoing transitions permitted)

### SLA Countdown Engine (`lib/deadline.js`)
- Priority SLA Hours: `P0: 1h`, `P1: 4h`, `P2: 24h`, `P3: 72h`.
- Countdown calculation evaluates `createdAt + priorityHours - currentTime`.
- Status categorization:
  - `on_track`: > 20% SLA remaining.
  - `at_risk`: < 20% SLA remaining.
  - `late`: SLA elapsed (remaining time <= 0).

---

## 4. Security & Safety Defenses

### XSS Prevention (`lib/sanitize.js`)
- HTML tags embedded in ticket subjects or bodies (e.g., `<img src=x onerror="alert('hacked')">` in T-2002) are stripped via `stripHtml()`.
- Text is rendered securely via standard React node text wrapping rather than dangerous HTML injection.

### Attachment URL Verification (`isSafeUrl`)
- Unsafe URI schemes such as `javascript:alert(document.cookie)` (T-2003) or `data:text/html...` are stripped by `normalize.js` (`unsafe_attachment_removed`).
- Detail view renders an explicit blocked security banner for untrusted attachment schemes.

### Server-Side API Key Protection
- Re-triage operations require an secret API key (`TRIAGE_API_KEY`).
- AI re-triage calls route through Next.js server-side route handler (`/api/tickets/[id]/retriage`), ensuring the key is never exposed to client bundles.

---

## 5. State Management & Real-time Synchronization

### Redux Slices
- `agentSlice`: Manages active agent identity (`agent-1`, `agent-2`, `agent-3`), with post-mount hydration from `localStorage` to avoid SSR hydration mismatches.
- `filterSlice`: Maintains active ticket list filter state (status, priority, category, triage_decision, search).
- `counterSlice`: Tracks live badge counters ("My Tickets", "To Review", "Pending Live Updates").

### Bi-directional URL Parameter Sync (`useFilterSync`)
- Redux filter state automatically mirrors URL search parameters (`?status=open&priority=P0&search=sso`).
- Supports direct link sharing and browser back/forward navigation.

### Live Updates Polling (`useLiveUpdates`)
- Background hook polls `/api/tickets/updates?since=<timestamp>` every 4 seconds.
- Dispatches counter updates and displays an interactive banner notifying agents of new incoming ticket updates.

---

## 6. Chaos Engineering & System Resilience

### Simulated Server Flakiness (`lib/chaos.js`)
- API endpoints are wrapped in `withChaos()` middleware.
- Simulates network latency (300ms–1500ms delay) and a random 10% rate of 500 Internal Server Errors.
- Client custom hook `useFetchWithRetry` handles 500 errors with exponential backoff retries (3 attempts).

### Claim Conflict Simulation
- Ticket claiming (`claimTicket`) includes a 25% simulated race-condition failure rate (HTTP 409 Conflict).
- Detail view presents user-friendly error banners and instant retry actions.

---

## 7. Testing & Verification Strategy

- Automated testing using **Vitest** (`npm test`).
- Test suite (`tests/normalize.test.js`) verifies:
  1. Ticket normalization on standard and malformed inputs.
  2. Enterprise priority floor rules.
  3. XSS HTML stripping and URL scheme validation.
  4. Status transition state machine correctness.
  5. Timezone parsing and future date clamping.