'use client';

import { useState } from 'react';
import Link from 'next/link';
import TransferForm from '@/components/fraud/TransferForm';
import FraudProcessor from '@/components/fraud/FraudProcessor';
import TransactionResult from '@/components/fraud/TransactionResult';
import { scanTransaction, FraudCheckResponse } from '@/services/fraudService';

export default function Home() {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'RESULT'>('IDLE');
  const [result, setResult] = useState<FraudCheckResponse | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');

  const handleScan = async (transferAmount: number, deviceId: string, from: string, to: string) => {
    setAmount(transferAmount);
    setFromAccount(from);
    setToAccount(to);
    setStatus('PROCESSING');

    try {
      const processPromise = scanTransaction(transferAmount, deviceId, fromAccount, toAccount);
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3500));

      const [apiResult] = await Promise.all([processPromise, delayPromise]);

      setResult(apiResult);
      setStatus('RESULT');
    } catch (error) {
      console.error('Scan failed', error);
      setStatus('IDLE');
      alert('System Error: Could not verify transaction security.');
    }
  };

  const handleReset = () => {
    setStatus('IDLE');
    setResult(null);
    setAmount(0);
    setFromAccount('');
    setToAccount('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 relative bg-[var(--background)]">
      <div className="relative z-10 w-full max-w-lg">
        <header className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900 mb-1.5">
            Financial Transaction Ratings
          </h1>
          <p className="text-sm text-neutral-500 mb-5">AI-powered fraud detection</p>
          <nav className="inline-flex items-center gap-0.5 rounded-full bg-[var(--nav-bg)] backdrop-blur-sm border border-neutral-200/80 px-1 py-1 shadow-sm">
            <span className="text-xs font-medium text-[var(--brand)] bg-[var(--brand-muted)] rounded-full px-3 py-1.5">Transfer</span>
            <Link
              href="/history"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              History
            </Link>
            <Link
              href="/settings"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              Settings
            </Link>
          </nav>
        </header>

        <main className="transition-all duration-500 ease-out">
          {status === 'IDLE' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TransferForm onScan={handleScan} />
            </div>
          )}

          {status === 'PROCESSING' && (
            <div className="animate-in fade-in duration-400">
              <FraudProcessor />
            </div>
          )}

          {status === 'RESULT' && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TransactionResult
                result={result}
                amount={amount}
                fromAccount={fromAccount}
                toAccount={toAccount}
                onReset={handleReset}
                onUpdate={setResult}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
