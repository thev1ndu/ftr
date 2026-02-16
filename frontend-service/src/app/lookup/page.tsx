'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  setAccountType,
  getAccountLimits,
  getAccountIndicators,
  type AccountLimitsResponse,
  type AccountIndicatorsResponse,
} from '@/services/fraudService';
import Button from '@/components/ui/Button';

const inputClass =
  'block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm tabular-nums focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors';

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    low: 'bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)]',
    medium: 'bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]',
    high: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${map[level] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {level}
    </span>
  );
}

function IndicatorStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: 'text-[var(--ifs-teal)]',
    warning: 'text-[var(--ifs-orange)]',
    risk: 'text-red-600',
  };
  return <span className={`text-xs font-medium capitalize ${map[status] ?? ''}`}>{status}</span>;
}

export default function LookupPage() {
  const [accountId, setAccountId] = useState('acc_user_001');
  const [accountType, setAccountTypeState] = useState<'SAVINGS' | 'CHECKING' | 'PREMIUM'>('SAVINGS');
  const [accountLimits, setAccountLimits] = useState<AccountLimitsResponse | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);

  const [indicatorsAccountId, setIndicatorsAccountId] = useState('acc_user_001');
  const [indicators, setIndicators] = useState<AccountIndicatorsResponse | null>(null);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [indicatorsError, setIndicatorsError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const account = searchParams.get('account');
    if (account?.trim()) {
      setIndicatorsAccountId(account.trim());
    }
  }, [searchParams]);

  const handleSetAccountType = async () => {
    setAccountSaving(true);
    setAccountSuccess(false);
    try {
      const limits = await setAccountType(accountId.trim(), accountType);
      setAccountLimits(limits);
      setAccountSuccess(true);
    } catch {
      setAccountLimits(null);
    } finally {
      setAccountSaving(false);
    }
  };

  const handleGetIndicators = async () => {
    const id = indicatorsAccountId.trim();
    if (!id) return;
    setIndicatorsLoading(true);
    setIndicatorsError('');
    setIndicators(null);
    try {
      const data = await getAccountIndicators(id);
      setIndicators(data);
    } catch (e) {
      setIndicatorsError('Failed to load indicators. Check the account ID and try again.');
      console.error(e);
    } finally {
      setIndicatorsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-10 relative bg-[var(--background)]">
      <div className="relative z-10 w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-1.5">
            Lookup
          </h1>
          <p className="text-sm text-neutral-500 mb-5">Account type, limits, and risk indicators</p>
          <nav className="inline-flex items-center gap-0.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-sm border border-neutral-200/80 px-1 py-1 shadow-sm">
            <Link href="/" className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]">
              Transfer
            </Link>
            <Link href="/history" className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]">
              History
            </Link>
            <span className="text-xs font-medium text-[var(--brand)] bg-[var(--brand-muted)] rounded-full px-3 py-1.5">
              Lookup
            </span>
          </nav>
        </header>

        {/* Account type & limits */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden mb-6">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">Account type & limits</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set account type for transaction middleware. Limits are enforced before the fraud engine.
            </p>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Account ID</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className={inputClass}
                  placeholder="acc_user_001"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountTypeState(e.target.value as 'SAVINGS' | 'CHECKING' | 'PREMIUM')}
                  className={inputClass}
                >
                  <option value="SAVINGS">SAVINGS ($5k / $10k day)</option>
                  <option value="CHECKING">CHECKING ($25k / $50k day)</option>
                  <option value="PREMIUM">PREMIUM ($100k / $250k day)</option>
                </select>
              </div>
              <Button variant="primary" onClick={handleSetAccountType} disabled={accountSaving || !accountId.trim()}>
                {accountSaving ? 'Saving…' : 'Set account type'}
              </Button>
            </div>
            {accountSuccess && accountLimits && (
              <p className="mt-2 text-xs text-[var(--ifs-teal)]">
                {accountId} set to {accountLimits.account_type}. Single: ${accountLimits.single_tx_limit.toLocaleString()}, Daily: ${accountLimits.daily_limit.toLocaleString()}.
              </p>
            )}
          </div>
        </div>

        {/* Account risk indicators (LangChain agent) */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">Account risk indicators</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Limits, how triggers work, current indicators, safe vs anti-patterns, and whether the account is at risk.
            </p>
          </div>
          <div className="p-5">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Account ID</label>
                <input
                  type="text"
                  value={indicatorsAccountId}
                  onChange={(e) => setIndicatorsAccountId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGetIndicators()}
                  className={inputClass}
                  placeholder="e.g. acc_user_001"
                />
              </div>
              <Button
                variant="primary"
                onClick={handleGetIndicators}
                disabled={indicatorsLoading || !indicatorsAccountId.trim()}
                className="sm:self-end"
              >
                {indicatorsLoading ? 'Loading…' : 'Get indicators'}
              </Button>
            </div>

            {indicatorsError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {indicatorsError}
              </div>
            )}

            {indicators && (
              <div className="space-y-5 pt-2 border-t border-neutral-100">
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Limits</h3>
                  <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700 space-y-1">
                    <p><strong>Type:</strong> {indicators.limits.account_type} · Single: ${Number(indicators.limits.single_tx_limit).toLocaleString()} · Daily: ${Number(indicators.limits.daily_limit).toLocaleString()}</p>
                    <p>Used today: ${Number(indicators.limits.daily_used).toLocaleString()} · Remaining: ${Number(indicators.limits.daily_remaining).toLocaleString()} · OTP above: ${Number(indicators.limits.otp_required_above).toLocaleString()}</p>
                    {indicators.limits.limits_explanation && (
                      <p className="mt-2 text-neutral-600">{indicators.limits.limits_explanation}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">How triggers work</h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">{indicators.triggers_how_they_work}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Current indicators</h3>
                  <ul className="space-y-2">
                    {indicators.indicators.map((ind, i) => (
                      <li key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                        <span className="font-medium text-neutral-800">{ind.name}</span>
                        <span className="text-neutral-600 text-right">{String(ind.current_value)}</span>
                        <span className="text-neutral-500 text-xs text-right whitespace-nowrap">{ind.threshold_or_note}</span>
                        <div className="flex justify-end">
                          <IndicatorStatus status={ind.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Safe patterns</h3>
                    <ul className="list-disc list-inside text-sm text-[var(--ifs-teal)] space-y-1">
                      {indicators.safe_patterns.length ? indicators.safe_patterns.map((p, i) => <li key={i}>{p}</li>) : <li className="text-neutral-500">None identified</li>}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Anti-patterns (risk)</h3>
                    <ul className="list-disc list-inside text-sm text-red-600/90 space-y-1">
                      {indicators.anti_patterns.length ? indicators.anti_patterns.map((p, i) => <li key={i}>{p}</li>) : <li className="text-neutral-500">None identified</li>}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Risk level</h3>
                  <RiskBadge level={indicators.risk_level} />
                </div>

                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-sm text-neutral-700 leading-relaxed">{indicators.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}