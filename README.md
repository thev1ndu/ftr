# FPR - Fraud Prevention & Risk System

A modern, AI-powered fraud detection system that uses a hybrid approach of static rules, history verification, and LLM-based behavioral analysis to screen financial transactions in real-time.

## 🌟 Features

- **Hybrid Analysis Engine**:
  - **Static Rules**: Zero-latency blocking for known bad patterns (e.g., suspicious devices).
  - **History Check**: Trusted beneficiary verification using local transaction history.
  - **AI Agent (HITL)**: Advanced behavioral analysis using OpenAI. High-risk transactions trigger a Human-in-the-Loop review process.
- **Transaction History**: Complete record of all scanned transactions with powerful lookup and summary statistics.
- **Modern UI**: A premium, responsive frontend built with Next.js and Tailwind CSS.
- **Real-time Feedback**: Instant visual feedback for transaction decisions, including detailed engine reports.

## 🏗️ Architecture

The project is divided into two main services:

- **`fraud-service`**: A Python FastAPI backend that handles transaction scoring, AI agent execution (LangChain/LangGraph), and SQLite persistence.
- **`frontend-service`**: A Next.js (React) frontend that provides the user interface for scanning transactions and viewing history.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **OpenAI API Key** (for AI analysis features)

### 1. Backend Setup (`fraud-service`)

1.  Navigate to the directory:

    ```bash
    cd fraud-service
    ```

2.  Create and activate a virtual environment:

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

4.  Configure Environment:
    Create a `.env` file in the `fraud-service` directory:

    ```env
    OPENAI_API_KEY=sk-your-openai-key-here
    LOG_LEVEL=INFO
    DB_PATH=transactions.db
    ```

5.  Start the Server:
    ```bash
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```
    The API will be available at `http://localhost:8000`.

### 2. Frontend Setup (`frontend-service`)

1.  Navigate to the directory:

    ```bash
    cd frontend-service
    ```

2.  Install dependencies:

    ```bash
    npm install
    # or
    pnpm install
    ```

3.  Configure Environment:
    Create a `.env.local` file in the `frontend-service` directory:

    ```env
    NEXT_PUBLIC_FRAUD_URL=http://localhost:8000/api/v1
    ```

4.  Start the Development Server:
    ```bash
    npm run dev
    # or
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💡 How It Works

### Transaction Flow

1.  **Input**: User enters transaction details (Amount, From/To Account) in the provided UI.
2.  **Scan**: The frontend sends the data to `POST /api/v1/scan`.
3.  **Evaluate**:
    - **Fast Track**: If the transaction matches safe static rules or trusted history, it is approved immediately (low cost).
    - **AI Analysis**: If complex patterns are detected or the transaction is high-value, it invokes the AI agent (high cost).
4.  **Decision**:
    - `ALLOW`: Transaction proceeds.
    - `BLOCK`: Transaction is rejected.
    - `PENDING_REVIEW`: The AI is unsure or flags high risk. The transaction is held for manual review.
5.  **Review (If needed)**: A human reviewer approves or declines the transaction via the UI, providing a reason.

### History & Lookup

- Access the **History** page via the link on the home screen (`/transfer`).
- Enter an **Account ID** to see all incoming and outgoing transactions.
- View real-time summary statistics for **Total Sent** and **Total Received**.

## 📚 API Documentation

### Scan Transaction

`POST /api/v1/scan`

```json
{
  "transaction_id": "tx_123",
  "from_account": "ACC_A",
  "to_account": "ACC_B",
  "amount": 150.0,
  "device_id": "mobile-01"
}
```

### Transaction Lookup

`GET /api/v1/lookup/{account_id}`
Returns a list of all transactions associated with the account.

### Review Transaction

`POST /api/v1/review/{transaction_id}`
Used to approve or decline pending transactions.

---

Built with ❤️ using FastAPI, Next.js, and LangChain.
