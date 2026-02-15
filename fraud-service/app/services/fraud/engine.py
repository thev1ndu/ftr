from typing import Optional

# Enhanced suspicious keywords with higher precision
SUSPICIOUS_DEVICE_KEYWORDS = [
    "kali", "parrot os", "blackarch", "metasploit",
    "root", "jailbreak", "magisk", "cydia",
    "frida", "xposed", "emulator", "nox", "bluestacks"
]

from app.services.fraud.config_store import get_all as _get_engine_config


def pattern_check(transaction, stats: dict):
    """
    Real-world pattern checks: velocity (spam), new beneficiary, amount spike.
    stats: dict with keys recent_count_10m, beneficiary_count, amount_stats_24h
    (amount_stats_24h: { avg_amount, max_amount, transaction_count }).
    Returns (decision, score, reasons).
    """
    cfg = _get_engine_config()
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

    v_block = int(cfg.get("velocity_block_threshold", 10))
    v_review = int(cfg.get("velocity_review_threshold", 5))
    v_warn = int(cfg.get("velocity_warn_threshold", 3))
    new_high = float(cfg.get("new_beneficiary_high_amount", 10_000))
    new_med = float(cfg.get("new_beneficiary_med_amount", 5_000))
    new_low = float(cfg.get("new_beneficiary_low_amount", 1_000))
    spike_avg = float(cfg.get("amount_spike_multiplier_avg", 3.0))
    spike_max = float(cfg.get("amount_spike_multiplier_max", 2.0))
    min_tx_avg = int(cfg.get("min_transactions_for_avg", 2))

    # 1. Velocity / spam: too many transactions in short window
    if recent_count >= v_block:
        score += 85
        reasons.append(f"High velocity: {recent_count} transactions in last 10 minutes (possible spam/bot)")
        decision = "BLOCK"
    elif recent_count >= v_review:
        score += 40
        reasons.append(f"Elevated velocity: {recent_count} transactions in last 10 minutes")
        if decision != "BLOCK":
            decision = "REVIEW"
    elif recent_count >= v_warn:
        score += 20
        reasons.append(f"Unusual frequency: {recent_count} transactions in last 10 minutes")

    # 2. New beneficiary + high amount (first-time large transfer)
    if beneficiary_count == 0:
        if amount > new_high:
            score += 50
            reasons.append(f"New beneficiary + high amount (${amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        elif amount > new_med:
            score += 35
            reasons.append(f"New beneficiary + medium amount (${amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        elif amount > new_low:
            score += 25
            reasons.append("New beneficiary + amount above $1,000")

    # 3. Amount spike vs user's recent behavior
    if tx_count_24h >= min_tx_avg and avg_amount > 0:
        if amount > spike_avg * avg_amount:
            score += 30
            reasons.append(f"Amount spike: ${amount:,.0f} is >3x recent avg (${avg_amount:,.0f})")
            if decision != "BLOCK":
                decision = "REVIEW"
        if max_amount > 0 and amount > spike_max * max_amount:
            score += 25
            reasons.append(f"Amount above recent max: ${amount:,.0f} vs 24h max ${max_amount:,.0f}")

    if decision != "BLOCK" and score >= 80:
        decision = "BLOCK"
    elif decision != "BLOCK" and score >= 50:
        decision = "REVIEW"

    return decision, min(score, 100), reasons


def _is_round_amount(amount: float, tolerance: Optional[float] = None) -> bool:
    """True if amount is a round number (e.g. 1000, 5000, 10000) often seen in fraud."""
    if tolerance is None:
        tolerance = float(_get_engine_config().get("round_amount_tolerance", 0.01))
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
    cfg = _get_engine_config()
    unusual_hour_min = int(cfg.get("unusual_hour_min_tx", 5))
    off_hours_score = int(cfg.get("off_hours_score", 25))
    round_score = int(cfg.get("round_amount_score", 20))
    recurring_min = int(cfg.get("recurring_beneficiary_min", 3))
    struct_min = int(cfg.get("structuring_min_tx", 3))
    struct_bonus = int(cfg.get("structuring_new_beneficiary_bonus", 15))
    tolerance = float(cfg.get("round_amount_tolerance", 0.01))

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
    if tx_count_24h >= 2 and avg_amount > 0:
        ratio = amount / avg_amount if avg_amount else 0
        if ratio > 5 or (ratio < 0.2 and amount > 100):
            anomalies.append(
                f"Amount anomaly: ${amount:,.0f} is far from your recent 24h average (${avg_amount:,.0f})"
            )
            score_delta += 25

    total_7d = sum(hour_counts.values())
    current_hour_utc = datetime.utcnow().hour
    if total_7d >= unusual_hour_min:
        typical_hours = [h for h, c in hour_counts.items() if c > 0]
        if typical_hours and current_hour_utc not in typical_hours:
            peak_hour = max(hour_counts, key=hour_counts.get)
            if abs(current_hour_utc - peak_hour) > 6:
                anomalies.append(
                    f"Time anomaly: transaction at unusual hour (UTC {current_hour_utc}:00) vs your typical activity"
                )
                score_delta += off_hours_score

    if amount >= 500 and _is_round_amount(amount, tolerance):
        anomalies.append(f"Round amount: ${amount:,.0f} (round numbers are more common in fraud)")
        score_delta += round_score

    # --- Patterns (good / neutral) ---
    if beneficiary_count >= recurring_min:
        patterns.append(f"Recurring beneficiary: {beneficiary_count} past transactions to this payee (trusted pattern)")
    if tx_count_24h >= 2 and avg_amount > 0 and 0.5 <= amount / avg_amount <= 2.0:
        patterns.append("Amount consistent with your recent 24h behavior")

    # --- Anti-patterns (bad) ---
    if unique_beneficiaries_10m >= struct_min and recent_count >= struct_min:
        anti_patterns.append(
            f"Structuring: {recent_count} transactions to {unique_beneficiaries_10m} different beneficiaries in 10 minutes"
        )
        score_delta += 40
    if beneficiary_count == 0 and unique_beneficiaries_10m >= 2:
        anti_patterns.append("Multiple new beneficiaries in short window")
        score_delta += struct_bonus

    if recent_details and amount >= 500 and _is_round_amount(amount, tolerance):
        round_recent = sum(1 for r in recent_details if _is_round_amount(float(r.get("amount") or 0), tolerance))
        if round_recent >= 2:
            anti_patterns.append("Multiple round-amount transactions in short window (smurfing pattern)")
            score_delta += 15

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
