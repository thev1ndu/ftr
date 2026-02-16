'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { lookupHistory, getAccountIndicators, TransactionHistoryItem, type AccountIndicatorsResponse } from '@/services/fraudService';
import Button from '@/components/ui/Button';

const SEARCH_DEBOUNCE_MS = 400;
const PER_PAGE = 10;

const inputClass =
  'block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm placeholder:text-neutral-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors';

function StatusBadge({ decision }: { decision: string }) {
  const map: Record<string, { label: string; class: string }> = {
    ALLOW: { label: 'Approved', class: 'bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)]' },
    BLOCK: { label: 'Blocked', class: 'bg-red-100 text-red-600' },
    REVIEW: { label: 'Review', class: 'bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]' },
    PENDING_REVIEW: { label: 'Pending', class: 'bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]' },
  };
  const c = map[decision] ?? { label: decision, class: 'bg-neutral-100 text-neutral-600' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.class}`}>
      {c.label}
    </span>
  );
}

function TransactionCard({
  tx,
  accountId,
}: {
  tx: TransactionHistoryItem;
  accountId: string;
}) {
  const isOutgoing = tx.from_account === accountId;
  const date = new Date(tx.timestamp).toLocaleString();
  const reason = tx.reason?.trim() || '—';
  const risk = tx.risk_score ?? 0;

  return (
    <article className="border border-neutral-200 rounded-2xl bg-white p-4 sm:p-5 hover:border-neutral-300 hover:shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <time className="text-sm text-neutral-500 tabular-nums">{date}</time>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isOutgoing ? 'bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]' : 'bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)]'
            }`}
          >
            {isOutgoing ? 'Outgoing' : 'Incoming'}
          </span>
          <StatusBadge decision={tx.decision} />
        </div>
        <p
          className={`text-lg font-semibold tabular-nums ${
            isOutgoing ? 'text-neutral-800' : 'text-[var(--ifs-teal)]'
          }`}
        >
          {isOutgoing ? '−' : '+'}${tx.amount.toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-neutral-400 text-xs uppercase tracking-wider">Counterparty</span>
          <Link
            href={`/history?account=${encodeURIComponent(isOutgoing ? tx.to_account : tx.from_account)}`}
            className="font-mono text-[var(--brand)] hover:underline truncate block"
            title={`View history for ${isOutgoing ? tx.to_account : tx.from_account}`}
          >
            {isOutgoing ? tx.to_account : tx.from_account}
          </Link>
        </div>
        <div>
          <span className="text-neutral-400 text-xs uppercase tracking-wider">Risk score</span>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full rounded-full ${
                  risk < 20 ? 'bg-[var(--ifs-teal)]' : risk < 70 ? 'bg-[var(--ifs-orange)]' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, risk)}%` }}
              />
            </div>
            <span className="text-neutral-600 tabular-nums text-xs">{risk}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-neutral-100">
        <span className="text-neutral-400 text-xs uppercase tracking-wider">Reason</span>
        <p className="mt-1 text-sm text-neutral-600 leading-relaxed break-words">{reason}</p>
      </div>
    </article>
  );
}

export default function LookupPage() {
  const searchParams = useSearchParams();
  const [accountId, setAccountId] = useState('');
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [indicators, setIndicators] = useState<AccountIndicatorsResponse | null>(null);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [indicatorsError, setIndicatorsError] = useState('');

  // Pre-fill account from URL (e.g. /history?account=acc_merchant_999)
  useEffect(() => {
    const account = searchParams.get('account');
    if (account?.trim()) setAccountId(account.trim());
  }, [searchParams]);

  const handleLookup = useCallback(async (overrideAccountId?: string) => {
    const id = (overrideAccountId ?? accountId).trim();
    if (!id) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setLoading(true);
    setError('');
    setPage(1);
    try {
      const data = await lookupHistory(id);
      setHistory(data);
    } catch (err) {
      setError('Failed to fetch history. Please check the account ID.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    const id = accountId.trim();
    if (!id) return;
    debounceRef.current = setTimeout(() => {
      handleLookup(accountId);
      debounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [accountId, handleLookup]);

  const totalSent = history
    .filter((tx) => tx.from_account === accountId && tx.decision !== 'BLOCK')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalReceived = history
    .filter((tx) => tx.to_account === accountId && tx.decision !== 'BLOCK')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const showEmpty = !loading && accountId.trim() && !error && history.length === 0;

  const totalPages = Math.max(1, Math.ceil(history.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const end = Math.min(start + PER_PAGE, history.length);
  const pageHistory = history.slice(start, end);

  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(totalPages);
  }, [totalPages, page]);

  const handleGetIndicators = useCallback(async () => {
    const id = accountId.trim();
    if (!id) return;
    setIndicatorsLoading(true);
    setIndicatorsError('');
    setIndicators(null);
    try {
      const data = await getAccountIndicators(id);
      setIndicators(data);
    } catch (e) {
      setIndicatorsError('Failed to load indicators.');
      console.error(e);
    } finally {
      setIndicatorsLoading(false);
    }
  }, [accountId]);

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-10 relative bg-[var(--background)]">
      <div className="relative z-10 w-full max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-1.5">
            Transaction History
          </h1>
          <p className="text-sm text-neutral-500 mb-5">Complete record by account</p>
          <nav className="inline-flex items-center gap-0.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-sm border border-neutral-200/80 px-1 py-1 shadow-sm">
            <Link
              href="/"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              Transfer
            </Link>
            <span className="text-xs font-medium text-[var(--brand)] bg-[var(--brand-muted)] rounded-full px-3 py-1.5">
              History
            </span>
            <Link
              href="/lookup"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              Lookup
            </Link>
          </nav>
        </header>

        <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden mb-6">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">Search by account</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Enter an account ID to view its transaction history</p>
          </div>
          <div className="p-5">
            <label htmlFor="accountId" className="mb-1.5 block text-xs font-medium text-neutral-600">
              Account ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  id="accountId"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. acc_user_001"
                  className={`${inputClass} pl-10`}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => handleLookup()}
                disabled={loading || !accountId.trim()}
                className="w-full sm:w-auto min-w-[100px]"
              >
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {history.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                  Total sent
                </p>
                <p className="text-xl font-semibold text-neutral-900 tabular-nums">
                  ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                  Total received
                </p>
                <p className="text-xl font-semibold text-neutral-900 tabular-nums">
                  ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden mb-6">
              <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Risk indicators</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Limits, triggers, safe vs anti-patterns, risk level</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleGetIndicators}
                  disabled={indicatorsLoading || !accountId.trim()}
                >
                  {indicatorsLoading ? 'Loading…' : 'Get indicators'}
                </Button>
              </div>
              {indicatorsError && (
                <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {indicatorsError}
                </div>
              )}
              {indicators && (
                <div className="p-5 space-y-4 border-t border-neutral-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <p><strong>Limits:</strong> {indicators.limits.account_type} · Single ${Number(indicators.limits.single_tx_limit).toLocaleString()} · Daily ${Number(indicators.limits.daily_limit).toLocaleString()} (used ${Number(indicators.limits.daily_used).toLocaleString()})</p>
                    <p><strong>Risk level:</strong> <span className={`capitalize ${indicators.risk_level === 'low' ? 'text-[var(--ifs-teal)]' : indicators.risk_level === 'high' ? 'text-red-600' : 'text-[var(--ifs-orange)]'}`}>{indicators.risk_level}</span></p>
                  </div>
                  <p className="text-xs text-neutral-600"><strong>Triggers:</strong> {indicators.triggers_how_they_work}</p>
                  <div className="flex flex-wrap gap-2">
                    {indicators.indicators.slice(0, 6).map((ind, i) => (
                      <span key={i} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs">
                        {ind.name}: {String(ind.current_value)} <span className={ind.status === 'ok' ? 'text-[var(--ifs-teal)]' : ind.status === 'risk' ? 'text-red-600' : 'text-[var(--ifs-orange)]'}> ({ind.status})</span>
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase mb-1">Safe patterns</p>
                      <ul className="list-disc list-inside text-[var(--ifs-teal)]">{indicators.safe_patterns.length ? indicators.safe_patterns.map((p, i) => <li key={i}>{p}</li>) : <li className="text-neutral-500">None</li>}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-neutral-500 uppercase mb-1">Anti-patterns</p>
                      <ul className="list-disc list-inside text-red-600/90">{indicators.anti_patterns.length ? indicators.anti_patterns.map((p, i) => <li key={i}>{p}</li>) : <li className="text-neutral-500">None</li>}</ul>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-700 border-t border-neutral-100 pt-3">{indicators.summary}</p>
                  <Link href={`/lookup?account=${encodeURIComponent(accountId.trim())}`} className="text-xs text-[var(--brand)] hover:underline">
                    View full indicators on Lookup →
                  </Link>
                </div>
              )}
            </div>

            <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-neutral-800">Transactions</h2>
              <span className="text-xs text-neutral-500">
                {history.length} record{history.length !== 1 ? 's' : ''}
                {history.length > PER_PAGE && (
                  <> · Page {safePage} of {totalPages}</>
                )}
              </span>
            </div>
            <ul className="space-y-3 list-none p-0 m-0">
              {pageHistory.map((tx) => (
                <li key={tx.transaction_id}>
                  <TransactionCard tx={tx} accountId={accountId.trim()} />
                </li>
              ))}
            </ul>

            {history.length > PER_PAGE && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                <p className="text-xs text-neutral-500">
                  Showing {start + 1}–{end} of {history.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="min-w-[80px]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="min-w-[80px]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {showEmpty && (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-12 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-base font-medium text-neutral-700">No transactions found</p>
            <p className="mt-1 text-sm text-neutral-500">
              Account <code className="px-1.5 py-0.5 rounded bg-neutral-200/80 font-mono text-xs">{accountId}</code> has no transaction history.
            </p>
            <p className="mt-3 text-xs text-neutral-400 max-w-sm mx-auto">
              Try a different account ID or make a transfer from the Transfer page to see records here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
