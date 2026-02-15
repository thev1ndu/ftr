'use client';

import { useState } from 'react';
import TransferForm from '@/components/fraud/TransferForm';
import FraudProcessor from '@/components/fraud/FraudProcessor';
import TransactionResult from '@/components/fraud/TransactionResult';
import { scanTransaction, FraudCheckResponse } from '@/services/fraudService';

export default function Home() {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'RESULT'>('IDLE');
  const [result, setResult] = useState<FraudCheckResponse | null>(null);
  const [amount, setAmount] = useState<number>(0);

  const handleScan = async (transferAmount: number, deviceId: string, fromAccount: string, toAccount: string) => {
    setAmount(transferAmount);
    setStatus('PROCESSING');
    
    try {
      const processPromise = scanTransaction(transferAmount, deviceId, fromAccount, toAccount);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 3500));
      
      const [apiResult] = await Promise.all([processPromise, delayPromise]);
      
      setResult(apiResult);
      setStatus('RESULT');
    } catch (error) {
      console.error("Scan failed", error);
      alert("System Error: Could not verify transaction security.");
      setStatus('IDLE');
    }
  };

  const handleReset = () => {
    setStatus('IDLE');
    setResult(null);
    setAmount(0);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 md:p-8">
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      
      {/* Minimal accent element */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>

      <div className="relative z-10 w-full max-w-md">
        
        {/* Header - minimal and clean */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-4xl font-light tracking-tight text-black mb-3">
            Financial Transaction Ratings
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-black/40">
            <p>AI-powered fraud detection</p>
          </div>
          <div className="flex items-center justify-center mt-2 gap-2 text-sm text-black/40">
            <a href='/history' className='text-blue-500 hover:text-blue-700 underline'>/history</a>
          </div>
        </div>

        {/* Content area with smooth transitions */}
        <div className="transition-all duration-500 ease-out">
          {status === 'IDLE' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <TransferForm onScan={handleScan} />
            </div>
          )}

          {status === 'PROCESSING' && (
            <div className="animate-in fade-in duration-500">
              <FraudProcessor />
            </div>
          )}

          {status === 'RESULT' && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <TransactionResult 
                result={result} 
                amount={amount}
                onReset={handleReset}
                onUpdate={setResult}
              />
            </div>
          )}
        </div>

        {/* Footer mark - subtle branding */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-black/20">
            <span>Secured</span>
            <div className="w-1 h-1 rounded-full bg-black/10"></div>
            <span>Verified</span>
            <div className="w-1 h-1 rounded-full bg-black/10"></div>
            <span>Protected</span>
          </div>
        </div>
      </div>

    </div>
  );
}