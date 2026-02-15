'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

const inputClass =
  'block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm tabular-nums tracking-widest text-center focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors';

interface OtpStepProps {
  demoCode: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  onConfirm: (otp: string) => void;
  onCancel: () => void;
}

export default function OtpStep({ demoCode, fromAccount, toAccount, amount, onConfirm, onCancel }: OtpStepProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = otp.replace(/\s/g, '');
    if (trimmed.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError('');
    onConfirm(trimmed);
  };

  return (
    <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <h2 className="text-base font-semibold text-neutral-900">Verify with OTP</h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Banking apps require OTP for transfers over a threshold
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Demo code (in production this would be sent via SMS)</p>
          <p className="text-lg font-mono font-semibold text-amber-900 tracking-widest">{demoCode}</p>
        </div>
        <p className="text-sm text-neutral-600">
          Transfer <strong>${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> from{' '}
          <strong>{fromAccount}</strong> to <strong>{toAccount}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="otp" className="block text-xs font-medium text-neutral-600">
            Enter 6-digit OTP
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError('');
            }}
            className={inputClass}
            placeholder="000000"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Confirm &amp; Process
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
