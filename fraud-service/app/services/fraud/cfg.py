"""
Edit this file to change fraud detection thresholds.
All values here are the single source of truth; no database or API updates.
"""

# ---------------------------------------------------------------------------
# Velocity (transactions in last 10 minutes)
# ---------------------------------------------------------------------------
velocity_block_threshold: int = 10   # Block when count >= this
velocity_review_threshold: int = 5   # Review when count >= this
velocity_warn_threshold: int = 3     # Warn when count >= this

# ---------------------------------------------------------------------------
# New beneficiary amount tiers (first-time transfer to a beneficiary)
# ---------------------------------------------------------------------------
new_beneficiary_high_amount: float = 10_000.0   # $ above this = high risk
new_beneficiary_med_amount: float = 5_000.0    # $ above this = medium risk
new_beneficiary_low_amount: float = 1_000.0    # $ above this = low risk

# ---------------------------------------------------------------------------
# Amount spike (vs user's recent 24h behavior)
# ---------------------------------------------------------------------------
amount_spike_multiplier_avg: float = 3.0   # Flag when amount > avg * this
amount_spike_multiplier_max: float = 2.0   # Flag when amount > max * this
min_transactions_for_avg: int = 2          # Min tx in 24h to compute avg/max

# ---------------------------------------------------------------------------
# Round amount (exact dollar amounts)
# ---------------------------------------------------------------------------
round_amount_tolerance: float = 0.01   # Treat as round if within this of whole $
round_amount_score: int = 20           # Risk score for round amount

# ---------------------------------------------------------------------------
# Unusual hour (off-hours activity)
# ---------------------------------------------------------------------------
unusual_hour_min_tx: int = 5   # Min tx in 7d to detect "typical" hour
off_hours_score: int = 25      # Risk score for off-hours

# ---------------------------------------------------------------------------
# Structuring (splitting to avoid detection)
# ---------------------------------------------------------------------------
structuring_min_tx: int = 3                    # Min tx/beneficiaries to consider
structuring_new_beneficiary_bonus: int = 15   # Extra score for new beneficiary

# ---------------------------------------------------------------------------
# Recurring / trusted beneficiary
# ---------------------------------------------------------------------------
recurring_beneficiary_min: int = 3   # Min past tx to treat as trusted

# ---------------------------------------------------------------------------
# Single dict for store / API (do not edit below)
# ---------------------------------------------------------------------------
ENGINE_CONFIG: dict = {
    "round_amount_tolerance": round_amount_tolerance,
    "unusual_hour_min_tx": unusual_hour_min_tx,
    "structuring_min_tx": structuring_min_tx,
    "structuring_new_beneficiary_bonus": structuring_new_beneficiary_bonus,
    "off_hours_score": off_hours_score,
    "round_amount_score": round_amount_score,
    "recurring_beneficiary_min": recurring_beneficiary_min,
    "velocity_block_threshold": velocity_block_threshold,
    "velocity_review_threshold": velocity_review_threshold,
    "velocity_warn_threshold": velocity_warn_threshold,
    "new_beneficiary_high_amount": new_beneficiary_high_amount,
    "new_beneficiary_med_amount": new_beneficiary_med_amount,
    "new_beneficiary_low_amount": new_beneficiary_low_amount,
    "amount_spike_multiplier_avg": amount_spike_multiplier_avg,
    "amount_spike_multiplier_max": amount_spike_multiplier_max,
    "min_transactions_for_avg": min_transactions_for_avg,
}
