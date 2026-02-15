
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
      // Intentionally delay to show the "AI processing" animation for at least 3 seconds
      const processPromise = scanTransaction(transferAmount, deviceId, fromAccount, toAccount);
      const delayPromise = new Promise(resolve => setTimeout(resolve, 3500));
      
      const [apiResult] = await Promise.all([processPromise, delayPromise]);
      
      setResult(apiResult);
      setStatus('RESULT');
    } catch (error) {
      console.error("Scan failed", error);
      // Handle error gracefully - for now back to idle
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#48286c] to-[#2d1b4e] z-0 skew-y-[-2deg] origin-top-left scale-110 translate-y-[-20%]"></div>
      <div className="absolute top-10 right-10 w-64 h-64 bg-[#a54ee0] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-10 left-10 w-64 h-64 bg-[#00d4ff] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        
        <div className="mb-8 text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Financial Transaction Ratings</h1>
          <p className="text-white/70 text-sm">Protected by AI-powered Fraud Detection</p>
        </div>

        {status === 'IDLE' && (
          <TransferForm onScan={handleScan} />
        )}

        {status === 'PROCESSING' && (
           <FraudProcessor />
        )}

        {status === 'RESULT' && result && (
           <TransactionResult 
             result={result} 
             amount={amount}
             onReset={handleReset}
             onUpdate={setResult}
           />
        )}
      </div>

    </div>
  );
}
