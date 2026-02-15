
import sqlite3
import json
from datetime import datetime
from app.core.config import get_settings
from app.models.transaction import Transaction

class TransactionHistory:
    def __init__(self):
        settings = get_settings()
        self.db_path = settings.DB_PATH
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    transaction_id TEXT PRIMARY KEY,
                    from_account TEXT NOT NULL,
                    to_account TEXT NOT NULL,
                    amount REAL,
                    timestamp DATETIME,
                    decision TEXT,
                    risk_score REAL,
                    reason TEXT
                )
            """)
            conn.commit()

    def log_transaction(self, transaction: Transaction, result: dict):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO transactions 
                (transaction_id, from_account, to_account, amount, timestamp, decision, risk_score, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                transaction.transaction_id,
                transaction.from_account,
                transaction.to_account,
                transaction.amount,
                transaction.timestamp,
                result.get("decision"),
                result.get("score"),
                result.get("reason")
            ))
            conn.commit()

    def get_account_history(self, account_id: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM transactions
                WHERE from_account = ? OR to_account = ?
                ORDER BY timestamp DESC
                LIMIT 50
            """, (account_id, account_id))
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

history_service = TransactionHistory()
