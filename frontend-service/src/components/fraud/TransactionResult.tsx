'use client';

import { useState } from 'react';
import { FraudCheckResponse, reviewTransaction } from '@/services/fraudService';
import Button from '@/components/ui/Button';

interface TransactionResultProps {
  result: FraudCheckResponse;
  amount: number;
  onReset: () => void;
  onUpdate: (newResult: FraudCheckResponse) => void;
}

function StatusIcon({ decision }: { decision: string }) {
  if (decision === 'ALLOW')
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  if (decision === 'PENDING_REVIEW')
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)]">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </span>
  );
}

export default function TransactionResult({ result, amount, onReset, onUpdate }: TransactionResultProps) {
  const decision = result.decision;
  const isPending = decision === 'PENDING_REVIEW';
  const score = result.risk_score ?? 0;
  const isFraud = result.is_fraud;

  const [reviewReason, setReviewReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const handleReview = async (action: 'APPROVE' | 'DECLINE') => {
    if (!reviewReason.trim()) {
      alert('Please provide a reason for your decision.');
      return;
    }
    setIsReviewing(true);
    try {
      const newResult = await reviewTransaction(result.transaction_id, action, reviewReason);
      onUpdate(newResult);
    } catch (error) {
      console.error('Review failed', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  const riskLabel = score < 20 ? 'Low risk' : score < 70 ? 'Medium risk' : 'High risk';
  const riskBarColor =
    score < 20 ? 'bg-[var(--ifs-teal)]' : score < 70 ? 'bg-[var(--ifs-orange)]' : 'bg-red-500';

  let statusConfig = {
    title: 'Payment processed',
    description: 'The transaction passed all checks and was sent to the beneficiary.',
    badge: 'Approved',
    containerClass: 'bg-[var(--ifs-teal-muted)] border-[var(--ifs-teal)]/30 text-[#008f6b]',
    badgeClass: 'rounded-full bg-[var(--ifs-teal-muted)] text-[var(--ifs-teal)] border-0',
  };
  if (isPending) {
    statusConfig = {
      title: 'Manual review required',
      description:
        'This transaction was flagged for review. Approve or decline below with a reason.',
      badge: 'Pending review',
      containerClass: 'bg-[var(--ifs-orange-muted)] border-[var(--ifs-orange)]/30 text-[#b45309]',
      badgeClass: 'rounded-full bg-[var(--ifs-orange-muted)] text-[var(--ifs-orange)] border-0',
    };
  } else if (isFraud) {
    statusConfig = {
      title: 'Transaction blocked',
      description: 'This transaction was flagged as high risk. No funds were deducted.',
      badge: 'Blocked',
      containerClass: 'bg-red-50 border-red-200/80 text-red-800',
      badgeClass: 'rounded-full bg-red-100 text-red-600 border-0',
    };
  }

  return (
    <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Transaction receipt</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Final status</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-medium ${statusConfig.badgeClass}`}
        >
          {statusConfig.badge}
        </span>
      </div>

      <div className="p-6 space-y-5">
        <div
          className={`flex gap-3 rounded-2xl border p-4 ${statusConfig.containerClass}`}
        >
          <StatusIcon decision={decision} />
          <div>
            <h3 className="font-semibold text-current">{statusConfig.title}</h3>
            <p className="mt-1 text-sm opacity-90">{statusConfig.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Amount
            </p>
            <p className="text-xl font-semibold text-neutral-900">${amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              Risk score
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${riskBarColor}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-sm font-medium text-neutral-700 tabular-nums">{score}/100</span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{riskLabel}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Engine report
          </p>
          <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
            <p className="text-sm text-neutral-600 leading-relaxed">{result.reason}</p>
          </div>
        </div>

        {isPending && (
          <div className="rounded-2xl border border-[var(--ifs-orange)]/30 bg-[var(--ifs-orange-muted)] p-4">
            <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-2">
              Your decision
            </p>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="Enter reason for approval or rejection…"
              rows={3}
              className="mb-3 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none"
            />
            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={() => handleReview('APPROVE')}
                disabled={isReviewing}
              >
                {isReviewing ? 'Processing…' : 'Approve'}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReview('DECLINE')}
                disabled={isReviewing}
              >
                {isReviewing ? 'Processing…' : 'Decline'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
          <span className="font-mono">REF: {result.transaction_id}</span>
          <time dateTime={new Date().toISOString()}>{new Date().toLocaleString()}</time>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <Button variant="secondary" onClick={onReset}>
          Close receipt
        </Button>
        {!isPending && (
          <Button variant="primary" onClick={onReset}>
            New transaction
          </Button>
        )}
      </div>
    </div>
  );
}
