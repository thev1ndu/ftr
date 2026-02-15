'use client';

import { useEffect, useState } from 'react';

export default function FraudProcessor() {
  const [step, setStep] = useState(0);

  const steps = [
    'Analyzing transaction patterns',
    'Checking global fraud databases',
    'Verifying beneficiary risk score',
    'Finalizing assessment',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const progress = ((step + 0.5) / steps.length) * 100;

  return (
    <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">System check</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Real-time fraud analysis</p>
        </div>
        <span className="rounded-full bg-[var(--brand-muted)] px-3 py-1 text-xs font-medium text-[var(--brand)]">
          Secure
        </span>
      </div>

      <div className="p-6">
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <ul className="space-y-4" role="list">
          {steps.map((label, index) => {
            const isDone = index < step;
            const isActive = index === step;

            return (
              <li key={index} className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    isDone
                      ? 'bg-[var(--brand)] text-white'
                      : isActive
                        ? 'bg-[var(--brand-muted)] text-[var(--brand)]'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`text-sm transition-colors ${
                    isDone ? 'text-neutral-600 font-medium' : isActive ? 'text-neutral-900 font-medium' : 'text-neutral-400'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto text-xs font-medium text-[var(--brand)]"></span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-400">FTR</p>
      </div>
    </div>
  );
}
