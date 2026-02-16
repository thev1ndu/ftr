<div align="center">

# FTR — Financial Transaction Ratings

**AI-Powered Fraud Detection Middleware for Financial Transaction Pipelines**

<p>
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/LangChain-🦜-green" alt="LangChain">
  <img src="https://img.shields.io/badge/LangGraph-HITL-blue" alt="LangGraph">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

<p>A production-grade fraud detection middleware that combines <strong>static rule engines</strong>, <strong>behavioral pattern analysis</strong>, <strong>anomaly detection</strong>, and <strong>LLM-powered AI agents</strong> with a <strong>Human-in-the-Loop (HITL)</strong> review workflow — designed to plug into any existing payment or transfer pipeline.</p>

</div>

---

## 📑 Table of Contents

<table>
<tr>
<td valign="top" width="50%">

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Fraud Engine Deep Dive](#-fraud-engine-deep-dive)

</td>
<td valign="top" width="50%">

- [Transaction Middleware](#-transaction-middleware)
- [Configuration Reference](#-configuration-reference)
- [AI Agent Tools](#-ai-agent-tools)
- [Frontend Application](#-frontend-application)
- [Integration Guide](#-integration-guide)
- [Tech Stack](#-tech-stack)
- [License](#-license)

</td>
</tr>
</table>

---

## 🌐 Overview

**FTR** (Fraud Transaction Router) is a middleware service that sits between your payment initiation layer and your core banking/ledger system. Every outbound transaction is routed through FTR for real-time risk scoring before settlement.

**System Flow:**

```
Your App/Payment UI → FTR Middleware → Core Banking/Settlement
                           ↓
                    Processing Layers:
                    - Layer 1: Static Rules
                    - Layer 2: Pattern Analysis  
                    - Layer 3: Anomaly Detection
                    - Layer 4: AI Agent (GPT-4o-mini)
                    - Human Review (HITL)
```

### Key Design Principles

<table>
<thead>
<tr>
<th>Principle</th>
<th>Implementation</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Cost Efficiency</strong></td>
<td>4-layer cascade — cheap checks first, expensive AI only when needed</td>
</tr>
<tr>
<td><strong>Zero Bypass</strong></td>
<td>Middleware enforces limits <em>before</em> fraud engine — amount manipulation cannot skip checks</td>
</tr>
<tr>
<td><strong>Explainability</strong></td>
<td>Every decision includes score breakdown, reasons, anomalies, patterns & anti-patterns</td>
</tr>
<tr>
<td><strong>Human Oversight</strong></td>
<td>High-risk transactions pause for human review via LangGraph interrupt</td>
</tr>
<tr>
<td><strong>Plug & Play</strong></td>
<td>Two middleware endpoints let you integrate with zero code changes to your existing system</td>
</tr>
</tbody>
</table>

---

## ✨ Key Features

<table>
<thead>
<tr>
<th width="30%">Category</th>
<th>Features</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>🔍 Fraud Detection Engine</strong></td>
<td>
<ul>
<li><strong>4-Layer Hybrid Analysis</strong> — Static rules → Pattern analysis → Anomaly detection → AI Agent</li>
<li><strong>Configurable Thresholds</strong> — All detection parameters tunable via <code>cfg.py</code></li>
<li><strong>Fast-Track Decisions</strong> — Trusted beneficiaries and micro-transactions skip AI (cost = $0)</li>
<li><strong>Behavioral Profiling</strong> — Velocity monitoring, beneficiary trust scoring, amount spike detection</li>
<li><strong>Anti-Pattern Detection</strong> — Smurfing / structuring, round-amount fraud, off-hours activity</li>
</ul>
</td>
</tr>
<tr>
<td><strong>💳 Transaction Middleware</strong></td>
<td>
<ul>
<li><strong>Account-Type Limits</strong> — Savings / Checking / Premium with per-transaction and daily caps</li>
<li><strong>OTP Verification</strong> — Required for transactions above configurable threshold ($100 default)</li>
<li><strong>Bypass-Proof</strong> — Limits enforced from actual transaction history, not client-reported totals</li>
</ul>
</td>
</tr>
<tr>
<td><strong>🤖 AI Agent (LangGraph + OpenAI)</strong></td>
<td>
<ul>
<li><strong>Tool-Calling Agent</strong> — GPT-4o-mini with 4 bound tools for real-time data retrieval</li>
<li><strong>Human-in-the-Loop</strong> — LangGraph <code>interrupt_before</code> pauses execution for manual review</li>
<li><strong>Persistent Memory</strong> — SQLite-backed conversation memory + LangGraph checkpoint state</li>
<li><strong>Structured JSON Output</strong> — Enforced <code>{ decision, score, reason }</code> response schema</li>
</ul>
</td>
</tr>
<tr>
<td><strong>🎨 Frontend Demo UI</strong></td>
<td>
<ul>
<li><strong>Premium UI</strong> — Next.js 16 + React 19 + Tailwind CSS 4</li>
<li><strong>Full Transaction Flow</strong> — Transfer form → OTP → Processing → AI Result → History</li>
<li><strong>Account History</strong> — Lookup transactions by account ID with summary statistics</li>
</ul>
</td>
</tr>
</tbody>
</table>

---

## 🏗️ Architecture

### High-Level System Architecture

**Architecture Components:**

<table>
<thead>
<tr>
<th>Layer</th>
<th>Component</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td rowspan="3"><strong>Frontend Service</strong></td>
<td>Next.js 16 / React 19</td>
<td>Modern web application framework</td>
</tr>
<tr>
<td>Transfer Form + OTP</td>
<td>User interface for transaction input</td>
</tr>
<tr>
<td>Transaction Result</td>
<td>Display fraud analysis results</td>
</tr>
<tr>
<td rowspan="4"><strong>Backend Service</strong></td>
<td>FastAPI Layer (v1)</td>
<td>RESTful API endpoints</td>
</tr>
<tr>
<td>Transaction Middleware</td>
<td>Account limits & OTP verification</td>
</tr>
<tr>
<td>Fraud Evaluation Engine</td>
<td>4-layer fraud detection analysis</td>
</tr>
<tr>
<td>SQLite Persistence</td>
<td>Transaction history & checkpoint storage</td>
</tr>
</tbody>
</table>

**Data Flow:**

1. Frontend sends HTTP request to API Layer
2. API routes to Transaction Middleware
3. Middleware validates limits and OTP
4. If passed, request goes to Fraud Engine
5. Fraud Engine evaluates using 4 layers
6. Results stored in SQLite database
7. Response sent back to Frontend

### Transaction Processing Pipeline

**Processing Steps:**

<table>
<thead>
<tr>
<th>Step</th>
<th>Check</th>
<th>Pass Condition</th>
<th>Fail Response</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>1</strong></td>
<td>Limits Check</td>
<td>Within account limits</td>
<td><code>400 LIMIT_EXCEEDED</code></td>
</tr>
<tr>
<td><strong>2</strong></td>
<td>OTP Verification</td>
<td>Valid OTP or amount &lt; $100</td>
<td><code>400 OTP_REQUIRED</code></td>
</tr>
<tr>
<td><strong>3</strong></td>
<td>Static Rules (Layer 1)</td>
<td>No suspicious device/amount</td>
<td>Add risk score</td>
</tr>
<tr>
<td><strong>4</strong></td>
<td>Pattern Analysis (Layer 2)</td>
<td>Normal velocity/beneficiary</td>
<td>Add risk score</td>
</tr>
<tr>
<td><strong>5</strong></td>
<td>Anomaly Detection (Layer 3)</td>
<td>No time/amount anomalies</td>
<td>Add risk score</td>
</tr>
<tr>
<td><strong>6</strong></td>
<td>Fast Track Decision</td>
<td>Trusted + low amount OR score &gt; 75</td>
<td><code>ALLOW</code> or <code>BLOCK</code></td>
</tr>
<tr>
<td><strong>7</strong></td>
<td>AI Agent (Layer 4)</td>
<td>GPT-4o-mini analysis</td>
<td>Decision + score + reason</td>
</tr>
<tr>
<td><strong>8</strong></td>
<td>Human Review (HITL)</td>
<td>Manual approval for high risk</td>
<td><code>ALLOW</code> or <code>BLOCK</code></td>
</tr>
<tr>
<td><strong>9</strong></td>
<td>Final Logging</td>
<td>All decisions logged to SQLite</td>
<td>Transaction complete</td>
</tr>
</tbody>
</table>

**Decision Flow:**

- **Steps 1-2:** Middleware validation (hard stops)
- **Steps 3-5:** Risk score accumulation
- **Step 6:** Fast-track decisions to skip AI costs
- **Step 7:** AI analysis for complex cases
- **Step 8:** Human intervention for highest risk
- **Step 9:** Persistence and audit trail

### Fraud Engine Layers

<table>
<thead>
<tr>
<th>Layer</th>
<th>Cost</th>
<th>What It Does</th>
<th>Example Triggers</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>1. Static Rules</strong></td>
<td>Zero</td>
<td>Device fingerprinting, amount validation, self-transfer check</td>
<td>Kali Linux, Metasploit, &gt;$200k transfer</td>
</tr>
<tr>
<td><strong>2. Pattern Analysis</strong></td>
<td>Low</td>
<td>Velocity check, new beneficiary scoring, amount spike detection</td>
<td>10+ tx in 10min, first transfer &gt;$10k</td>
</tr>
<tr>
<td><strong>3. Anomaly Detection</strong></td>
<td>Low</td>
<td>Time-of-day analysis, round-amount detection, structuring/smurfing</td>
<td>Transfer at 3 AM, multiple $5k round amounts</td>
</tr>
<tr>
<td><strong>4. AI Agent</strong></td>
<td>High</td>
<td>LLM with tools for deep behavioral analysis</td>
<td>Complex scenarios needing judgment</td>
</tr>
</tbody>
</table>

### AI Agent Workflow (LangGraph)

**Agent Execution Flow:**

<table>
<thead>
<tr>
<th>Stage</th>
<th>Action</th>
<th>Next Step</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Start</strong></td>
<td>Transaction enters AI agent</td>
<td>Agent Node</td>
</tr>
<tr>
<td><strong>Agent Node</strong></td>
<td>GPT-4o-mini processes with 4 tools</td>
<td>Should Continue decision</td>
</tr>
<tr>
<td><strong>Tool Execution</strong></td>
<td>Call velocity/beneficiary/pattern/fraud tools</td>
<td>Return to Agent Node</td>
</tr>
<tr>
<td><strong>Human Review</strong></td>
<td>High risk triggers LangGraph interrupt</td>
<td>End with approval/decline</td>
</tr>
<tr>
<td><strong>End</strong></td>
<td>Final decision returned</td>
<td>Complete</td>
</tr>
</tbody>
</table>

**Agent Components:**

<table>
<tr>
<td><strong>agent</strong></td>
<td>Invokes GPT-4o-mini with bound tools and system prompt</td>
</tr>
<tr>
<td><strong>tools</strong></td>
<td>Executes tool calls (velocity check, beneficiary history, pattern summary, deep fraud analysis)</td>
</tr>
<tr>
<td><strong>human_review</strong></td>
<td>Interrupt point where execution pauses for manual approval/decline</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

<table>
<thead>
<tr>
<th>Tool</th>
<th>Version</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Python</strong></td>
<td>3.9+</td>
<td>Backend runtime</td>
</tr>
<tr>
<td><strong>Node.js</strong></td>
<td>18+</td>
<td>Frontend runtime</td>
</tr>
<tr>
<td><strong>pnpm</strong> (or npm)</td>
<td>Latest</td>
<td>Frontend package manager</td>
</tr>
<tr>
<td><strong>OpenAI API Key</strong></td>
<td>—</td>
<td>Required for AI agent features</td>
</tr>
</tbody>
</table>

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

<blockquote>
<p>✅ The API will be available at <strong>http://localhost:8000</strong></p>
<p>📚 Interactive API docs (Swagger) at <strong>http://localhost:8000/docs</strong></p>
</blockquote>

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

<blockquote>
<p>✅ Open <strong>http://localhost:3000</strong> in your browser</p>
</blockquote>

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

<table>
<thead>
<tr>
<th>Variable</th>
<th>Required</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>OPENAI_API_KEY</code></td>
<td>✅</td>
<td>—</td>
<td>OpenAI API key for GPT-4o-mini</td>
</tr>
<tr>
<td><code>LOG_LEVEL</code></td>
<td>❌</td>
<td><code>INFO</code></td>
<td>Logging level (<code>DEBUG</code>, <code>INFO</code>, <code>WARNING</code>, <code>ERROR</code>)</td>
</tr>
<tr>
<td><code>DB_PATH</code></td>
<td>❌</td>
<td><code>transactions.db</code></td>
<td>Path to SQLite transaction history database</td>
</tr>
<tr>
<td><code>CHECKPOINTS_DB_PATH</code></td>
<td>❌</td>
<td><code>checkpoints.db</code></td>
<td>Path to LangGraph HITL checkpoint database</td>
</tr>
</tbody>
</table>

### frontend-service (`.env`)

<table>
<thead>
<tr>
<th>Variable</th>
<th>Required</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>NEXT_PUBLIC_FRAUD_URL</code></td>
<td>✅</td>
<td>—</td>
<td>Base URL of the fraud-service API (e.g., <code>http://localhost:8000/api/v1</code>)</td>
</tr>
</tbody>
</table>

---

## 📖 API Reference

<blockquote>
<p>All endpoints are prefixed with <code>/api/v1</code>. The service also mounts the same router at the root <code>/</code> for backward compatibility.</p>
</blockquote>

### Middleware Endpoints

<p><strong>🎯 These are the recommended integration points for existing payment systems.</strong></p>

#### `POST /api/v1/middleware/check` — Full Pipeline

<table>
<tr>
<td><strong>Use when:</strong></td>
<td>FTR owns limits, OTP, and fraud decisions</td>
</tr>
<tr>
<td><strong>Runs:</strong></td>
<td><strong>Limits</strong> → <strong>OTP</strong> → <strong>Fraud Engine</strong> (all layers)</td>
</tr>
</table>

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

<blockquote>
<p><strong>Note:</strong> <code>timestamp</code>, <code>ip_address</code>, <code>device_id</code> are optional (defaults provided). <code>otp</code> is required only when <code>amount ≥ $100</code>.</p>
</blockquote>

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

<table>
<thead>
<tr>
<th>Decision</th>
<th>Meaning</th>
<th>Action</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>ALLOW</code></td>
<td>Transaction is safe</td>
<td>Proceed to settlement</td>
</tr>
<tr>
<td><code>REVIEW</code></td>
<td>Moderate risk</td>
<td>Hold for manual review or proceed with caution</td>
</tr>
<tr>
<td><code>BLOCK</code></td>
<td>High risk</td>
<td>Reject the transaction</td>
</tr>
<tr>
<td><code>PENDING_REVIEW</code></td>
<td>AI flagged for HITL</td>
<td>Awaiting human approval via <code>/review</code> endpoint</td>
</tr>
</tbody>
</table>

---

#### `POST /api/v1/middleware/evaluate` — Fraud Only

<table>
<tr>
<td><strong>Use when:</strong></td>
<td>Your system already handles limits and auth. You only need a fraud decision.</td>
</tr>
<tr>
<td><strong>Runs:</strong></td>
<td><strong>Fraud Engine</strong> only (all 4 layers, no limits/OTP)</td>
</tr>
</table>

**Request Body:** Same as `/middleware/check`

**Response:** Same schema as `/middleware/check` (without `account_type`)

---

### Additional Endpoints

<table>
<thead>
<tr>
<th>Endpoint</th>
<th>Method</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>/api/v1/scan</code></td>
<td>POST</td>
<td>Primary entry point used by the frontend. Runs full middleware + fraud pipeline</td>
</tr>
<tr>
<td><code>/api/v1/review/{transaction_id}</code></td>
<td>POST</td>
<td>Approve or decline a transaction in <code>PENDING_REVIEW</code> status (HITL)</td>
</tr>
<tr>
<td><code>/api/v1/lookup/{account_id}</code></td>
<td>GET</td>
<td>Returns all transactions (sent and received) for a given account</td>
</tr>
<tr>
<td><code>/api/v1/lookup/{account_id}/indicators</code></td>
<td>GET</td>
<td>Runs LangChain indicators agent for advanced account-level risk analysis</td>
</tr>
<tr>
<td><code>/api/v1/otp/request</code></td>
<td>POST</td>
<td>Generate a one-time password for transaction verification</td>
</tr>
<tr>
<td><code>/api/v1/limits/{account_id}</code></td>
<td>GET</td>
<td>Get account type, limits, and daily usage for an account</td>
</tr>
<tr>
<td><code>/api/v1/limits/{account_id}/type</code></td>
<td>PUT</td>
<td>Set the account type for an account</td>
</tr>
<tr>
<td><code>/api/v1/config</code></td>
<td>GET</td>
<td>Returns all fraud engine configuration thresholds</td>
</tr>
<tr>
<td><code>/api/v1/config/{key}</code></td>
<td>GET</td>
<td>Returns a single configuration value by key name</td>
</tr>
<tr>
<td><code>/api/v1/health</code></td>
<td>GET</td>
<td>Health check endpoint</td>
</tr>
</tbody>
</table>

---

## 🔍 Fraud Engine Deep Dive

### Layer 1 — Static Rules (Zero Cost)

<p>Instant checks with no external calls. These run first and can immediately BLOCK or add risk score.</p>

<table>
<thead>
<tr>
<th>Check</th>
<th>Score Impact</th>
<th>Trigger</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Negative Amount</strong></td>
<td>BLOCK (100)</td>
<td><code>amount ≤ 0</code></td>
</tr>
<tr>
<td><strong>High Amount</strong></td>
<td>+40</td>
<td><code>amount &gt; $50,000</code></td>
</tr>
<tr>
<td><strong>Very High Amount</strong></td>
<td>+50 (cumulative 90)</td>
<td><code>amount &gt; $200,000</code></td>
</tr>
<tr>
<td><strong>Self-Transfer</strong></td>
<td>+30</td>
<td><code>from_account == to_account</code></td>
</tr>
<tr>
<td><strong>Security Tool Detected</strong></td>
<td>+90</td>
<td>Kali, Metasploit, Frida, Xposed, Cydia, etc.</td>
</tr>
<tr>
<td><strong>Emulator Detected</strong></td>
<td>+30</td>
<td>Nox, BlueStacks, Emulator</td>
</tr>
<tr>
<td><strong>Rooted/Jailbroken</strong></td>
<td>+90</td>
<td>Root, Jailbreak, Magisk</td>
</tr>
</tbody>
</table>

<blockquote>
<p><strong>Suspicious Device Keywords:</strong> <code>kali</code>, <code>parrot os</code>, <code>blackarch</code>, <code>metasploit</code>, <code>root</code>, <code>jailbreak</code>, <code>magisk</code>, <code>cydia</code>, <code>frida</code>, <code>xposed</code>, <code>emulator</code>, <code>nox</code>, <code>bluestacks</code></p>
</blockquote>

### Layer 2 — Pattern Analysis (Low Cost)

<p>Checks against historical transaction data in SQLite.</p>

<table>
<thead>
<tr>
<th>Check</th>
<th>Score Impact</th>
<th>Trigger</th>
<th>Decision</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>High Velocity</strong></td>
<td>+85</td>
<td>≥10 tx in 10 min</td>
<td>BLOCK</td>
</tr>
<tr>
<td><strong>Elevated Velocity</strong></td>
<td>+40</td>
<td>≥5 tx in 10 min</td>
<td>REVIEW</td>
</tr>
<tr>
<td><strong>Unusual Frequency</strong></td>
<td>+20</td>
<td>≥3 tx in 10 min</td>
<td>—</td>
</tr>
<tr>
<td><strong>New Beneficiary + High Amount</strong></td>
<td>+50</td>
<td>First tx to payee, &gt;$10k</td>
<td>REVIEW</td>
</tr>
<tr>
<td><strong>New Beneficiary + Medium Amount</strong></td>
<td>+35</td>
<td>First tx to payee, &gt;$5k</td>
<td>REVIEW</td>
</tr>
<tr>
<td><strong>New Beneficiary + Low Amount</strong></td>
<td>+25</td>
<td>First tx to payee, &gt;$1k</td>
<td>—</td>
</tr>
<tr>
<td><strong>Amount Spike (vs avg)</strong></td>
<td>+30</td>
<td>Amount &gt; 3× recent 24h average</td>
<td>REVIEW</td>
</tr>
<tr>
<td><strong>Amount Above Max</strong></td>
<td>+25</td>
<td>Amount &gt; 2× recent 24h max</td>
<td>—</td>
</tr>
</tbody>
</table>

### Layer 3 — Anomaly Detection (Low Cost)

<p>Advanced pattern matching for sophisticated fraud patterns.</p>

<table>
<thead>
<tr>
<th>Check</th>
<th>Score Impact</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Amount Anomaly</strong></td>
<td>+25</td>
<td>Amount far from 24h average (&gt;5× or &lt;0.2×)</td>
</tr>
<tr>
<td><strong>Time Anomaly</strong></td>
<td>+25</td>
<td>Transaction at unusual hour (&gt;6h offset from typical peak)</td>
</tr>
<tr>
<td><strong>Round Amount</strong></td>
<td>+20</td>
<td>Exact round dollar amounts ≥$500 (common in fraud)</td>
</tr>
<tr>
<td><strong>Structuring</strong></td>
<td>+40</td>
<td>Multiple tx to different beneficiaries in 10 min window</td>
</tr>
<tr>
<td><strong>Multiple New Beneficiaries</strong></td>
<td>+15</td>
<td>≥2 new beneficiaries in short window</td>
</tr>
<tr>
<td><strong>Smurfing Pattern</strong></td>
<td>+15</td>
<td>Multiple round-amount transactions in short window</td>
</tr>
<tr>
<td><strong>Large to New After Burst</strong></td>
<td>+20</td>
<td>Large transfer to new beneficiary after recent activity burst</td>
</tr>
</tbody>
</table>

<blockquote>
<p><strong>✅ Positive Patterns</strong> (reduce risk):</p>
<ul>
<li>Recurring beneficiary (≥3 past transactions) — trusted pattern</li>
<li>Amount consistent with recent 24h behavior (within 0.5×–2.0× of average)</li>
</ul>
</blockquote>

### Layer 4 — AI Agent (High Cost)

<p>Only invoked when Layers 1–3 don't provide a definitive fast-track ALLOW or high-confidence BLOCK.</p>

<p>The agent uses <strong>GPT-4o-mini</strong> with 4 bound tools:</p>

<table>
<thead>
<tr>
<th>Tool</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>get_recent_transaction_count</code></td>
<td>Velocity check — tx count in last N minutes</td>
</tr>
<tr>
<td><code>check_beneficiary_history</code></td>
<td>Beneficiary trust — past tx count to this payee</td>
</tr>
<tr>
<td><code>get_pattern_summary</code></td>
<td>Combined summary: velocity + beneficiary + 24h stats</td>
</tr>
<tr>
<td><code>fraud</code></td>
<td>Deep fraud heuristic analysis (geolocation, device fingerprint)</td>
</tr>
</tbody>
</table>

### Decision Matrix

<table>
<thead>
<tr>
<th>Score Range</th>
<th>Decision</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>0–19</td>
<td><code>ALLOW</code></td>
<td>Low risk — transaction proceeds</td>
</tr>
<tr>
<td>20–75</td>
<td><code>REVIEW</code></td>
<td>Medium risk — held for review or AI analysis</td>
</tr>
<tr>
<td>76–100</td>
<td><code>BLOCK</code></td>
<td>High risk — transaction rejected</td>
</tr>
</tbody>
</table>

**Fast-Track Shortcuts** (skip AI entirely):

<table>
<thead>
<tr>
<th>Condition</th>
<th>Decision</th>
<th>Score</th>
</tr>
</thead>
<tbody>
<tr>
<td>Trusted beneficiary + amount &lt; $100</td>
<td><code>ALLOW</code></td>
<td>5</td>
</tr>
<tr>
<td>Micro transaction (amount &lt; $25)</td>
<td><code>ALLOW</code></td>
<td>1</td>
</tr>
<tr>
<td>Static rules + patterns score &gt; 75</td>
<td><code>BLOCK</code></td>
<td>Combined</td>
</tr>
</tbody>
</table>

---

## 🔧 Transaction Middleware

### Account Types & Limits

<p>The middleware enforces per-account limits <strong>before</strong> the fraud engine, using actual transaction history from the database (not client-reported values).</p>

<table>
<thead>
<tr>
<th>Account Type</th>
<th>Single Transaction Limit</th>
<th>Daily Limit</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>SAVINGS</strong> (default)</td>
<td>$5,000</td>
<td>$10,000</td>
</tr>
<tr>
<td><strong>CHECKING</strong></td>
<td>$25,000</td>
<td>$50,000</td>
</tr>
<tr>
<td><strong>PREMIUM</strong></td>
<td>$100,000</td>
<td>$250,000</td>
</tr>
</tbody>
</table>

<blockquote>
<p>⚠️ Unknown accounts default to <strong>SAVINGS</strong> (most restrictive) for safety.</p>
</blockquote>

### OTP Verification

<table>
<tr>
<td><strong>Threshold:</strong></td>
<td>OTP required for transactions <strong>≥ $100</strong> (configurable via <code>OTP_REQUIRED_AMOUNT_THRESHOLD</code>)</td>
</tr>
<tr>
<td><strong>Format:</strong></td>
<td>6-digit numeric code</td>
</tr>
<tr>
<td><strong>TTL:</strong></td>
<td>5 minutes (300 seconds)</td>
</tr>
<tr>
<td><strong>Usage:</strong></td>
<td>One-time — consumed upon successful verification</td>
</tr>
<tr>
<td><strong>Account Binding:</strong></td>
<td>OTP is bound to both <code>transaction_id</code> and <code>from_account</code></td>
</tr>
</table>

**Middleware Error Codes:**

<table>
<thead>
<tr>
<th>Error Code</th>
<th>HTTP Status</th>
<th>Meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>LIMIT_EXCEEDED</code></td>
<td>400</td>
<td>Single-transaction limit exceeded</td>
</tr>
<tr>
<td><code>DAILY_LIMIT_EXCEEDED</code></td>
<td>400</td>
<td>Daily cumulative limit exceeded</td>
</tr>
<tr>
<td><code>OTP_REQUIRED</code></td>
<td>400</td>
<td>OTP required but not provided</td>
</tr>
<tr>
<td><code>OTP_INVALID</code></td>
<td>400</td>
<td>OTP is wrong or expired</td>
</tr>
</tbody>
</table>

---

## ⚙️ Configuration Reference

### Engine Thresholds

<p>All fraud detection parameters are defined in <code>fraud-service/app/services/fraud/cfg.py</code>. This is the <strong>single source of truth</strong> — no database or API updates needed; edit the file and restart.</p>

#### Velocity (transactions in last 10 minutes)

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>velocity_block_threshold</code></td>
<td><code>10</code></td>
<td>Block when count ≥ this</td>
</tr>
<tr>
<td><code>velocity_review_threshold</code></td>
<td><code>5</code></td>
<td>Review when count ≥ this</td>
</tr>
<tr>
<td><code>velocity_warn_threshold</code></td>
<td><code>3</code></td>
<td>Warn when count ≥ this</td>
</tr>
</tbody>
</table>

#### New Beneficiary Amount Tiers

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>new_beneficiary_high_amount</code></td>
<td><code>$10,000</code></td>
<td>High risk tier</td>
</tr>
<tr>
<td><code>new_beneficiary_med_amount</code></td>
<td><code>$5,000</code></td>
<td>Medium risk tier</td>
</tr>
<tr>
<td><code>new_beneficiary_low_amount</code></td>
<td><code>$1,000</code></td>
<td>Low risk tier</td>
</tr>
</tbody>
</table>

#### Amount Spike Detection

<table>
<thead>
<tr>
<th>Parameter</th>
<th>Default</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>amount_spike_multiplier_avg</code></td>
<td><code>3.0</code></td>
<td>Flag when amount &gt; avg × this multiplier</td>
</tr>
<tr>
<td><code>amount_spike_multiplier_max</code></td>
<td><code>2.0</code></td>
<td>Flag when amount &gt; max × this multiplier</td>
</tr>
<tr>
<td><code>min_transactions_for_avg</code></td>
<td><code>2</code></td>
<td>Min tx in 24h to compute average</td>
</tr>
</tbody>
</table>

---

## 🤖 AI Agent Tools

<p>The LangGraph agent has access to 4 tools that query live data:</p>

<table>
<thead>
<tr>
<th>Tool</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>get_recent_transaction_count</code></td>
<td>Returns the number of outbound transactions from this account in the last N minutes. Used for velocity/spam detection.</td>
</tr>
<tr>
<td><code>check_beneficiary_history</code></td>
<td>Returns whether the sender has previously transacted with this beneficiary and how many times. Used for new-beneficiary risk assessment.</td>
</tr>
<tr>
<td><code>get_pattern_summary</code></td>
<td>Returns a comprehensive summary: velocity, beneficiary count, 24h average amount, 24h max amount, and new-beneficiary flag. Used for holistic analysis.</td>
</tr>
<tr>
<td><code>fraud</code></td>
<td>Performs deep fraud heuristic analysis checking geolocation, device fingerprint, and external pattern databases.</td>
</tr>
</tbody>
</table>

---

## 💻 Frontend Application

<p>The frontend is a <strong>Next.js 16</strong> application with <strong>React 19</strong> and <strong>Tailwind CSS 4</strong>.</p>

### Pages

<table>
<thead>
<tr>
<th>Route</th>
<th>Page</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>/</code></td>
<td>Transfer Page</td>
<td>Main transaction input form with OTP flow</td>
</tr>
<tr>
<td><code>/history</code></td>
<td>History Page</td>
<td>View all past transactions</td>
</tr>
<tr>
<td><code>/lookup</code></td>
<td>Lookup Page</td>
<td>Search transactions by account ID</td>
</tr>
</tbody>
</table>

### Key Components

<table>
<thead>
<tr>
<th>Component</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><code>TransferForm</code></td>
<td>Transaction input form (amount, accounts, device)</td>
</tr>
<tr>
<td><code>FraudProcessor</code></td>
<td>Processing animation while scanning</td>
</tr>
<tr>
<td><code>TransactionResult</code></td>
<td>Decision display with review actions</td>
</tr>
<tr>
<td><code>OtpPopup</code></td>
<td>OTP entry dialog</td>
</tr>
<tr>
<td><code>OtpStep</code></td>
<td>OTP verification step</td>
</tr>
</tbody>
</table>

---

## 🔌 Integration Guide

### Option A — Full Pipeline (Limits + OTP + Fraud)

<p>Use when FTR manages everything (limits, OTP, and fraud).</p>

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

<p>Use when your system already handles limits and authentication.</p>

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

<table>
<thead>
<tr>
<th>Technology</th>
<th>Version</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Python</strong></td>
<td>3.9+</td>
<td>Runtime</td>
</tr>
<tr>
<td><strong>FastAPI</strong></td>
<td>Latest</td>
<td>Web framework & API</td>
</tr>
<tr>
<td><strong>Pydantic</strong></td>
<td>v2</td>
<td>Data validation & settings</td>
</tr>
<tr>
<td><strong>LangChain</strong></td>
<td>Latest</td>
<td>AI tool calling framework</td>
</tr>
<tr>
<td><strong>LangGraph</strong></td>
<td>Latest</td>
<td>Stateful agent workflow with HITL</td>
</tr>
<tr>
<td><strong>OpenAI GPT-4o-mini</strong></td>
<td>Latest</td>
<td>LLM for behavioral analysis</td>
</tr>
<tr>
<td><strong>SQLite</strong></td>
<td>Built-in</td>
<td>Transaction history & checkpoints</td>
</tr>
<tr>
<td><strong>Uvicorn</strong></td>
<td>Latest</td>
<td>ASGI server</td>
</tr>
<tr>
<td><strong>Docker</strong></td>
<td>—</td>
<td>Containerization</td>
</tr>
</tbody>
</table>

### Frontend

<table>
<thead>
<tr>
<th>Technology</th>
<th>Version</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Next.js</strong></td>
<td>16</td>
<td>React meta-framework</td>
</tr>
<tr>
<td><strong>React</strong></td>
<td>19</td>
<td>UI library</td>
</tr>
<tr>
<td><strong>TypeScript</strong></td>
<td>5+</td>
<td>Type safety</td>
</tr>
<tr>
<td><strong>Tailwind CSS</strong></td>
<td>4</td>
<td>Utility-first styling</td>
</tr>
</tbody>
</table>

---

## 🤝 Contributing

<ol>
<li><strong>Fork</strong> the repository</li>
<li><strong>Create</strong> a feature branch: <code>git checkout -b feature/my-feature</code></li>
<li><strong>Commit</strong> your changes: <code>git commit -m 'Add my feature'</code></li>
<li><strong>Push</strong> to the branch: <code>git push origin feature/my-feature</code></li>
<li><strong>Open</strong> a Pull Request</li>
</ol>

### Development Tips

<ul>
<li><strong>Hot reload:</strong> Both services support hot-reload in development mode</li>
<li><strong>API docs:</strong> Visit <code>http://localhost:8000/docs</code> for interactive Swagger UI</li>
<li><strong>Logs:</strong> Check <code>fraud-service/service.log</code> for detailed execution logs</li>
<li><strong>Config changes:</strong> Edit <code>cfg.py</code> and restart the server — no migration needed</li>
</ul>

---

## 📄 License

<p>This project is licensed under the <strong>MIT License</strong>. See the <a href="LICENSE">LICENSE</a> file for details.</p>

---

<div align="center">

<p>Built with ❤️ using <strong>FastAPI</strong>, <strong>LangChain</strong>, <strong>LangGraph</strong>, <strong>Next.js</strong>, and <strong>OpenAI</strong></p>

</div>