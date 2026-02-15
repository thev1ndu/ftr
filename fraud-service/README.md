# Fraud Detection Service

This service provides real-time fraud detection using a hybrid approach combining static rules, historical analysis, and a stateful AI agent with Human-in-the-Loop (HITL) capabilities.

## Architecture

The service evaluates transactions through a 3-step process:

1.  **Static Rules (Zero Cost)**: Checks for known bad patterns (e.g., blacklisted devices like "Kali Linux").
2.  **History Check (Low Cost)**: Verifies if the beneficiary is trusted based on past transaction history in the local SQLite database.
3.  **AI Agent (High Cost)**: Uses an OpenAI-powered agent to analyze complex patterns.
    - **HITL**: If the Agent flags a transaction as **High Risk** (Score > 70) or **BLOCK**, it pauses execution and returns `PENDING_REVIEW`, awaiting human approval.

## Prerequisites

- Python 3.10+
- OpenAI API Key

## Setup

1.  **Clone the repository** and navigate to `fraud-service`:

    ```bash
    cd fraud-service
    ```

2.  **Create a virtual environment**:

    ```bash
    python -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment**:
    Create a `.env` file in the root directory:
    ```env
    OPENAI_API_KEY=sk-your-api-key-here
    LOG_LEVEL=INFO
    DB_PATH=transactions.db
    CHECKPOINTS_DB_PATH=checkpoints.db
    ```
    - `CHECKPOINTS_DB_PATH`: SQLite DB for LangGraph HITL state (so the agent can pause for human review and resume later). Defaults to `checkpoints.db`. Use an **absolute path** (e.g. `/var/data/checkpoints.db`) if you run the app from different directories and want a single DB.

## Running the Service

Start the FastAPI server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

### 1. Scan Transaction

Analyzes a transaction for fraud.

- **Endpoint**: `POST /api/v1/scan`
- **Request Body**:
  ```json
  {
    "transaction_id": "tx_12345",
    "from_account": "user_001",
    "to_account": "user_002",
    "amount": 500.0,
    "timestamp": "2023-10-27T10:00:00Z",
    "ip_address": "192.168.1.1",
    "device_id": "device_iphone12"
  }
  ```
- **Response**:
  - `ALLOW`: Low risk, processed immediately.
  - `BLOCK`: High risk, blocked immediately.
  - `PENDING_REVIEW`: Paused for human decision (HITL).

### 2. Review Transaction (HITL)

Approve or Decline a transaction that is in `PENDING_REVIEW` state.

- **Endpoint**: `POST /api/v1/review/{transaction_id}`
- **Request Body**:
  ```json
  {
    "action": "APPROVE", // or "DECLINE"
    "reason": "Verified by phone call"
  }
  ```
- **Response**:
  Returns the final AI decision after integrating human feedback (e.g., status updates to `PROCESSED`).

## Example Workflow (HITL)

1.  **Scan** a suspicious transaction:

    ```bash
    curl -X POST "http://localhost:8000/api/v1/scan" \
    -H "Content-Type: application/json" \
    -d '{
      "transaction_id": "suspicious_tx",
      "amount": 50000,
      "device_id": "unknown_device",
      ...
    }'
    ```

    **Response**: `{"decision": "PENDING_REVIEW", ...}`

2.  **Review** and Approve:
    ```bash
    curl -X POST "http://localhost:8000/api/v1/review/suspicious_tx" \
    -H "Content-Type: application/json" \
    -d '{"action": "APPROVE", "reason": "Authorized"}'
    ```
    **Response**: `{"status": "PROCESSED", "ai_response": "ALLOW"}`
