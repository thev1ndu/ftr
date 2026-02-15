# Enhanced suspicious keywords with higher precision
SUSPICIOUS_DEVICE_KEYWORDS = [
    "kali", "parrot os", "blackarch", "metasploit",
    "root", "jailbreak", "magisk", "cydia",
    "frida", "xposed", "emulator", "nox", "bluestacks"
]

# Anomaly / pattern thresholds
ROUND_AMOUNT_TOLERANCE = 0.01          # treat as round if within 0.01 of round number
UNUSUAL_HOUR_MIN_TX = 5                 # need at least this many tx in 7d to have a "typical" hour
STRUCTURING_MIN_TX = 3                  # structuring: this many tx to different beneficiaries in window
STRUCTURING_NEW_BENEFICIARY_BONUS = 15  # extra score when multiple new payees in window
OFF_HOURS_SCORE = 25                    # score for tx at unusual hour
ROUND_AMOUNT_SCORE = 20                # score when amount is suspiciously round (e.g. 5000, 10000)
RECURRING_BENEFICIARY_MIN = 3          # pattern: trusted if >= this many past tx to same payee

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


def _is_round_amount(amount: float, tolerance: float = ROUND_AMOUNT_TOLERANCE) -> bool:
    """True if amount is a round number (e.g. 1000, 5000, 10000) often seen in fraud."""
    if amount <= 0:
        return False
    for round_val in [100, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]:
        if abs(amount - round_val) <= tolerance or abs(amount - round_val) / max(round_val, 1) <= tolerance:
            return True
    # Check round thousands
    if abs(amount - round(amount, -3)) <= tolerance * max(amount, 1):
        return True
    return False


def detect_anomalies_and_patterns(transaction, stats: dict):
    """
    Detect anomalies, identify patterns (good) and anti-patterns (bad).
    stats should include: recent_count_10m, beneficiary_count, amount_stats_24h,
    unique_beneficiaries_10m, recent_tx_details_10m, hour_counts_7d.
    Returns (score_delta, anomalies[], patterns[], anti_patterns[]).
    """
    from datetime import datetime
    score_delta = 0
    anomalies = []
    patterns = []
    anti_patterns = []

    amount = transaction.amount
    beneficiary_count = stats.get("beneficiary_count", 0)
    recent_count = stats.get("recent_count_10m", 0)
    unique_beneficiaries_10m = stats.get("unique_beneficiaries_10m", 0)
    recent_details = stats.get("recent_tx_details_10m") or []
    amount_stats = stats.get("amount_stats_24h") or {}
    hour_counts = stats.get("hour_counts_7d") or {}
    avg_amount = amount_stats.get("avg_amount") or 0
    tx_count_24h = amount_stats.get("transaction_count") or 0

    # --- Anomalies ---
    # 1. Amount anomaly: far from user's recent average
    if tx_count_24h >= 2 and avg_amount > 0:
        ratio = amount / avg_amount if avg_amount else 0
        if ratio > 5 or (ratio < 0.2 and amount > 100):
            anomalies.append(
                f"Amount anomaly: ${amount:,.0f} is far from your recent 24h average (${avg_amount:,.0f})"
            )
            score_delta += 25

    # 2. Time anomaly: unusual hour (e.g. 00-05 UTC) vs user's typical activity
    total_7d = sum(hour_counts.values())
    current_hour_utc = datetime.utcnow().hour
    if total_7d >= UNUSUAL_HOUR_MIN_TX:
        typical_hours = [h for h, c in hour_counts.items() if c > 0]
        if typical_hours and current_hour_utc not in typical_hours:
            # Check if current hour is "off" (e.g. night) vs peak hours
            peak_hour = max(hour_counts, key=hour_counts.get)
            if abs(current_hour_utc - peak_hour) > 6:  # e.g. 2am vs 2pm
                anomalies.append(
                    f"Time anomaly: transaction at unusual hour (UTC {current_hour_utc}:00) vs your typical activity"
                )
                score_delta += OFF_HOURS_SCORE

    # 3. Round-amount anomaly (common in fraud)
    if amount >= 500 and _is_round_amount(amount):
        anomalies.append(f"Round amount: ${amount:,.0f} (round numbers are more common in fraud)")
        score_delta += ROUND_AMOUNT_SCORE

    # --- Patterns (good / neutral) ---
    if beneficiary_count >= RECURRING_BENEFICIARY_MIN:
        patterns.append(f"Recurring beneficiary: {beneficiary_count} past transactions to this payee (trusted pattern)")
    if tx_count_24h >= 2 and avg_amount > 0 and 0.5 <= amount / avg_amount <= 2.0:
        patterns.append("Amount consistent with your recent 24h behavior")

    # --- Anti-patterns (bad) ---
    # 1. Structuring: many tx to different (often new) beneficiaries in short window
    if unique_beneficiaries_10m >= STRUCTURING_MIN_TX and recent_count >= STRUCTURING_MIN_TX:
        anti_patterns.append(
            f"Structuring: {recent_count} transactions to {unique_beneficiaries_10m} different beneficiaries in 10 minutes"
        )
        score_delta += 40
    if beneficiary_count == 0 and unique_beneficiaries_10m >= 2:
        anti_patterns.append("Multiple new beneficiaries in short window")
        score_delta += STRUCTURING_NEW_BENEFICIARY_BONUS

    # 2. Round amounts only in recent burst
    if recent_details and amount >= 500 and _is_round_amount(amount):
        round_recent = sum(1 for r in recent_details if _is_round_amount(float(r.get("amount") or 0)))
        if round_recent >= 2:
            anti_patterns.append("Multiple round-amount transactions in short window (smurfing pattern)")
            score_delta += 15

    # 3. Burst then large: several small/medium then one large to new beneficiary (already partly in pattern_check)
    if beneficiary_count == 0 and recent_count >= 2 and amount > (avg_amount * 2 if avg_amount else 5000):
        anti_patterns.append("Large transfer to new beneficiary after recent burst of activity")
        score_delta += 20

    return score_delta, anomalies, patterns, anti_patterns


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
