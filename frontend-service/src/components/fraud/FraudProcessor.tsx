'use client';

import { useEffect, useState } from 'react';

export default function FraudProcessor() {
  const [step, setStep] = useState(0);
  
  const steps = [
    "Analyzing transaction patterns",
    "Checking global fraud databases",
    "Verifying beneficiary risk score",
    "Finalizing assessment"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const progress = ((step + 0.5) / steps.length) * 100;

  return (
    <div className="w-full max-w-2xl bg-white border border-black/10 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent px-6 py-5 border-b border-[#48286c]/10 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-light text-[#48286c] tracking-tight">System Check</h2>
           <p className="text-[10px] text-[#48286c]/40 tracking-widest uppercase mt-0.5">Real-Time Fraud Analysis</p>
        </div>
        <div className="px-3 py-1.5 bg-[#48286c]/5 text-[#48286c]/70 text-[9px] font-medium uppercase tracking-wider rounded-sm border border-[#48286c]/10">
            Secure Gateway
        </div>
      </div>

      <div className="p-8">
        {/* Minimal Progress Bar */}
        <div className="w-full bg-[#48286c]/5 h-[1px] mb-12 overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 bg-[#48286c] h-[1px] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {/* Clean Status List */}
        <div className="space-y-6">
            {steps.map((label, index) => {
                const isCompleted = index < step;
                const isRunning = index === step;
                const isPending = index > step;

                return (
                    <div key={index} className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            {/* Minimal Status Indicator */}
                            <div className="mt-1.5">
                                {isPending && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#48286c]/10"></div>
                                )}
                                {isRunning && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#48286c] opacity-40"></div>
                                )}
                                {isCompleted && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#48286c]"></div>
                                )}
                            </div>
                            
                            {/* Step Label */}
                            <span className={`text-sm font-light tracking-wide transition-colors duration-300 ${
                                isPending ? 'text-[#48286c]/20' : 
                                isRunning ? 'text-[#48286c]/60' : 
                                'text-[#48286c]'
                            }`}>
                                {label}
                            </span>
                        </div>

                        {/* Status Text */}
                        <div className="text-[10px] font-light tracking-widest uppercase">
                            {isCompleted && (
                                <span className="text-[#48286c]/40">Complete</span>
                            )}
                            {isRunning && (
                                <span className="text-[#48286c]/60">Processing</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Minimal Footer */}
        <div className="mt-12 pt-6 border-t border-[#48286c]/5 flex items-center justify-center gap-2">
             <p className="text-[10px] text-[#48286c]/30 tracking-widest uppercase font-light">
                FTR.
             </p>
        </div>
      </div>
    </div>
  );
}