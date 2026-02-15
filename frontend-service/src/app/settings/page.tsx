'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getConfig, updateConfig, type EngineConfig } from '@/services/configService';
import Button from '@/components/ui/Button';

const inputClass =
  'block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm tabular-nums focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors';

type ConfigKey = keyof EngineConfig;

const FIELDS: { key: ConfigKey; label: string; hint?: string; type?: 'int' | 'float' }[] = [
  { key: 'velocity_block_threshold', label: 'Velocity block (tx in 10 min)', hint: 'Block when count ≥ this', type: 'int' },
  { key: 'velocity_review_threshold', label: 'Velocity review (tx in 10 min)', hint: 'Review when count ≥ this', type: 'int' },
  { key: 'velocity_warn_threshold', label: 'Velocity warn (tx in 10 min)', type: 'int' },
  { key: 'new_beneficiary_high_amount', label: 'New beneficiary high amount ($)', type: 'float' },
  { key: 'new_beneficiary_med_amount', label: 'New beneficiary medium amount ($)', type: 'float' },
  { key: 'new_beneficiary_low_amount', label: 'New beneficiary low amount ($)', type: 'float' },
  { key: 'amount_spike_multiplier_avg', label: 'Amount spike vs avg (multiplier)', hint: 'Flag when amount > avg × this', type: 'float' },
  { key: 'amount_spike_multiplier_max', label: 'Amount spike vs max (multiplier)', type: 'float' },
  { key: 'min_transactions_for_avg', label: 'Min tx for avg/max (24h)', type: 'int' },
  { key: 'round_amount_tolerance', label: 'Round amount tolerance', type: 'float' },
  { key: 'round_amount_score', label: 'Round amount risk score', type: 'int' },
  { key: 'unusual_hour_min_tx', label: 'Unusual hour min tx (7d)', hint: 'Min tx to detect typical hour', type: 'int' },
  { key: 'off_hours_score', label: 'Off-hours risk score', type: 'int' },
  { key: 'structuring_min_tx', label: 'Structuring min tx/beneficiaries', type: 'int' },
  { key: 'structuring_new_beneficiary_bonus', label: 'Structuring new beneficiary bonus score', type: 'int' },
  { key: 'recurring_beneficiary_min', label: 'Recurring beneficiary min (trusted)', type: 'int' },
];

function toDisplayValue(val: number, type: 'int' | 'float'): string {
  if (type === 'int') return String(Math.round(val));
  return String(Number(val));
}

function fromDisplayValue(s: string, type: 'int' | 'float'): number {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return type === 'int' ? Math.round(n) : n;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getConfig()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          const next: Record<string, string> = {};
          FIELDS.forEach(({ key, type }) => {
            next[key] = toDisplayValue(data[key] ?? 0, type ?? 'float');
          });
          setForm(next);
        }
      })
      .catch((err) => {
        if (!cancelled) setError('Failed to load settings.');
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (key: ConfigKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updates: Partial<EngineConfig> = {};
      FIELDS.forEach(({ key, type }) => {
        const t = type ?? 'float';
        updates[key as ConfigKey] = fromDisplayValue(form[key] ?? '0', t) as never;
      });
      const updated = await updateConfig(updates);
      setConfig(updated);
      setDirty(false);
      setSuccess(true);
    } catch (err) {
      setError('Failed to save settings.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!config) return;
    const next: Record<string, string> = {};
    FIELDS.forEach(({ key, type }) => {
      next[key] = toDisplayValue(config[key] ?? 0, type ?? 'float');
    });
    setForm(next);
    setDirty(false);
    setSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-10 relative bg-[var(--background)]">
      <div className="relative z-10 w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-1.5">
            Fraud Engine Settings
          </h1>
          <p className="text-sm text-neutral-500 mb-5">Configure detection thresholds</p>
          <nav className="inline-flex items-center gap-0.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-sm border border-neutral-200/80 px-1 py-1 shadow-sm">
            <Link
              href="/"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              Transfer
            </Link>
            <Link
              href="/history"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              History
            </Link>
            <span className="text-xs font-medium text-[var(--brand)] bg-[var(--brand-muted)] rounded-full px-3 py-1.5">
              Settings
            </span>
          </nav>
        </header>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">Engine Config</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Single row in config table; changes apply to new transactions</p>
          </div>

          {loading && (
            <div className="p-8 text-center text-sm text-neutral-500">Loading settings…</div>
          )}

          {error && (
            <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mx-5 mt-4 rounded-2xl border border-[var(--ifs-teal)]/40 bg-[var(--ifs-teal-muted)] px-4 py-3 text-sm text-[var(--ifs-teal)]">
              Settings saved.
            </div>
          )}

          {!loading && config && (
            <div className="p-5 space-y-6">
              <section>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Velocity & new beneficiary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.filter((f) =>
                    ['velocity_block_threshold', 'velocity_review_threshold', 'velocity_warn_threshold', 'new_beneficiary_high_amount', 'new_beneficiary_med_amount', 'new_beneficiary_low_amount'].includes(f.key)
                  ).map(({ key, label, hint, type }) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
                      <input
                        type="number"
                        step={type === 'float' ? 0.01 : 1}
                        min={0}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={inputClass}
                      />
                      {hint && <p className="mt-1 text-[10px] text-neutral-400">{hint}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Amount spike & round amount</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.filter((f) =>
                    ['amount_spike_multiplier_avg', 'amount_spike_multiplier_max', 'min_transactions_for_avg', 'round_amount_tolerance', 'round_amount_score'].includes(f.key)
                  ).map(({ key, label, hint, type }) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
                      <input
                        type="number"
                        step={type === 'float' ? 0.01 : 1}
                        min={0}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={inputClass}
                      />
                      {hint && <p className="mt-1 text-[10px] text-neutral-400">{hint}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Anomaly & anti-pattern</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {FIELDS.filter((f) =>
                    ['unusual_hour_min_tx', 'off_hours_score', 'structuring_min_tx', 'structuring_new_beneficiary_bonus', 'recurring_beneficiary_min'].includes(f.key)
                  ).map(({ key, label, hint, type }) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
                      <input
                        type="number"
                        step={type === 'float' ? 0.01 : 1}
                        min={0}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={inputClass}
                      />
                      {hint && <p className="mt-1 text-[10px] text-neutral-400">{hint}</p>}
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  {saving ? 'Saving…' : 'Save settings'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={!dirty}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
