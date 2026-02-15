'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { lookupHistory, TransactionHistoryItem } from '@/services/fraudService';
import Button from '@/components/ui/Button';

const SEARCH_DEBOUNCE_MS = 400;

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

export default function LookupPage() {
  const [accountId, setAccountId] = useState('');
  const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLookup = useCallback(
    async (overrideAccountId?: string) => {
      const id = (overrideAccountId ?? accountId).trim();
      if (!id) return;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setLoading(true);
      setError('');
      try {
        const data = await lookupHistory(id);
        setHistory(data);
      } catch (err) {
        setError('Failed to fetch history. Please check the account ID.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [accountId]
  );

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

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-10 relative bg-[var(--background)]">
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(109,40,217,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(109,40,217,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-4xl">
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
            <span className="text-xs font-medium text-[var(--brand)] bg-[var(--brand-muted)] rounded-full px-3 py-1.5">History</span>
          </nav>
        </header>

        <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden mb-6">
          <div className="border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">Search account</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Look up transaction history by account ID</p>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  id="accountId"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. acc_user_001"
                  className="block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm placeholder:text-neutral-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={() => handleLookup()}
                  disabled={loading || !accountId.trim()}
                  className="w-full sm:w-auto min-w-[120px]"
                >
                  {loading ? 'Searching…' : 'Search'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {history.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] p-6">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Total sent
              </p>
              <p className="text-xl font-semibold text-neutral-900">
                ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] p-6">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                Total received
              </p>
              <p className="text-xl font-semibold text-neutral-900">
                ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden">
            <div className="border-b border-neutral-100 bg-neutral-50/60 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Transactions</h2>
                <p className="text-xs text-neutral-500 mt-0.5">{history.length} records</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60">
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Counterparty
                    </th>
                    <th className="px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wider w-20">
                      Risk
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {history.map((tx) => {
                    const isOutgoing = tx.from_account === accountId;
                    const date = new Date(tx.timestamp).toLocaleString();
                    return (
                      <tr
                        key={tx.transaction_id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-neutral-600 whitespace-nowrap">{date}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isOutgoing
                                ? 'bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]'
                                : 'bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)]'
                            }`}
                          >
                            {isOutgoing ? 'Outgoing' : 'Incoming'}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-medium tabular-nums ${
                            isOutgoing ? 'text-neutral-800' : 'text-[var(--ifs-teal)]'
                          }`}
                        >
                          {isOutgoing ? '−' : '+'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StatusBadge decision={tx.decision} />
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-neutral-600">
                          {isOutgoing ? tx.to_account : tx.from_account}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-neutral-100">
                              <div
                                className={`h-full ${
                                  tx.risk_score < 20
                                    ? 'bg-[var(--ifs-teal)]'
                                    : tx.risk_score < 70
                                      ? 'bg-[var(--ifs-orange)]'
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${tx.risk_score}%` }}
                              />
                            </div>
                            <span className="text-xs text-neutral-500 tabular-nums w-6">
                              {tx.risk_score}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && accountId.trim() && !error && history.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-neutral-50/50 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-3">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-600">No transactions found</p>
            <p className="mt-1 text-xs text-neutral-500">No records for account “{accountId}”</p>
          </div>
        )}
      </div>
    </div>
  );
}
