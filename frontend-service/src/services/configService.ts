const BASE = process.env.NEXT_PUBLIC_FRAUD_URL;

export interface EngineConfig {
  round_amount_tolerance: number;
  unusual_hour_min_tx: number;
  structuring_min_tx: number;
  structuring_new_beneficiary_bonus: number;
  off_hours_score: number;
  round_amount_score: number;
  recurring_beneficiary_min: number;
  velocity_block_threshold: number;
  velocity_review_threshold: number;
  velocity_warn_threshold: number;
  new_beneficiary_high_amount: number;
  new_beneficiary_med_amount: number;
  new_beneficiary_low_amount: number;
  amount_spike_multiplier_avg: number;
  amount_spike_multiplier_max: number;
  min_transactions_for_avg: number;
}

export async function getConfig(): Promise<EngineConfig> {
  const response = await fetch(`${BASE}/config`);
  if (!response.ok) throw new Error('Failed to fetch config');
  return response.json();
}

export async function getConfigKey(key: string): Promise<{ key: string; value: number }> {
  const response = await fetch(`${BASE}/config/${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error(`Failed to fetch config key: ${key}`);
  return response.json();
}

