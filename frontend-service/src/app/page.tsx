'use client';

import { useState } from 'react';
import Link from 'next/link';
import TransferForm from '@/components/fraud/TransferForm';
import FraudProcessor from '@/components/fraud/FraudProcessor';
import TransactionResult from '@/components/fraud/TransactionResult';
import OtpPopup from '@/components/fraud/OtpPopup';
import {
  scanTransaction,
  requestOtp,
  FraudCheckResponse,
  TransactionMiddlewareError,
} from '@/services/fraudService';

const OTP_THRESHOLD = 100; // matches backend; OTP required for amounts >= this

type Status = 'IDLE' | 'OTP' | 'PROCESSING' | 'RESULT';

export default function Home() {
  const [status, setStatus] = useState<Status>('IDLE');
  const [result, setResult] = useState<FraudCheckResponse | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [fromAccount, setFromAccount] = useState<string>('');
  const [toAccount, setToAccount] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [otpDemoCode, setOtpDemoCode] = useState<string>('');
  const [middlewareError, setMiddlewareError] = useState<string | null>(null);

  const handleScan = async (transferAmount: number, devId: string, from: string, to: string) => {
    setAmount(transferAmount);
    setFromAccount(from);
    setToAccount(to);
    setDeviceId(devId);
    setMiddlewareError(null);
    const txId = crypto.randomUUID();
    setTransactionId(txId);

    if (transferAmount >= OTP_THRESHOLD) {
      setStatus('OTP');
      try {
        const otpRes = await requestOtp(txId, from, transferAmount);
        setOtpDemoCode(otpRes.otp_demo);
      } catch (e) {
        console.error(e);
        setMiddlewareError('Could not request OTP. Please try again.');
      }
      return;
    }

    setStatus('PROCESSING');
    try {
      const processPromise = scanTransaction(transferAmount, devId, from, to, { transactionId: txId });
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3500));
      const [apiResult] = await Promise.all([processPromise, delayPromise]);
      setResult(apiResult);
      setStatus('RESULT');
    } catch (error) {
      if (error instanceof TransactionMiddlewareError) {
        setMiddlewareError(error.detail.message);
      } else {
        console.error('Scan failed', error);
        setMiddlewareError('System Error: Could not verify transaction security.');
      }
      setStatus('IDLE');
    }
  };

  const handleOtpConfirm = async (otp: string) => {
    setStatus('PROCESSING');
    setMiddlewareError(null);
    try {
      const processPromise = scanTransaction(amount, deviceId, fromAccount, toAccount, {
        transactionId,
        otp,
      });
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 3500));
      const [apiResult] = await Promise.all([processPromise, delayPromise]);
      setResult(apiResult);
      setStatus('RESULT');
    } catch (error) {
      if (error instanceof TransactionMiddlewareError) {
        setMiddlewareError(error.detail.message);
      } else {
        console.error('Scan failed', error);
        setMiddlewareError('System Error: Could not verify transaction security.');
      }
      setStatus('IDLE');
    }
  };

  const handleOtpCancel = () => {
    setStatus('IDLE');
    setOtpDemoCode('');
  };

  const handleReset = () => {
    setStatus('IDLE');
    setResult(null);
    setAmount(0);
    setFromAccount('');
    setToAccount('');
    setOtpDemoCode('');
    setMiddlewareError(null);
  };

  const isProcessing = status === 'PROCESSING';

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
              href="/lookup"
              className="text-xs font-medium text-neutral-600 hover:text-[var(--brand)] transition-colors rounded-full px-3 py-1.5 hover:bg-[var(--brand-muted)]"
            >
              Lookup
            </Link>
          </nav>
        </header>

        <main className="transition-all duration-500 ease-out space-y-4">
          {middlewareError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              {middlewareError}
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TransferForm onScan={handleScan} isProcessing={isProcessing} />
          </div>

          {status === 'PROCESSING' && (
            <div className="animate-in fade-in duration-300">
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

      {status === 'OTP' && otpDemoCode && (
        <OtpPopup
          demoCode={otpDemoCode}
          fromAccount={fromAccount}
          toAccount={toAccount}
          amount={amount}
          onConfirm={handleOtpConfirm}
          onCancel={handleOtpCancel}
        />
      )}
    </div>
  );
}
