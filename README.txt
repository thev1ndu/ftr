# Fraud Detection Service API Documentation

## Overview
The Fraud Detection Service evaluates financial transactions using a hybrid approach:
1. **Static Rules**: Immediate blocks for known bad patterns (e.g., "Kali Linux" device).
2. **History Check**: Trusted beneficiary verification (local SQLite DB).
3. **AI Agent (HITL)**: OpenAI-based analysis for complex patterns. High-risk transactions trigger a "PENDING_REVIEW" state, requiring human approval.

## Setup & Running

1. **Navigate to the service**:
   cd fraud-service

2. **Setup Environment**:
   - Create a virtual environment: `python -m venv venv`
   - Activate: `source venv/bin/activate`
   - Install dependencies: `pip install -r requirements.txt`
   
3. **Configuration (.env)**:
   Create `fraud-service/.env` with:
   OPENAI_API_KEY=sk-...
   LOG_LEVEL=INFO
   DB_PATH=transactions.db

4. **Start the Service**:
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## API Endpoints

### 1. Scan Transaction
**POST** /api/v1/scan

Analyzes a transaction.

**Request Body**:
{
  "transaction_id": "tx_123456",
  "from_account": "acc_001",
  "to_account": "acc_002",
  "amount": 500.00,
  "timestamp": "2023-10-27T10:00:00Z",
  "ip_address": "192.168.1.1",
  "device_id": "device_001"
}

**Response**:
- `decision`: "ALLOW", "BLOCK", or "PENDING_REVIEW"
- `score`: 0-100 (Risk Score)
- `reason`: Explanation string

---

### 2. Review Transaction (Human-in-the-Loop)
**POST** /api/v1/review/{transaction_id}

Approve or Decline a transaction in "PENDING_REVIEW" state.

**Request Body**:
{
  "action": "APPROVE",  // or "DECLINE"
  "reason": "Verified by customer support"
}

**Response**:
Returns the final status/AI decision after incorporating human feedback.

## Example Workflow

1. **Trigger HITL**:
   Send a high-risk transaction (e.g., Amount > $50,000 or device "Kali Linux").
   -> Returns `PENDING_REVIEW`.

2. **Approve**:
   Call `/review/{transaction_id}` with `action="APPROVE"`.
   -> Returns `ALLOW` (Service resumes and processes the approval).