"""
Account types and per-account limits. Enforced in middleware before any transaction
reaches the fraud engine so limits cannot be bypassed by manipulating amount or flow.
"""
import sqlite3
from app.core.config import get_settings

# Account type limits: single transaction max and daily total max (USD)
ACCOUNT_TYPE_LIMITS = {
    "SAVINGS": {"single_tx_limit": 5_000.0, "daily_limit": 10_000.0},
    "CHECKING": {"single_tx_limit": 25_000.0, "daily_limit": 50_000.0},
    "PREMIUM": {"single_tx_limit": 100_000.0, "daily_limit": 250_000.0},
}

# Default for unknown accounts: most restrictive so we never accidentally allow over limit
DEFAULT_ACCOUNT_TYPE = "SAVINGS"

# OTP required for single transaction above this amount (USD)
OTP_REQUIRED_AMOUNT_THRESHOLD = 100.0


def _get_db_path():
    return get_settings().DB_PATH


def _init_accounts_table(conn: sqlite3.Connection):
    conn.execute("""
        CREATE TABLE IF NOT EXISTS account_types (
            account_id TEXT PRIMARY KEY,
            account_type TEXT NOT NULL CHECK(account_type IN ('SAVINGS', 'CHECKING', 'PREMIUM'))
        )
    """)
    conn.commit()


def get_account_type(account_id: str) -> str:
    """Return account type for account_id. Defaults to SAVINGS if unknown."""
    path = _get_db_path()
    with sqlite3.connect(path) as conn:
        _init_accounts_table(conn)
        row = conn.execute(
            "SELECT account_type FROM account_types WHERE account_id = ?",
            (account_id,),
        ).fetchone()
    if row:
        return row[0] if row[0] in ACCOUNT_TYPE_LIMITS else DEFAULT_ACCOUNT_TYPE
    return DEFAULT_ACCOUNT_TYPE


def set_account_type(account_id: str, account_type: str) -> None:
    if account_type not in ACCOUNT_TYPE_LIMITS:
        raise ValueError(f"Invalid account_type: {account_type}")
    path = _get_db_path()
    with sqlite3.connect(path) as conn:
        _init_accounts_table(conn)
        conn.execute(
            "INSERT OR REPLACE INTO account_types (account_id, account_type) VALUES (?, ?)",
            (account_id, account_type),
        )
        conn.commit()


def get_limits_for_account(account_id: str) -> dict:
    """Return { account_type, single_tx_limit, daily_limit } for the account."""
    atype = get_account_type(account_id)
    limits = ACCOUNT_TYPE_LIMITS[atype].copy()
    limits["account_type"] = atype
    return limits
