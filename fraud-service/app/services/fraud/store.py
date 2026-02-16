"""
Engine config: reads from hardcoded cfg.py. No database or API updates.
"""
from app.services.fraud.cfg import ENGINE_CONFIG

# Keys that are integers (for type consistency if needed)
INT_KEYS = {
    "unusual_hour_min_tx", "structuring_min_tx", "structuring_new_beneficiary_bonus",
    "off_hours_score", "round_amount_score", "recurring_beneficiary_min",
    "velocity_block_threshold", "velocity_review_threshold", "velocity_warn_threshold",
    "min_transactions_for_avg",
}


def get_all() -> dict:
    """Return the full engine config (from cfg.py)."""
    return dict(ENGINE_CONFIG)


def get(key: str):
    """Return a single config value by key."""
    return ENGINE_CONFIG.get(key)
