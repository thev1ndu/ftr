SUSPICIOUS_DEVICE_KEYWORDS = ["kali", "parrot", "script", "bot", "emulator", "root", "jailbreak"]

def basic_rule_check(transaction):
    score = 0
    decision = "ALLOW"

    if transaction.amount <= 0:
        return "BLOCK", 100

    if transaction.amount > 200000:
        score += 80

    if transaction.from_account == transaction.to_account:
        score += 50
        
    # Check for suspicious device keywords
    device_lower = transaction.device_id.lower()
    for keyword in SUSPICIOUS_DEVICE_KEYWORDS:
        if keyword in device_lower:
            score += 90  # High risk score to trigger AI review
            
    if score > 70:
        decision = "REVIEW"

    return decision, score