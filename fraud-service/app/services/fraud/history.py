
import sqlite3
import json
from datetime import datetime, timedelta
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
        # Use server time for timestamp so velocity "last N minutes" uses a single clock
        logged_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
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
                logged_at,
                result.get("decision"),
                result.get("score"),
                result.get("reason")
            ))
            conn.commit()

    def update_transaction_decision(self, transaction_id: str, decision: str, risk_score: float, reason: str):
        """Update decision/score/reason for an existing transaction (e.g. after human review)."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE transactions
                SET decision = ?, risk_score = ?, reason = ?
                WHERE transaction_id = ?
            """, (decision, risk_score, reason, transaction_id))
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

    # --- Pattern analytics for real-world fraud detection ---

    def get_recent_count_from_account(self, from_account: str, minutes: int = 10) -> int:
        """Number of outbound transactions in the last N minutes (velocity)."""
        # Use UTC to match logged_at from log_transaction
        threshold = (datetime.utcnow() - timedelta(minutes=minutes)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ?
            """, (from_account, threshold))
            return cursor.fetchone()[0] or 0

    def get_beneficiary_count(self, from_account: str, to_account: str) -> int:
        """Number of past transactions from this sender to this beneficiary."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM transactions
                WHERE from_account = ? AND to_account = ?
            """, (from_account, to_account))
            return cursor.fetchone()[0] or 0

    def get_recent_amounts_from_account(
        self, from_account: str, minutes: int = 10, max_rows: int = 100
    ) -> list[float]:
        """Recent outbound amounts for velocity and amount-spike analysis."""
        threshold = (datetime.utcnow() - timedelta(minutes=minutes)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT amount FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ? AND amount > 0
                ORDER BY timestamp DESC
                LIMIT ?
            """, (from_account, threshold, max_rows))
            return [row[0] for row in cursor.fetchall()]

    def get_daily_outbound_total(self, from_account: str) -> float:
        """Total amount sent from this account in the last 24 hours (for limit enforcement)."""
        threshold = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COALESCE(SUM(amount), 0) FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ? AND amount > 0
            """, (from_account, threshold))
            return float(cursor.fetchone()[0] or 0)

    def get_amount_stats_last_hours(self, from_account: str, hours: int = 24) -> dict:
        """Average and max outbound amount in the last N hours for spike detection."""
        threshold = (datetime.utcnow() - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT AVG(amount), MAX(amount), COUNT(*) FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ? AND amount > 0
            """, (from_account, threshold))
            row = cursor.fetchone()
        avg_a, max_a, cnt = row[0], row[1], row[2]
        return {
            "avg_amount": float(avg_a) if avg_a is not None else 0,
            "max_amount": float(max_a) if max_a is not None else 0,
            "transaction_count": cnt or 0,
        }

    def get_pattern_stats(
        self,
        from_account: str,
        to_account: str,
        velocity_minutes: int = 10,
        amount_hours: int = 24,
    ) -> dict:
        """Single call for all stats used by pattern-based fraud rules."""
        return {
            "recent_count_10m": self.get_recent_count_from_account(from_account, velocity_minutes),
            "beneficiary_count": self.get_beneficiary_count(from_account, to_account),
            "amount_stats_24h": self.get_amount_stats_last_hours(from_account, amount_hours),
        }

    # --- Anomaly & pattern analytics ---

    def get_unique_beneficiaries_in_window(self, from_account: str, minutes: int = 10) -> int:
        """Count of distinct to_account in last N minutes (structuring detection)."""
        threshold = (datetime.utcnow() - timedelta(minutes=minutes)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(DISTINCT to_account) FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ?
            """, (from_account, threshold))
            return cursor.fetchone()[0] or 0

    def get_recent_tx_details(
        self, from_account: str, minutes: int = 10, limit: int = 50
    ) -> list[dict]:
        """Recent outbound tx with amount and to_account for pattern analysis."""
        threshold = (datetime.utcnow() - timedelta(minutes=minutes)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT amount, to_account, timestamp FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (from_account, threshold, limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_hour_counts_last_7d(self, from_account: str) -> dict[int, int]:
        """Hour-of-day (0-23 UTC) -> count of tx in last 7 days. For unusual-time detection."""
        threshold = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT substr(timestamp, 12, 2) AS hour_str FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ?
            """, (from_account, threshold))
            rows = cursor.fetchall()
        counts: dict[int, int] = {h: 0 for h in range(24)}
        for (hour_str,) in rows:
            try:
                h = int(hour_str)
                if 0 <= h <= 23:
                    counts[h] = counts.get(h, 0) + 1
            except (ValueError, TypeError):
                pass
        return counts

    def get_anomaly_stats(
        self,
        from_account: str,
        to_account: str,
        velocity_minutes: int = 10,
        amount_hours: int = 24,
    ) -> dict:
        """Stats for anomaly and pattern/anti-pattern detection."""
        stats = self.get_pattern_stats(from_account, to_account, velocity_minutes, amount_hours)
        stats["unique_beneficiaries_10m"] = self.get_unique_beneficiaries_in_window(
            from_account, velocity_minutes
        )
        stats["recent_tx_details_10m"] = self.get_recent_tx_details(
            from_account, velocity_minutes
        )
        stats["hour_counts_7d"] = self.get_hour_counts_last_7d(from_account)
        return stats

    def get_account_indicators_stats(self, account_id: str) -> dict:
        """Account-level stats for indicators/risk profile (no specific beneficiary)."""
        recent_10m = self.get_recent_count_from_account(account_id, 10)
        daily_used = self.get_daily_outbound_total(account_id)
        amount_stats = self.get_amount_stats_last_hours(account_id, 24)
        unique_ben_10m = self.get_unique_beneficiaries_in_window(account_id, 10)
        hour_counts = self.get_hour_counts_last_7d(account_id)
        history = self.get_account_history(account_id)
        return {
            "recent_count_10m": recent_10m,
            "daily_used_24h": daily_used,
            "amount_stats_24h": amount_stats,
            "unique_beneficiaries_10m": unique_ben_10m,
            "hour_counts_7d": hour_counts,
            "history_count": len(history),
            "history_sample": history[:10],
        }


history_service = TransactionHistory()
