from langchain.tools import tool
import random

@tool
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