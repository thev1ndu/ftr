"""
LangChain agent that analyzes an account's limits, triggers, patterns, and risk.
Returns structured indicators for the lookup UI.
"""
import json
import logging
from app.services.fraud.history import history_service
from app.services.fraud.store import get_all as get_engine_config
from app.services.transaction_middleware.account_limits import (
    get_limits_for_account,
    ACCOUNT_TYPE_LIMITS,
    OTP_REQUIRED_AMOUNT_THRESHOLD,
)
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from app.core.config import get_settings

logger = logging.getLogger(__name__)

INDICATORS_SYSTEM_PROMPT = """You are a fraud and risk analyst. Given raw data about an account's limits, engine thresholds (triggers), and current activity stats, you must produce a structured JSON response.

Output ONLY valid JSON with these exact keys (no markdown, no code fence):
- "limits": object with keys "account_type", "single_tx_limit", "daily_limit", "daily_used", "daily_remaining", "otp_required_above". Include a short "limits_explanation" string (1-2 sentences) explaining how limits work for this account type.
- "triggers_how_they_work": string (2-4 sentences) explaining how the fraud engine triggers work: velocity (tx in 10 min), new beneficiary amounts, amount spike vs avg/max, round amounts, off-hours, structuring. Reference the threshold numbers provided.
- "indicators": array of objects, each with "name", "current_value", "threshold_or_note", "status" ("ok" | "warning" | "risk"). Cover: velocity (tx in 10m), daily usage, new beneficiary risk tiers, amount spike thresholds, structuring (unique beneficiaries in 10m), round amount, off-hours. Use the raw data and engine_config to derive current vs thresholds.
- "safe_patterns": array of strings describing patterns that REDUCE risk for this account (e.g. "Recurring beneficiaries", "Low velocity", "Within daily limit").
- "anti_patterns": array of strings describing patterns that INCREASE risk (e.g. "High velocity", "Many new beneficiaries in 10m", "Amount spike"). Only include those that apply given the current data.
- "risk_level": one of "low", "medium", "high".
- "summary": 2-3 sentence plain-language summary: whether this account is currently at risk, what the main triggers are, and what would make it safer or riskier."""


def _build_context(account_id: str) -> str:
    limits = get_limits_for_account(account_id)
    engine_config = get_engine_config()
    stats = history_service.get_account_indicators_stats(account_id)
    am = stats.get("amount_stats_24h") or {}
    hour_counts = stats.get("hour_counts_7d") or {}
    typical_hours = [h for h, c in hour_counts.items() if c and c > 0]

    # Serialize history sample for context (avoid huge payload)
    sample = stats.get("history_sample") or []
    sample_str = ""
    if sample:
        parts = []
        for row in sample[:5]:
            tx_id = row.get("transaction_id", "?")
            amt = row.get("amount", 0)
            dec = row.get("decision", "?")
            parts.append(f"{tx_id}: ${amt:.0f} ({dec})")
        sample_str = "; ".join(parts)

    return f"""
Account ID: {account_id}

## Limits (enforced before fraud engine)
- account_type: {limits.get('account_type')}
- single_tx_limit: {limits.get('single_tx_limit')}
- daily_limit: {limits.get('daily_limit')}
- daily_used (24h): {stats.get('daily_used_24h')}
- daily_remaining: {max(0, limits.get('daily_limit', 0) - stats.get('daily_used_24h', 0))}
- OTP required above: {OTP_REQUIRED_AMOUNT_THRESHOLD}

## Engine triggers (thresholds from config)
- velocity_block_threshold: {engine_config.get('velocity_block_threshold')} (block if tx in 10m >= this)
- velocity_review_threshold: {engine_config.get('velocity_review_threshold')}
- velocity_warn_threshold: {engine_config.get('velocity_warn_threshold')}
- new_beneficiary_high_amount: {engine_config.get('new_beneficiary_high_amount')}
- new_beneficiary_med_amount: {engine_config.get('new_beneficiary_med_amount')}
- new_beneficiary_low_amount: {engine_config.get('new_beneficiary_low_amount')}
- amount_spike_multiplier_avg: {engine_config.get('amount_spike_multiplier_avg')}
- amount_spike_multiplier_max: {engine_config.get('amount_spike_multiplier_max')}
- min_transactions_for_avg: {engine_config.get('min_transactions_for_avg')}
- round_amount_score, round_amount_tolerance: {engine_config.get('round_amount_score')}, {engine_config.get('round_amount_tolerance')}
- off_hours_score, unusual_hour_min_tx: {engine_config.get('off_hours_score')}, {engine_config.get('unusual_hour_min_tx')}
- structuring_min_tx, structuring_new_beneficiary_bonus: {engine_config.get('structuring_min_tx')}, {engine_config.get('structuring_new_beneficiary_bonus')}
- recurring_beneficiary_min: {engine_config.get('recurring_beneficiary_min')}

## Current activity (this account)
- recent_count_10m: {stats.get('recent_count_10m')}
- unique_beneficiaries_10m: {stats.get('unique_beneficiaries_10m')}
- amount_stats_24h: avg={am.get('avg_amount')}, max={am.get('max_amount')}, transaction_count={am.get('transaction_count')}
- total history count: {stats.get('history_count')}
- recent history sample: {sample_str or 'none'}
- typical activity hours (7d): {typical_hours[:5] if typical_hours else 'insufficient data'}
"""


async def get_account_indicators(account_id: str) -> dict:
    """Run the indicators agent and return structured JSON for the lookup UI."""
    settings = get_settings()
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=settings.OPENAI_API_KEY)
    context = _build_context(account_id)
    user_message = f"Analyze this account and return the JSON only.\n\n{context}"

    try:
        messages = [SystemMessage(content=INDICATORS_SYSTEM_PROMPT), HumanMessage(content=user_message)]
        response = await llm.ainvoke(messages)
        content = response.content if hasattr(response, "content") else str(response)
        # Strip markdown code block if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        data = json.loads(content)
        data["account_id"] = account_id
        return data
    except json.JSONDecodeError as e:
        logger.warning(f"Indicators agent returned invalid JSON: {e}")
        return _fallback_indicators(account_id, str(e))
    except Exception as e:
        logger.exception(f"Indicators agent error: {e}")
        return _fallback_indicators(account_id, str(e))


def _fallback_indicators(account_id: str, error_msg: str) -> dict:
    """Non-LLM fallback when agent fails."""
    limits = get_limits_for_account(account_id)
    stats = history_service.get_account_indicators_stats(account_id)
    daily_used = stats.get("daily_used_24h", 0)
    daily_limit = limits.get("daily_limit", 0)
    return {
        "account_id": account_id,
        "limits": {
            "account_type": limits.get("account_type"),
            "single_tx_limit": limits.get("single_tx_limit"),
            "daily_limit": daily_limit,
            "daily_used": daily_used,
            "daily_remaining": max(0, daily_limit - daily_used),
            "otp_required_above": OTP_REQUIRED_AMOUNT_THRESHOLD,
            "limits_explanation": f"This account is {limits.get('account_type')}. Single transaction limit ${limits.get('single_tx_limit'):,.0f}, daily limit ${daily_limit:,.0f}. OTP required for transactions above ${OTP_REQUIRED_AMOUNT_THRESHOLD:,.0f}.",
        },
        "triggers_how_they_work": "Velocity: too many transactions in 10 minutes can trigger REVIEW or BLOCK. New beneficiary + high amount, amount spike vs 24h avg/max, round amounts, off-hours activity, and structuring (many beneficiaries in short time) add risk. Thresholds are configured in the engine.",
        "indicators": [
            {"name": "Velocity (10m)", "current_value": stats.get("recent_count_10m", 0), "threshold_or_note": "Block ≥10, Review ≥5", "status": "ok" if (stats.get("recent_count_10m") or 0) < 5 else "warning"},
            {"name": "Daily used", "current_value": f"${daily_used:,.0f}", "threshold_or_note": f"Limit ${daily_limit:,.0f}", "status": "ok" if daily_used <= daily_limit else "risk"},
        ],
        "safe_patterns": ["Within daily limit", "Low velocity"] if (stats.get("recent_count_10m") or 0) < 5 else [],
        "anti_patterns": ["High velocity in 10m"] if (stats.get("recent_count_10m") or 0) >= 5 else [],
        "risk_level": "medium" if error_msg else "low",
        "summary": f"Account {account_id}: limits and triggers apply. Agent parsing failed: {error_msg}" if error_msg else f"Account {account_id} indicators. Check limits and triggers above.",
    }
