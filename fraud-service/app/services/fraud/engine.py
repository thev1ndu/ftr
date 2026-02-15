# Enhanced suspicious keywords with higher precision
SUSPICIOUS_DEVICE_KEYWORDS = [
    "kali", "parrot os", "blackarch", "metasploit", 
    "root", "jailbreak", "magisk", "cydia", 
    "frida", "xposed", "emulator", "nox", "bluestacks"
]

def basic_rule_check(transaction):
    score = 0
    decision = "ALLOW"
    reasons = []

    # 1. Amount Validation
    if transaction.amount <= 0:
        return "BLOCK", 100
    
    # 2. High Value Transaction Check
    if transaction.amount > 50000:
        score += 40
        reasons.append("High Transfer Amount")
    
    if transaction.amount > 200000:
        score += 50 # Cumulative score will be 90
        reasons.append("Very High Transfer Amount")

    # 3. Self-Transfer Check
    if transaction.from_account == transaction.to_account:
        score += 30
        reasons.append("Self-Transfer")
        
    # 4. Suspicious Device Check
    device_lower = transaction.device_id.lower()
    
    # Check for known legitimate browsers first to reduce false positives
    is_browser = any(b in device_lower for b in ["chrome", "safari", "firefox", "edge", "opera"])
    
    for keyword in SUSPICIOUS_DEVICE_KEYWORDS:
        if keyword in device_lower:
            # If it looks like a browser but contains a keyword (e.g. "root" in a path), give benefit of doubt or lower score
            if is_browser and keyword in ["root", "admin"]:
                score += 10
            elif keyword in ["emulator", "nox", "bluestacks"]:
                # Emulators are suspicious but possibly just devs/gamers
                score += 30
                reasons.append(f"Emulator Detected: {keyword}")
            else:
                # Strong indicators (Kali, Metasploit, Frida)
                score += 90
                reasons.append(f"High Risk Security Tool: {keyword}")

    # Decision Logic
    if score >= 80:
        decision = "BLOCK"
    elif score >= 50:
        decision = "REVIEW"

    # print(f"Rule Check: {decision} ({score}) - {reasons}")
    return decision, score
