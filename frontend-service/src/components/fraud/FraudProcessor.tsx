
'use client';

import { useEffect, useState } from 'react';

export default function FraudProcessor() {
  const [step, setStep] = useState(0);
  
  const steps = [
    "Analyzing transaction patterns...",
    "Checking global fraud databases...",
    "Verifying beneficiary risk score...",
    "Finalizing assessment..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800); // Simulate progress every 800ms
    return () => clearInterval(interval);
  }, []);

  // Calculate progress
  const progress = ((step + 0.5) / steps.length) * 100;

  return (
    <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-none shadow-sm">
      
      {/* Header Panel */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-semibold text-gray-800">System Check</h2>
           <p className="text-xs text-gray-500">REAL-TIME FRAUD ANALYSIS</p>
        </div>
        <div className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded">
            Secure Gateway
        </div>
      </div>

      <div className="p-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6 overflow-hidden">
          <div 
            className="bg-[#48286c] h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {/* Check Steps */}
        <div className="space-y-3 font-mono text-xs">
            {steps.map((label, index) => {
                const isCompleted = index < step;
                const isRunning = index === step;
                const isPending = index > step;

                return (
                    <div key={index} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                                isPending ? 'bg-gray-200' :
                                isRunning ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                            }`}></div>
                            <span className={`${
                                isPending ? 'text-gray-400' : 
                                isRunning ? 'text-gray-800 font-semibold' : 'text-gray-600'
                            }`}>
                                {label}
                            </span>
                        </div>
                        {isCompleted && (
                            <span className="text-green-600 font-bold tracking-wider text-[10px]">OK</span>
                        )}
                        {isRunning && (
                            <span className="text-blue-600 font-bold tracking-wider text-[10px]">RUNNING...</span>
                        )}
                    </div>
                );
            })}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
             <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                Connecting to Neural Engine...
             </p>
        </div>
      </div>
    </div>
  );
}