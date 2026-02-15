from langchain.tools import tool
import random
import sqlite3
from datetime import datetime, timedelta

@tool
def get_recent_transaction_count(account_id: str, minutes: int = 10) -> int:
    """
    Check how many transactions a user has made in the last X minutes.
    Useful for detecting high-frequency transaction patterns (velocity checks).
    """
    try:
        db_path = "fraud_memory.db"
        # Calculate the timestamp threshold
        threshold_time = datetime.now() - timedelta(minutes=minutes)
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            # We look for messages in chat_history where role='user' and session_id=account_id
            # and timestamp > threshold.
            # Note: This assumes 'user' messages in chat_history are transactions.
            # If the agent is used for other things, we might need filtering.
            # For this app, main usage is transaction processing.
            
            cursor.execute("""
                SELECT COUNT(*) FROM chat_history 
                WHERE session_id = ? 
                AND role = 'user' 
                AND timestamp >= ?
            """, (account_id, threshold_time))
            
            count = cursor.fetchone()[0]
            return count
            
    except Exception as e:
        return f"Error checking transaction count: {str(e)}"
def fraud(transaction_details: str) -> str:
    """
    Perform deep fraud analysis on suspicious transaction.
    Analyze risk factors including geolocation, device fingerprint, and historical patterns.
    """
    # In a real system, this would query external services:
    # - Blacklist check
    # - Geo-location verification
    # - Device fingerprint analysis
    # - Historical pattern comparison
    
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