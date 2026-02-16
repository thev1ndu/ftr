<![CDATA[<div align="center">

# 🛡️ FTR — Fraud Transaction Router

**AI-Powered Fraud Detection Middleware for Financial Transaction Pipelines**

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![LangChain](https://img.shields.io/badge/LangChain-🦜-green)](https://langchain.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-HITL-blue)](https://langchain-ai.github.io/langgraph/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)](https://openai.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade fraud detection middleware that combines **static rule engines**, **behavioral pattern analysis**, **anomaly detection**, and **LLM-powered AI agents** with a **Human-in-the-Loop (HITL)** review workflow — designed to plug into any existing payment or transfer pipeline.

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
  - [High-Level Architecture](#high-level-architecture)
  - [Transaction Processing Pipeline](#transaction-processing-pipeline)
  - [Fraud Engine Layers](#fraud-engine-layers)
  - [AI Agent Workflow (LangGraph)](#ai-agent-workflow-langgraph)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (fraud-service)](#1-backend-setup-fraud-service)
  - [Frontend Setup (frontend-service)](#2-frontend-setup-frontend-service)
  - [Docker Deployment](#3-docker-deployment)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
  - [Middleware Endpoints](#middleware-endpoints)
  - [Scan Endpoint](#scan-endpoint)
  - [Review Endpoint (HITL)](#review-endpoint-hitl)
  - [Lookup & History](#lookup--history)
  - [OTP Endpoints](#otp-endpoints)
  - [Account Limits](#account-limits)
  - [Configuration](#configuration-endpoints)
  - [Health Check](#health-check)
- [Fraud Engine Deep Dive](#-fraud-engine-deep-dive)
  - [Layer 1 — Static Rules](#layer-1--static-rules-zero-cost)
  - [Layer 2 — Pattern Analysis](#layer-2--pattern-analysis-low-cost)
  - [Layer 3 — Anomaly Detection](#layer-3--anomaly-detection-low-cost)
  - [Layer 4 — AI Agent (LLM)](#layer-4--ai-agent-high-cost)
  - [Decision Matrix](#decision-matrix)
- [Transaction Middleware](#-transaction-middleware)
  - [Account Types & Limits](#account-types--limits)
  - [OTP Verification](#otp-verification)
- [Configuration Reference](#-configuration-reference)
  - [Engine Thresholds](#engine-thresholds)
- [AI Agent Tools](#-ai-agent-tools)
- [Frontend Application](#-frontend-application)
- [Data Persistence](#-data-persistence)
- [Integration Guide](#-integration-guide)
  - [Option A — Full Pipeline](#option-a--full-pipeline-limits--otp--fraud)
  - [Option B — Fraud Only](#option-b--fraud-evaluation-only)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌐 Overview

**FTR** (Fraud Transaction Router) is a middleware service that sits between your payment initiation layer and your core banking/ledger system. Every outbound transaction is routed through FTR for real-time risk scoring before settlement.

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Your App /  │────▶│   FTR Middleware  │────▶│  Core Banking  │
│  Payment UI  │     │  (this project)  │     │  / Settlement  │
└──────────────┘     └──────────────────┘     └────────────────┘
                          │
                          ├─ Static Rules
                          ├─ Pattern Analysis
                          ├─ Anomaly Detection
                          ├─ AI Agent (GPT-4o-mini)
                          └─ Human Review (HITL)
```

**Key design principles:**

| Principle | Implementation |
|---|---|
| **Cost Efficiency** | 4-layer cascade — cheap checks first, expensive AI only when needed |
| **Zero Bypass** | Middleware enforces limits _before_ fraud engine — amount manipulation cannot skip checks |
| **Explainability** | Every decision includes score breakdown, reasons, anomalies, patterns & anti-patterns |
| **Human Oversight** | High-risk transactions pause for human review via LangGraph interrupt |
| **Plug & Play** | Two middleware endpoints let you integrate with zero code changes to your existing system |

---

## ✨ Key Features

### Fraud Detection Engine
- **4-Layer Hybrid Analysis** — Static rules → Pattern analysis → Anomaly detection → AI Agent
- **Configurable Thresholds** — All detection parameters tunable via `cfg.py`
- **Fast-Track Decisions** — Trusted beneficiaries and micro-transactions skip AI (cost = $0)
- **Behavioral Profiling** — Velocity monitoring, beneficiary trust scoring, amount spike detection
- **Anti-Pattern Detection** — Smurfing / structuring, round-amount fraud, off-hours activity

### Transaction Middleware
- **Account-Type Limits** — Savings / Checking / Premium with per-transaction and daily caps
- **OTP Verification** — Required for transactions above configurable threshold ($100 default)
- **Bypass-Proof** — Limits enforced from actual transaction history, not client-reported totals

### AI Agent (LangGraph + OpenAI)
- **Tool-Calling Agent** — GPT-4o-mini with 4 bound tools for real-time data retrieval
- **Human-in-the-Loop** — LangGraph `interrupt_before` pauses execution for manual review
- **Persistent Memory** — SQLite-backed conversation memory + LangGraph checkpoint state
- **Structured JSON Output** — Enforced `{ decision, score, reason }` response schema

### Frontend Demo UI
- **Premium UI** — Next.js 16 + React 19 + Tailwind CSS 4
- **Full Transaction Flow** — Transfer form → OTP → Processing → AI Result → History
- **Account History** — Lookup transactions by account ID with summary statistics

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    frontend-service                     │
│              Next.js 16 / React 19 / TailwindCSS 4     │
│  ┌───────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │TransferForm│  │FraudProcess│  │TransactionResult  │  │
│  │  + OTP     │  │   or       │  │  + Review Actions │  │
│  └─────┬─────┘  └─────┬──────┘  └────────┬──────────┘  │
│        └───────────────┴─────────────────┘              │
│                        │ HTTP                           │
└────────────────────────┼────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     fraud-service                       │
│               FastAPI / Python 3.9+                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │                 API Layer (v1)                    │   │
│  │  /scan  /review  /lookup  /middleware  /otp ...   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │            Transaction Middleware                 │   │
│  │  Account Limits → OTP Verification → Pass/Fail   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │ (only if passed)               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              Fraud Evaluation Engine              │   │
│  │  Static Rules → Patterns → Anomalies → AI Agent  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │        Persistence (SQLite)                      │   │
│  │  transactions.db  │  checkpoints.db              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Transaction Processing Pipeline

```
Transaction Input
       │
       ▼
┌──────────────────┐
│ 1. LIMITS CHECK  │──── Exceeds single-tx or daily limit? ──▶ 400 LIMIT_EXCEEDED
│    (Middleware)   │
└──────┬───────────┘
       │ ✓ Within limits
       ▼
┌──────────────────┐
│ 2. OTP CHECK     │──── Amount ≥ $100 and no/invalid OTP? ──▶ 400 OTP_REQUIRED
│    (Middleware)   │
└──────┬───────────┘
       │ ✓ OTP valid or not required
       ▼
┌──────────────────┐
│ 3. STATIC RULES  │──── Suspicious device / self-transfer / ──▶ High score?
│    (Zero Cost)   │     extreme amount                          │
└──────┬───────────┘                                             │
       │                                                         │
       ▼                                                         │
┌──────────────────┐                                             │
│ 4. PATTERN CHECK │──── Velocity / new beneficiary /        ────┤
│    (Low Cost)    │     amount spike                            │
└──────┬───────────┘                                             │
       │                                                         │
       ▼                                                         │
┌──────────────────┐                                             │
│ 5. ANOMALY CHECK │──── Time anomaly / round amount /       ────┤
│    (Low Cost)    │     structuring / smurfing                  │
└──────┬───────────┘                                             │
       │                                                         │
       ▼                                                         ▼
┌──────────────────┐                               ┌──────────────────┐
│ FAST TRACK?      │──── Trusted + low amount?     │ BLOCK?           │
│ (Skip AI)        │     Micro transaction?   ──▶  │ (Score > 75)     │──▶ Return BLOCK
└──────┬───────────┘     Return ALLOW immediately  └──────────────────┘
       │
       │ ✗  Not fast-trackable and not auto-blocked
       ▼
┌──────────────────┐
│ 6. AI AGENT      │──── GPT-4o-mini with tools ──▶ { decision, score, reason }
│    (High Cost)   │     LangGraph workflow
└──────┬───────────┘
       │
       ├── decision = ALLOW ──────────────────────▶ Transaction Approved
       ├── decision = REVIEW / BLOCK / score > 75 ▶ HITL Interrupt
       │                                             │
       │                                             ▼
       │                                    ┌──────────────────┐
       │                                    │ 7. HUMAN REVIEW  │
       │                                    │    (HITL)        │
       │                                    └──────┬───────────┘
       │                                           │
       │                                ┌──────────┴──────────┐
       │                                │                     │
       │                             APPROVE              DECLINE
       │                                │                     │
       │                           Return ALLOW          Return BLOCK
       │
       └──────────────────────────────▶ Log to SQLite
```

### Fraud Engine Layers

| Layer | Cost | What It Does | Example Triggers |
|---|---|---|---|
| **Static Rules** | Zero | Device fingerprinting, amount validation, self-transfer check | Kali Linux, Metasploit, >$200k transfer |
| **Pattern Analysis** | Low | Velocity check, new beneficiary scoring, amount spike detection | 10+ tx in 10min, first transfer >$10k |
| **Anomaly Detection** | Low | Time-of-day analysis, round-amount detection, structuring/smurfing | Transfer at 3 AM, multiple $5k round amounts |
| **AI Agent** | High | LLM with tools for deep behavioral analysis | Complex scenarios needing judgment |

### AI Agent Workflow (LangGraph)

```
                ┌─────────┐
                │  START  │
                └────┬────┘
                     ▼
              ┌──────────────┐
         ┌───▶│    Agent     │◀──┐
         │    │  (GPT-4o)    │   │
         │    └──────┬───────┘   │
         │           │           │
         │    ┌──────▼───────┐   │
         │    │ should_cont? │   │
         │    └──┬───┬───┬───┘   │
         │       │   │   │       │
         │  tools│   │   │human  │
         │       │   │   │review │
         │       ▼   │   ▼       │
         │  ┌────────┐│┌────────────┐
         └──│ Tool   │││  Human    ├──┘
            │ Node   │││  Review   │
            └────────┘│└────────────┘
                      │ END
                      ▼
               ┌──────────┐
               │   END    │
               └──────────┘
```

**Nodes:**
- `agent` — Invokes GPT-4o-mini with bound tools and system prompt
- `tools` — Executes tool calls (velocity check, beneficiary history, pattern summary, deep fraud analysis)
- `human_review` — Interrupt point where execution pauses for manual approval/decline

---

## 📂 Project Structure

```
ftr/
├── README.md                          # ← You are here
├── fraud-service/                     # Python FastAPI backend
│   ├── app/
│   │   ├── main.py                    # FastAPI app, CORS, startup
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py        # Router aggregation
│   │   │       └── endpoints/
│   │   │           ├── scan.py        # POST /scan — main transaction scan
│   │   │           ├── review.py      # POST /review/{id} — HITL review
│   │   │           ├── lookup.py      # GET /lookup/{id} — history & indicators
│   │   │           ├── middleware.py  # POST /middleware/check & /evaluate
│   │   │           ├── otp.py         # POST /otp/request
│   │   │           ├── limits.py      # GET/PUT /limits/{id}
│   │   │           ├── config.py      # GET /config
│   │   │           └── health.py      # GET /health
│   │   ├── models/
│   │   │   ├── transaction.py         # Transaction & TransactionScanRequest
│   │   │   └── review.py             # ReviewRequest
│   │   ├── services/
│   │   │   ├── fraud/
│   │   │   │   ├── service.py         # Hybrid evaluation orchestrator
│   │   │   │   ├── engine.py          # Static rules, patterns, anomalies
│   │   │   │   ├── history.py         # Transaction history service (SQLite)
│   │   │   │   ├── indicators_agent.py # LangChain indicators agent
│   │   │   │   ├── cfg.py            # Tunable thresholds (single source of truth)
│   │   │   │   ├── store.py          # Config store accessor
│   │   │   │   └── ai/
│   │   │   │       ├── agent.py       # LangGraph workflow (StateGraph + HITL)
│   │   │   │       ├── tools.py       # 4 LangChain tools for the agent
│   │   │   │       ├── prompts.py     # System prompt for GPT-4o-mini
│   │   │   │       └── memory.py      # SQLite conversation memory
│   │   │   └── transaction_middleware/
│   │   │       ├── middleware.py       # Limits + OTP enforcement
│   │   │       ├── account_limits.py  # Account type definitions & limits
│   │   │       └── otp_store.py       # In-memory OTP store with TTL
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic Settings (env vars)
│   │   │   └── logging.py            # Logging setup
│   │   └── utils/
│   │       └── helpers.py            # Transaction formatting helpers
│   ├── Dockerfile                     # Python 3.11-slim container
│   ├── docker-compose.yml            # Single-service compose
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Environment variables
│   ├── transactions.db               # SQLite — transaction history
│   └── checkpoints.db                # SQLite — LangGraph HITL state
│
└── frontend-service/                  # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx               # Home / transfer page
    │   │   ├── layout.tsx             # Root layout
    │   │   ├── globals.css            # Global styles
    │   │   ├── history/
    │   │   │   └── page.tsx           # Transaction history page
    │   │   └── lookup/
    │   │       └── page.tsx           # Account lookup page
    │   ├── components/
    │   │   ├── fraud/
    │   │   │   ├── TransferForm.tsx    # Transaction input form
    │   │   │   ├── FraudProcessor.tsx  # Processing animation
    │   │   │   ├── TransactionResult.tsx # Result display + review actions
    │   │   │   ├── OtpPopup.tsx       # OTP dialog
    │   │   │   └── OtpStep.tsx        # OTP step component
    │   │   └── ui/                    # Shared UI components
    │   └── services/
    │       ├── fraudService.ts        # API client for fraud-service
    │       └── configService.ts       # Configuration service
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── postcss.config.mjs
    └── .env                           # NEXT_PUBLIC_FRAUD_URL
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Python** | 3.9+ | Backend runtime |
| **Node.js** | 18+ | Frontend runtime |
| **pnpm** (or npm) | Latest | Frontend package manager |
| **OpenAI API Key** | — | Required for AI agent features |

### 1. Backend Setup (`fraud-service`)

```bash
# Navigate to the backend directory
cd fraud-service

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-openai-key-here
LOG_LEVEL=INFO
DB_PATH=transactions.db
CHECKPOINTS_DB_PATH=checkpoints.db
EOF

# Start the development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at **http://localhost:8000**.
Interactive API docs (Swagger) at **http://localhost:8000/docs**.

### 2. Frontend Setup (`frontend-service`)

```bash
# Navigate to the frontend directory
cd frontend-service

# Install dependencies
pnpm install
# or: npm install

# Configure environment variables
echo 'NEXT_PUBLIC_FRAUD_URL=http://localhost:8000/api/v1' > .env

# Start the development server
pnpm dev
# or: npm run dev
```

Open **http://localhost:3000** in your browser.

### 3. Docker Deployment

```bash
cd fraud-service

# Build and run with Docker Compose
docker-compose up --build

# Or build manually
docker build -t ftr-fraud-service .
docker run -p 8000:8000 --env-file .env ftr-fraud-service
```

---

## 🔐 Environment Variables

### fraud-service (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key for GPT-4o-mini |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `DB_PATH` | ❌ | `transactions.db` | Path to SQLite transaction history database |
| `CHECKPOINTS_DB_PATH` | ❌ | `checkpoints.db` | Path to LangGraph HITL checkpoint database |

### frontend-service (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_FRAUD_URL` | ✅ | — | Base URL of the fraud-service API (e.g., `http://localhost:8000/api/v1`) |

---

## 📖 API Reference

All endpoints are prefixed with `/api/v1`. The service also mounts the same router at the root `/` for backward compatibility.

### Middleware Endpoints

> These are the **recommended integration points** for existing payment systems.

#### `POST /api/v1/middleware/check` — Full Pipeline

**Use when:** FTR owns limits, OTP, and fraud decisions.

Runs: **Limits** → **OTP** → **Fraud Engine** (all layers).

**Request Body:**
```json
{
  "transaction_id": "tx_abc123",
  "from_account": "ACC_001",
  "to_account": "ACC_002",
  "amount": 5000.00,
  "timestamp": "2025-02-16T12:00:00Z",
  "ip_address": "192.168.1.1",
  "device_id": "chrome-macos-14",
  "otp": "123456"
}
```

> **Note:** `timestamp`, `ip_address`, `device_id` are optional (defaults provided). `otp` is required only when `amount ≥ $100`.

**Success Response (200):**
```json
{
  "transaction_id": "tx_abc123",
  "decision": "ALLOW",
  "score": 12,
  "reason": "Low risk — trusted beneficiary with consistent amount.",
  "account_type": "SAVINGS",
  "anomalies": [],
  "patterns": ["Recurring beneficiary: 5 past transactions to this payee (trusted pattern)"],
  "anti_patterns": []
}
```

**Limit Error Response (400):**
```json
{
  "detail": {
    "error_code": "LIMIT_EXCEEDED",
    "message": "Amount $15,000.00 exceeds your single-transaction limit of $5,000.00 (SAVINGS account).",
    "account_type": "SAVINGS",
    "single_tx_limit": 5000.0,
    "daily_limit": 10000.0
  }
}
```

**Decision Values:**

| Decision | Meaning | Action |
|---|---|---|
| `ALLOW` | Transaction is safe | Proceed to settlement |
| `REVIEW` | Moderate risk | Hold for manual review or proceed with caution |
| `BLOCK` | High risk | Reject the transaction |
| `PENDING_REVIEW` | AI flagged for HITL | Awaiting human approval via `/review` endpoint |

---

#### `POST /api/v1/middleware/evaluate` — Fraud Only

**Use when:** Your system already handles limits and auth. You only need a fraud decision.

Runs: **Fraud Engine** only (all 4 layers, no limits/OTP).

**Request Body:** Same as `/middleware/check`.

**Response:** Same schema as `/middleware/check` (without `account_type`).

---

### Scan Endpoint

#### `POST /api/v1/scan`

Primary entry point used by the frontend. Runs the full middleware + fraud pipeline.

**Request Body:**
```json
{
  "transaction_id": "tx_001",
  "from_account": "ACC_A",
  "to_account": "ACC_B",
  "amount": 150.00,
  "timestamp": "2025-02-16T12:00:00Z",
  "ip_address": "10.0.0.1",
  "device_id": "mobile-01",
  "otp": null
}
```

**Response:**
```json
{
  "transaction_id": "tx_001",
  "ai_decision": {
    "decision": "ALLOW",
    "score": 5,
    "reason": "Trusted beneficiary with significant history. Fast-tracked.",
    "patterns": ["Recurring beneficiary: 8 past transactions to this payee (trusted pattern)"]
  },
  "account_type": "SAVINGS"
}
```

---

### Review Endpoint (HITL)

#### `POST /api/v1/review/{transaction_id}`

Approve or decline a transaction that is in `PENDING_REVIEW` status. Resumes the LangGraph workflow from the `human_review` interrupt point.

**Request Body:**
```json
{
  "action": "APPROVE",
  "reason": "Verified with customer via phone call."
}
```

| Field | Type | Values |
|---|---|---|
| `action` | string | `APPROVE` or `DECLINE` |
| `reason` | string | Human-readable justification |

**Response:**
```json
{
  "status": "PROCESSED",
  "ai_response": "```json\n{\"decision\": \"ALLOW\", \"score\": 10, \"reason\": \"Approved by human reviewer.\"}\n```"
}
```

**Error Cases:**

| Status | Response |
|---|---|
| 404 | `"Transaction not found or session expired"` |
| 200 | `{ "status": "ALREADY_PROCESSED" }` if already reviewed |

---

### Lookup & History

#### `GET /api/v1/lookup/{account_id}`

Returns all transactions (sent and received) for a given account.

**Response:**
```json
[
  {
    "transaction_id": "tx_001",
    "from_account": "ACC_A",
    "to_account": "ACC_B",
    "amount": 150.00,
    "timestamp": "2025-02-16T12:00:00",
    "decision": "ALLOW",
    "risk_score": 5.0,
    "reason": "Trusted beneficiary. Fast-tracked."
  }
]
```

#### `GET /api/v1/lookup/{account_id}/indicators`

Runs the **LangChain indicators agent** for advanced account-level risk analysis. Returns current risk indicators, thresholds, safe patterns, and anti-patterns.

---

### OTP Endpoints

#### `POST /api/v1/otp/request`

Generate a one-time password for transaction verification.

**Request Body:**
```json
{
  "transaction_id": "tx_001",
  "from_account": "ACC_A",
  "amount": 5000.00
}
```

**Response:**
```json
{
  "transaction_id": "tx_001",
  "message": "OTP generated. For demo it is returned here; in production it would be sent to your registered device.",
  "otp_demo": "482917",
  "expires_in_seconds": 300,
  "otp_required_threshold": 100.0
}
```

> **Production Note:** In a real deployment, the `otp_demo` field would not be returned — the OTP would be delivered via SMS/email.

---

### Account Limits

#### `GET /api/v1/limits/{account_id}`

Get the account type, limits, and daily usage for an account.

**Response:**
```json
{
  "account_id": "ACC_A",
  "account_type": "SAVINGS",
  "single_tx_limit": 5000.0,
  "daily_limit": 10000.0,
  "daily_used": 2500.0,
  "daily_remaining": 7500.0,
  "otp_required_above": 100.0,
  "account_types_info": {
    "SAVINGS": { "single_tx_limit": 5000.0, "daily_limit": 10000.0 },
    "CHECKING": { "single_tx_limit": 25000.0, "daily_limit": 50000.0 },
    "PREMIUM": { "single_tx_limit": 100000.0, "daily_limit": 250000.0 }
  }
}
```

#### `PUT /api/v1/limits/{account_id}/type`

Set the account type for an account.

**Request Body:**
```json
{
  "account_type": "PREMIUM"
}
```

---

### Configuration Endpoints

#### `GET /api/v1/config`

Returns all fraud engine configuration thresholds.

#### `GET /api/v1/config/{key}`

Returns a single configuration value by key name.

---

### Health Check

#### `GET /api/v1/health` or `GET /health`

```json
{ "status": "ok", "service": "fraud-middleware" }
```

---

## 🔍 Fraud Engine Deep Dive

### Layer 1 — Static Rules (Zero Cost)

Instant checks with no external calls. These run first and can immediately BLOCK or add risk score.

| Check | Score Impact | Trigger |
|---|---|---|
| **Negative Amount** | BLOCK (100) | `amount ≤ 0` |
| **High Amount** | +40 | `amount > $50,000` |
| **Very High Amount** | +50 (cumulative 90) | `amount > $200,000` |
| **Self-Transfer** | +30 | `from_account == to_account` |
| **Security Tool Detected** | +90 | Kali, Metasploit, Frida, Xposed, Cydia, etc. |
| **Emulator Detected** | +30 | Nox, BlueStacks, Emulator |
| **Rooted/Jailbroken** | +90 | Root, Jailbreak, Magisk |

**Suspicious Device Keywords:** `kali`, `parrot os`, `blackarch`, `metasploit`, `root`, `jailbreak`, `magisk`, `cydia`, `frida`, `xposed`, `emulator`, `nox`, `bluestacks`

### Layer 2 — Pattern Analysis (Low Cost)

Checks against historical transaction data in SQLite.

| Check | Score Impact | Trigger | Decision |
|---|---|---|---|
| **High Velocity** | +85 | ≥10 tx in 10 min | BLOCK |
| **Elevated Velocity** | +40 | ≥5 tx in 10 min | REVIEW |
| **Unusual Frequency** | +20 | ≥3 tx in 10 min | — |
| **New Beneficiary + High Amount** | +50 | First tx to payee, >$10k | REVIEW |
| **New Beneficiary + Medium Amount** | +35 | First tx to payee, >$5k | REVIEW |
| **New Beneficiary + Low Amount** | +25 | First tx to payee, >$1k | — |
| **Amount Spike (vs avg)** | +30 | Amount > 3× recent 24h average | REVIEW |
| **Amount Above Max** | +25 | Amount > 2× recent 24h max | — |

### Layer 3 — Anomaly Detection (Low Cost)

Advanced pattern matching for sophisticated fraud patterns.

| Check | Score Impact | Description |
|---|---|---|
| **Amount Anomaly** | +25 | Amount far from 24h average (>5× or <0.2×) |
| **Time Anomaly** | +25 | Transaction at unusual hour (>6h offset from typical peak) |
| **Round Amount** | +20 | Exact round dollar amounts ≥$500 (common in fraud) |
| **Structuring** | +40 | Multiple tx to different beneficiaries in 10 min window |
| **Multiple New Beneficiaries** | +15 | ≥2 new beneficiaries in short window |
| **Smurfing Pattern** | +15 | Multiple round-amount transactions in short window |
| **Large to New After Burst** | +20 | Large transfer to new beneficiary after recent activity burst |

**Positive Patterns (reduce risk):**
- Recurring beneficiary (≥3 past transactions) — trusted pattern
- Amount consistent with recent 24h behavior (within 0.5×–2.0× of average)

### Layer 4 — AI Agent (High Cost)

Only invoked when Layers 1–3 don't provide a definitive fast-track ALLOW or high-confidence BLOCK.

The agent uses **GPT-4o-mini** with 4 bound tools:

| Tool | Purpose |
|---|---|
| `get_recent_transaction_count` | Velocity check — tx count in last N minutes |
| `check_beneficiary_history` | Beneficiary trust — past tx count to this payee |
| `get_pattern_summary` | Combined summary: velocity + beneficiary + 24h stats |
| `fraud` | Deep fraud heuristic analysis (geolocation, device fingerprint) |

### Decision Matrix

```
Score:   0 ──────── 20 ──────── 50 ──────── 75 ──────── 100
         │          │           │           │            │
     ◀── ALLOW ───▶ ◀─── REVIEW (manual) ──▶ ◀── BLOCK ─▶
```

| Score Range | Decision | Description |
|---|---|---|
| 0–19 | `ALLOW` | Low risk — transaction proceeds |
| 20–75 | `REVIEW` | Medium risk — held for review or AI analysis |
| 76–100 | `BLOCK` | High risk — transaction rejected |

**Fast-Track Shortcuts (skip AI entirely):**

| Condition | Decision | Score |
|---|---|---|
| Trusted beneficiary + amount < $100 | `ALLOW` | 5 |
| Micro transaction (amount < $25) | `ALLOW` | 1 |
| Static rules + patterns score > 75 | `BLOCK` | Combined |

---

## 🔧 Transaction Middleware

### Account Types & Limits

The middleware enforces per-account limits **before** the fraud engine, using actual transaction history from the database (not client-reported values).

| Account Type | Single Transaction Limit | Daily Limit |
|---|---|---|
| **SAVINGS** (default) | $5,000 | $10,000 |
| **CHECKING** | $25,000 | $50,000 |
| **PREMIUM** | $100,000 | $250,000 |

Unknown accounts default to **SAVINGS** (most restrictive) for safety.

### OTP Verification

- **Threshold:** OTP required for transactions **≥ $100** (configurable via `OTP_REQUIRED_AMOUNT_THRESHOLD`)
- **Format:** 6-digit numeric code
- **TTL:** 5 minutes (300 seconds)
- **Usage:** One-time — consumed upon successful verification
- **Account Binding:** OTP is bound to both `transaction_id` and `from_account`

**Middleware Error Codes:**

| Error Code | HTTP Status | Meaning |
|---|---|---|
| `LIMIT_EXCEEDED` | 400 | Single-transaction limit exceeded |
| `DAILY_LIMIT_EXCEEDED` | 400 | Daily cumulative limit exceeded |
| `OTP_REQUIRED` | 400 | OTP required but not provided |
| `OTP_INVALID` | 400 | OTP is wrong or expired |

---

## ⚙️ Configuration Reference

### Engine Thresholds

All fraud detection parameters are defined in `fraud-service/app/services/fraud/cfg.py`. This is the **single source of truth** — no database or API updates needed; edit the file and restart.

#### Velocity (transactions in last 10 minutes)

| Parameter | Default | Description |
|---|---|---|
| `velocity_block_threshold` | `10` | Block when count ≥ this |
| `velocity_review_threshold` | `5` | Review when count ≥ this |
| `velocity_warn_threshold` | `3` | Warn when count ≥ this |

#### New Beneficiary Amount Tiers

| Parameter | Default | Description |
|---|---|---|
| `new_beneficiary_high_amount` | `$10,000` | High risk tier |
| `new_beneficiary_med_amount` | `$5,000` | Medium risk tier |
| `new_beneficiary_low_amount` | `$1,000` | Low risk tier |

#### Amount Spike Detection

| Parameter | Default | Description |
|---|---|---|
| `amount_spike_multiplier_avg` | `3.0` | Flag when amount > avg × this multiplier |
| `amount_spike_multiplier_max` | `2.0` | Flag when amount > max × this multiplier |
| `min_transactions_for_avg` | `2` | Min tx in 24h to compute average |

#### Anomaly Detection

| Parameter | Default | Description |
|---|---|---|
| `round_amount_tolerance` | `0.01` | Float tolerance for round-number detection |
| `round_amount_score` | `20` | Risk score for round amounts |
| `unusual_hour_min_tx` | `5` | Min tx in 7d to detect typical activity hours |
| `off_hours_score` | `25` | Risk score for off-hours activity |

#### Structuring / Smurfing

| Parameter | Default | Description |
|---|---|---|
| `structuring_min_tx` | `3` | Min tx/beneficiaries to consider structuring |
| `structuring_new_beneficiary_bonus` | `15` | Extra score for new beneficiary in structuring |

#### Trusted Beneficiary

| Parameter | Default | Description |
|---|---|---|
| `recurring_beneficiary_min` | `3` | Min past tx to treat as trusted beneficiary |

---

## 🤖 AI Agent Tools

The LangGraph agent has access to 4 tools that query live data:

### `get_recent_transaction_count(account_id, minutes)`
Returns the number of outbound transactions from this account in the last `N` minutes. Used for velocity/spam detection.

### `check_beneficiary_history(from_account, to_account)`
Returns whether the sender has previously transacted with this beneficiary and how many times. Used for new-beneficiary risk assessment.

### `get_pattern_summary(from_account, to_account)`
Returns a comprehensive summary: velocity, beneficiary count, 24h average amount, 24h max amount, and new-beneficiary flag. Used for holistic analysis.

### `fraud(transaction_details)`
Performs deep fraud heuristic analysis checking geolocation, device fingerprint, and external pattern databases.

---

## 💻 Frontend Application

The frontend is a **Next.js 16** application with **React 19** and **Tailwind CSS 4**.

### Pages

| Route | Page | Description |
|---|---|---|
| `/` | Transfer Page | Main transaction input form with OTP flow |
| `/history` | History Page | View all past transactions |
| `/lookup` | Lookup Page | Search transactions by account ID |

### Components

| Component | File | Purpose |
|---|---|---|
| `TransferForm` | `TransferForm.tsx` | Transaction input form (amount, accounts, device) |
| `FraudProcessor` | `FraudProcessor.tsx` | Processing animation while scanning |
| `TransactionResult` | `TransactionResult.tsx` | Decision display with review actions |
| `OtpPopup` | `OtpPopup.tsx` | OTP entry dialog |
| `OtpStep` | `OtpStep.tsx` | OTP verification step |

### Services

| Service | File | Purpose |
|---|---|---|
| `fraudService` | `fraudService.ts` | HTTP client for all fraud-service API calls |
| `configService` | `configService.ts` | Configuration and feature flag management |

---

## 💾 Data Persistence

FTR uses **SQLite** for lightweight, zero-config persistence:

| Database | Purpose | Key Tables |
|---|---|---|
| `transactions.db` | Transaction history, account types | `transactions`, `account_types` |
| `checkpoints.db` | LangGraph HITL checkpoint state | LangGraph internal tables |

### Schema: `transactions` Table

| Column | Type | Description |
|---|---|---|
| `transaction_id` | TEXT (PK) | Unique transaction identifier |
| `from_account` | TEXT | Sender account ID |
| `to_account` | TEXT | Recipient account ID |
| `amount` | REAL | Transaction amount (USD) |
| `timestamp` | TEXT | ISO 8601 timestamp |
| `decision` | TEXT | `ALLOW`, `BLOCK`, `REVIEW`, `PENDING_REVIEW` |
| `risk_score` | REAL | 0–100 risk score |
| `reason` | TEXT | Human-readable decision reason |

### Schema: `account_types` Table

| Column | Type | Description |
|---|---|---|
| `account_id` | TEXT (PK) | Account identifier |
| `account_type` | TEXT | `SAVINGS`, `CHECKING`, or `PREMIUM` |

---

## 🔌 Integration Guide

### Option A — Full Pipeline (Limits + OTP + Fraud)

Use when FTR manages everything (limits, OTP, and fraud).

```bash
curl -X POST http://localhost:8000/api/v1/middleware/check \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_test_001",
    "from_account": "ACC_SENDER",
    "to_account": "ACC_RECEIVER",
    "amount": 2500.00
  }'
```

**Integration flow in your code:**

```python
import httpx

async def process_transfer(from_acc, to_acc, amount, otp=None):
    response = await httpx.AsyncClient().post(
        "http://ftr-service:8000/api/v1/middleware/check",
        json={
            "transaction_id": generate_tx_id(),
            "from_account": from_acc,
            "to_account": to_acc,
            "amount": amount,
            "otp": otp,
        }
    )
    
    if response.status_code == 400:
        error = response.json()["detail"]
        if error["error_code"] == "OTP_REQUIRED":
            return {"needs_otp": True}
        elif error["error_code"] in ("LIMIT_EXCEEDED", "DAILY_LIMIT_EXCEEDED"):
            return {"blocked": True, "reason": error["message"]}
    
    result = response.json()
    if result["decision"] == "ALLOW":
        # Proceed to core banking settlement
        await settle_transaction(from_acc, to_acc, amount)
    elif result["decision"] == "PENDING_REVIEW":
        # Queue for human review
        await queue_for_review(result["transaction_id"])
    elif result["decision"] == "BLOCK":
        # Reject and notify
        await notify_rejection(from_acc, result["reason"])
```

### Option B — Fraud Evaluation Only

Use when your system already handles limits and authentication.

```bash
curl -X POST http://localhost:8000/api/v1/middleware/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "tx_test_002",
    "from_account": "ACC_SENDER",
    "to_account": "ACC_RECEIVER",
    "amount": 75000.00,
    "device_id": "chrome-windows-11"
  }'
```

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.9+ | Runtime |
| **FastAPI** | Latest | Web framework & API |
| **Pydantic** | v2 | Data validation & settings |
| **LangChain** | Latest | AI tool calling framework |
| **LangGraph** | Latest | Stateful agent workflow with HITL |
| **OpenAI GPT-4o-mini** | Latest | LLM for behavioral analysis |
| **SQLite** | Built-in | Transaction history & checkpoints |
| **Uvicorn** | Latest | ASGI server |
| **Docker** | — | Containerization |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 16 | React meta-framework |
| **React** | 19 | UI library |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 4 | Utility-first styling |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

### Development Tips

- **Hot reload:** Both services support hot-reload in development mode
- **API docs:** Visit `http://localhost:8000/docs` for interactive Swagger UI
- **Logs:** Check `fraud-service/service.log` for detailed execution logs
- **Config changes:** Edit `cfg.py` and restart the server — no migration needed

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using **FastAPI**, **LangChain**, **LangGraph**, **Next.js**, and **OpenAI**

**[⬆ Back to Top](#-ftr--fraud-transaction-router)**

</div>
]]>
