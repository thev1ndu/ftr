from langchain.tools import tool
import random
import sqlite3
from datetime import datetime, timedelta
from app.core.config import get_settings

@tool
def get_recent_transaction_count(account_id: str, minutes: int = 10) -> int:
    """
    Check how many transactions a user has made in the last X minutes.
    Useful for detecting high-frequency transaction patterns (velocity checks).
    """
    try:
        settings = get_settings()
        db_path = settings.DB_PATH
        threshold_time = datetime.now() - timedelta(minutes=minutes)
        threshold_str = threshold_time.strftime("%Y-%m-%d %H:%M:%S")

        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM transactions
                WHERE from_account = ? AND timestamp IS NOT NULL AND timestamp >= ?
            """, (account_id, threshold_str))
            count = cursor.fetchone()[0]
            return count

    except Exception as e:
        return f"Error checking transaction count: {str(e)}"


def _check_beneficiary_history_logic(from_account: str, to_account: str) -> str:
    """Core logic for checking beneficiary history, decoupled from LangChain tool."""
    try:
        settings = get_settings()
        db_path = settings.DB_PATH
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) FROM transactions
                WHERE from_account = ? AND to_account = ?
            """, (from_account, to_account))
            count = cursor.fetchone()[0]

            if count > 0:
                return f"History Found: {count} previous transactions to {to_account}."
            else:
                return "No previous transactions found to this beneficiary. Logic: New Beneficiary Risk."

    except Exception as e:
        return f"Error checking beneficiary history: {str(e)}"

@tool
def check_beneficiary_history(from_account: str, to_account: str) -> str:
    """
    Check if the user has previously sent money to this beneficiary.
    Returns the number of past transactions to this beneficiary.
    Useful for detecting 'New Beneficiary' anomalies.
    """
    return _check_beneficiary_history_logic(from_account, to_account)

@tool
def fraud(transaction_details: str) -> str:
    """
    Perform deep fraud analysis on suspicious transaction.
    Analyze risk factors including geolocation, device fingerprint, and historical patterns.
    """
    # Mock analysis result
    risk_factors = [
        "Unusual location",
        "Device mismatch",
        "High velocity",
        "New beneficiary"
    ]
    
    # Simulate finding a risk factor occasionally
    found_risk = random.choice([True, False])
    
    if found_risk:
        factor = random.choice(risk_factors)
        return f"Deeper analysis found risk factor: {factor}. Recommend REVIEW."
    
    return "Deeper fraud heuristic analysis completed. No specific anomalies found in external databases."
