# Enhanced suspicious keywords with higher precision
SUSPICIOUS_DEVICE_KEYWORDS = [
    "kali", "parrot os", "blackarch", "metasploit",
    "root", "jailbreak", "magisk", "cydia",
    "frida", "xposed", "emulator", "nox", "bluestacks"
]

# Pattern-based thresholds (real-world style)
VELOCITY_BLOCK_THRESHOLD = 10   # transactions in window -> BLOCK (spam/bot)
VELOCITY_REVIEW_THRESHOLD = 5  # -> REVIEW
VELOCITY_WARN_THRESHOLD = 3    # -> small score bump
NEW_BENEFICIARY_HIGH_AMOUNT = 10_000  # first-time + amount > this -> high risk
NEW_BENEFICIARY_MED_AMOUNT = 5_000
NEW_BENEFICIARY_LOW_AMOUNT = 1_000
AMOUNT_SPIKE_MULTIPLIER_AVG = 3.0   # current > 3x recent avg -> spike
AMOUNT_SPIKE_MULTIPLIER_MAX = 2.0   # current > 2x recent max -> spike
MIN_TRANSACTIONS_FOR_AVG = 2        # need at least this many to use avg/max


def pattern_check(transaction, stats: dict):
    """
    Real-world pattern checks: velocity (spam), new beneficiary, amount spike.
    stats: dict with keys recent_count_10m, beneficiary_count, amount_stats_24h
    (amount_stats_24h: { avg_amount, max_amount, transaction_count }).
    Returns (decision, score, reasons).
    """
    score = 0
    decision = "ALLOW"
    reasons = []

    recent_count = stats.get("recent_count_10m", 0)
    beneficiary_count = stats.get("beneficiary_count", 0)
    amount_stats = stats.get("amount_stats_24h") or {}
    avg_amount = amount_stats.get("avg_amount") or 0
    max_amount = amount_stats.get("max_amount") or 0
    tx_count_24h = amount_stats.get("transaction_count") or 0
    amount = transaction.amount

    # 1. Velocity / spam: too many transactions in short window
    if recent_count >= VELOCITY_BLOCK_THRESHOLD:
        score += 85
        reasons.append(f"High velocity: {recent_count} transactions in last 10 minutes (possible spam/bot)")
        decision = "BLOCK"
    elif recent_count >= VELOCITY_REVIEW_THRESHOLD:
        score += 40
        reasons.append(f"Elevated velocity: {recent_count} transactions in last 10 minutes")
        if decision != "BLOCK":
            decision = "REVIEW"
    elif recent_count >= VELOCITY_WARN_THRESHOLD:
        score += 20
        reasons.append(f"Unusual frequency: {recent_count} transactions in last 10 minutes")

    # 2. New beneficiary + high amount (first-time large transfer)
    if beneficiary_count == 0:
        if amount > NEW_BENEFICIARY_HIGH_AMOUNT:
            score += 50
            reasons.append(f"New beneficiary + high amount (${amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        elif amount > NEW_BENEFICIARY_MED_AMOUNT:
            score += 35
            reasons.append(f"New beneficiary + medium amount (${amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        elif amount > NEW_BENEFICIARY_LOW_AMOUNT:
            score += 25
            reasons.append("New beneficiary + amount above $1,000")

    # 3. Amount spike vs user's recent behavior
    if tx_count_24h >= MIN_TRANSACTIONS_FOR_AVG and avg_amount > 0:
        if amount > AMOUNT_SPIKE_MULTIPLIER_AVG * avg_amount:
            score += 30
            reasons.append(f"Amount spike: ${amount:,.0f} is >3x recent avg (${avg_amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        if max_amount > 0 and amount > AMOUNT_SPIKE_MULTIPLIER_MAX * max_amount:
            score += 25
            reasons.append(f"Amount above recent max: ${amount:,.0f} vs 24h max ${max_amount:,.0f}")

    if decision != "BLOCK" and score >= 80:
        decision = "BLOCK"
    elif decision != "BLOCK" and score >= 50:
        decision = "REVIEW"

    return decision, min(score, 100), reasons


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
