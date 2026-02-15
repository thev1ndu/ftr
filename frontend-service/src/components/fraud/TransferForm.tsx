'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface TransferFormProps {
  onScan: (amount: number, deviceId: string, fromAccount: string, toAccount: string) => void;
}

const DEVICE_OPTIONS = [
  { label: 'Browser (Auto-Detect)', value: 'auto' },
  { label: 'Windows PC', value: 'windows_pc_v10' },
  { label: 'MacOS Desktop', value: 'macos_desktop_v14' },
  { label: 'Linux (Ubuntu)', value: 'linux_ubuntu_v22' },
  { label: 'Android Mobile', value: 'android_mobile_v13' },
  { label: 'iOS Mobile', value: 'ios_mobile_v17' },
  { label: 'Kali Linux (Attack Sim)', value: 'kali_linux_root' },
  { label: 'Parrot OS (Attack Sim)', value: 'parrot_os_security' },
  { label: 'Scripting Bot', value: 'python_script_bot' },
];

const inputClass =
  'block w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-800 text-sm placeholder:text-neutral-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 focus:outline-none transition-colors';

export default function TransferForm({ onScan }: TransferFormProps) {
  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('acc_user_001');
  const [toAccount, setToAccount] = useState('acc_merchant_999');
  const [selectedDevice, setSelectedDevice] = useState('auto');
  const [detectedAgent, setDetectedAgent] = useState('');

  useEffect(() => {
    setDetectedAgent(navigator.userAgent);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);

    const finalDeviceId = selectedDevice === 'auto' ? detectedAgent : selectedDevice;

    if (!isNaN(val) && val > 0 && fromAccount && toAccount) {
      onScan(val, finalDeviceId, fromAccount, toAccount);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-[var(--card-border)] shadow-[var(--card-shadow)] overflow-hidden transition-shadow hover:shadow-[var(--card-shadow-hover)]">
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/60 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">New Transaction</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Initiate fund transfer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <section>
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Counterparty
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fromAccount" className="mb-1 block text-xs font-medium text-neutral-600">
                From account
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="fromAccount"
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Sender ID"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="toAccount" className="mb-1 block text-xs font-medium text-neutral-600">
                To account
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="toAccount"
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="Receiver ID"
                  required
                />
              </div>
            </div>
          </div>
        </section>

        <hr className="border-neutral-100" />

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="amount" className="mb-1 block text-xs font-medium text-neutral-600">
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="device" className="mb-1 block text-xs font-medium text-neutral-600">
              Device
            </label>
            <div className="relative">
              <select
                id="device"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              >
                {DEVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
            {selectedDevice === 'auto' && (
              <p className="mt-1 text-[10px] text-neutral-400 font-mono truncate" title={detectedAgent}>
                {detectedAgent.slice(0, 40)}…
              </p>
            )}
          </div>
        </section>

        <div className="pt-1">
          <Button type="submit" variant="primary" className="w-full sm:w-auto">
            Process Transaction
          </Button>
        </div>
      </form>
    </div>
  );
}
