"""
Engine config: single-row table storing all fraud engine thresholds.
Fetch all columns (one row) or a single column by key.
"""
import sqlite3
from app.core.config import get_settings

CONFIG_ROW_ID = 1

# Default values (match engine.py); column names are snake_case
DEFAULTS = {
    "round_amount_tolerance": 0.01,
    "unusual_hour_min_tx": 5,
    "structuring_min_tx": 3,
    "structuring_new_beneficiary_bonus": 15,
    "off_hours_score": 25,
    "round_amount_score": 20,
    "recurring_beneficiary_min": 3,
    "velocity_block_threshold": 10,
    "velocity_review_threshold": 5,
    "velocity_warn_threshold": 3,
    "new_beneficiary_high_amount": 10_000.0,
    "new_beneficiary_med_amount": 5_000.0,
    "new_beneficiary_low_amount": 1_000.0,
    "amount_spike_multiplier_avg": 3.0,
    "amount_spike_multiplier_max": 2.0,
    "min_transactions_for_avg": 2,
}

# Types for validation: int vs float
INT_KEYS = {
    "unusual_hour_min_tx", "structuring_min_tx", "structuring_new_beneficiary_bonus",
    "off_hours_score", "round_amount_score", "recurring_beneficiary_min",
    "velocity_block_threshold", "velocity_review_threshold", "velocity_warn_threshold",
    "min_transactions_for_avg",
}


def _get_db_path():
    return get_settings().DB_PATH


def _init_table(conn: sqlite3.Connection):
    cols = ["id INTEGER PRIMARY KEY"]
    for k in DEFAULTS:
        v = DEFAULTS[k]
        cols.append(f'"{k}" REAL' if isinstance(v, float) else f'"{k}" INTEGER')
    conn.execute(
        f"CREATE TABLE IF NOT EXISTS engine_config ({', '.join(cols)})"
    )
    cur = conn.execute("SELECT 1 FROM engine_config WHERE id = ?", (CONFIG_ROW_ID,))
    if cur.fetchone() is None:
        conn.execute(
            "INSERT INTO engine_config (id, " + ", ".join(f'"{k}"' for k in DEFAULTS) + ") VALUES (" +
            str(CONFIG_ROW_ID) + ", " + ", ".join(str(DEFAULTS[k]) for k in DEFAULTS) + ")"
        )
    conn.commit()


def get_all() -> dict:
    """Fetch the single config row as a dict (all columns)."""
    path = _get_db_path()
    with sqlite3.connect(path) as conn:
        _init_table(conn)
        conn.row_factory = sqlite3.Row
        cur = conn.execute("SELECT * FROM engine_config WHERE id = ?", (CONFIG_ROW_ID,))
        row = cur.fetchone()
    if not row:
        return dict(DEFAULTS)
    out = {}
    for key in row.keys():
        if key == "id":
            continue
        val = row[key]
        if val is not None:
            out[key] = int(val) if key in INT_KEYS else float(val)
        else:
            out[key] = DEFAULTS.get(key, 0)
    return out


def get(key: str):
    """Fetch a single column value by key. Returns default if missing."""
    all_rows = get_all()
    return all_rows.get(key, DEFAULTS.get(key))


def update(updates: dict) -> dict:
    """Update one or more columns and return the full row."""
    allowed = set(DEFAULTS.keys())
    for k in updates:
        if k not in allowed:
            raise ValueError(f"Unknown config key: {k}")
    path = _get_db_path()
    with sqlite3.connect(path) as conn:
        _init_table(conn)
        for k, v in updates.items():
            conn.execute(f'UPDATE engine_config SET "{k}" = ? WHERE id = ?', (v, CONFIG_ROW_ID))
        conn.commit()
    return get_all()
