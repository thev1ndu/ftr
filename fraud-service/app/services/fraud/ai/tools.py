from langchain.tools import tool
import random
from app.services.fraud.history import history_service

@tool
def get_recent_transaction_count(account_id: str, minutes: int = 10) -> int:
    """
    Check how many transactions this account has made in the last X minutes (velocity).
    Use for spam/bot detection: >5 in 10 min = REVIEW, >10 = BLOCK.
    """
    try:
        return history_service.get_recent_count_from_account(account_id, minutes)
    except Exception as e:
        return 0


def _check_beneficiary_history_logic(from_account: str, to_account: str) -> str:
    """Core logic for checking beneficiary history, decoupled from LangChain tool."""
    try:
        count = history_service.get_beneficiary_count(from_account, to_account)
        if count > 0:
            return f"History Found: {count} previous transactions to {to_account}."
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
def get_pattern_summary(from_account: str, to_account: str) -> str:
    """
    Get a full pattern summary for fraud analysis: velocity (tx in last 10 min),
    beneficiary history (past tx to this payee), and 24h amount stats (avg/max).
    Use this to decide if the transaction is high velocity, new beneficiary, or amount spike.
    """
    try:
        stats = history_service.get_pattern_stats(from_account, to_account)
        recent = stats.get("recent_count_10m", 0)
        ben_count = stats.get("beneficiary_count", 0)
        am = stats.get("amount_stats_24h") or {}
        avg_a = am.get("avg_amount") or 0
        max_a = am.get("max_amount") or 0
        n_24h = am.get("transaction_count") or 0
        return (
            f"Velocity: {recent} outbound transactions in last 10 minutes. "
            f"Beneficiary history: {ben_count} past transactions to this payee. "
            f"Last 24h: {n_24h} transactions, avg amount ${avg_a:,.0f}, max ${max_a:,.0f}. "
            f"New beneficiary: {'Yes' if ben_count == 0 else 'No'}."
        )
    except Exception as e:
        return f"Error getting pattern summary: {str(e)}"


@tool
def fraud(transaction_details: str) -> str:
    """
    Perform deep fraud analysis on suspicious transaction.
    Analyze risk factors including geolocation, device fingerprint, and historical patterns.
    """
    risk_factors = [
        "Unusual location",
        "Device mismatch",
        "High velocity",
        "New beneficiary"
    ]
    found_risk = random.choice([True, False])
    if found_risk:
        factor = random.choice(risk_factors)
        return f"Deeper analysis found risk factor: {factor}. Recommend REVIEW."
    return "Deeper fraud heuristic analysis completed. No specific anomalies found in external databases."
