'use client';

import { useState, useEffect } from 'react';

interface TransferFormProps {
  onScan: (amount: number, deviceId: string, fromAccount: string, toAccount: string) => void;
}

const DEVICE_OPTIONS = [
  { label: "Browser (Auto-Detect)", value: "auto" },
  { label: "Windows PC", value: "windows_pc_v10" },
  { label: "MacOS Desktop", value: "macos_desktop_v14" },
  { label: "Linux (Ubuntu)", value: "linux_ubuntu_v22" },
  { label: "Android Mobile", value: "android_mobile_v13" },
  { label: "iOS Mobile", value: "ios_mobile_v17" },
  { label: "Kali Linux (Attack Sim)", value: "kali_linux_root" },
  { label: "Parrot OS (Attack Sim)", value: "parrot_os_security" },
  { label: "Scripting Bot", value: "python_script_bot" }
];

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
    
    let finalDeviceId = selectedDevice;
    if (selectedDevice === 'auto') {
      finalDeviceId = detectedAgent;
    }

    if (!isNaN(val) && val > 0 && fromAccount && toAccount) {
      onScan(val, finalDeviceId, fromAccount, toAccount);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white border border-black/10 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent px-6 py-5 border-b border-[#48286c]/10 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-light text-[#48286c] tracking-tight">New Transaction</h2>
           <p className="text-[10px] text-[#48286c]/40 tracking-widest uppercase mt-0.5">Initiate Fund Transfer</p>
        </div>
        <div className="px-3 py-1.5 bg-[#48286c]/5 text-[#48286c]/70 text-[9px] font-medium uppercase tracking-wider rounded-sm border border-[#48286c]/10">
            Secure Gateway
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Accounts */}
          <div>
            <h3 className="text-[10px] font-medium text-[#48286c]/50 uppercase tracking-widest mb-4">Counterparty Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fromAccount" className="block text-[11px] font-light text-[#48286c]/60 mb-2 tracking-wide uppercase">Source Account</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#48286c]/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                  </span>
                  <input
                    type="text"
                    id="fromAccount"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-white border border-[#48286c]/15 text-[#48286c] text-sm font-light rounded-sm focus:ring-1 focus:ring-[#48286c]/30 focus:border-[#48286c]/40 transition-all placeholder:text-[#48286c]/20"
                    placeholder="Sender ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="toAccount" className="block text-[11px] font-light text-[#48286c]/60 mb-2 tracking-wide uppercase">Beneficiary Account</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#48286c]/30">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </span>
                  <input
                    type="text"
                    id="toAccount"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-white border border-[#48286c]/15 text-[#48286c] text-sm font-light rounded-sm focus:ring-1 focus:ring-[#48286c]/30 focus:border-[#48286c]/40 transition-all placeholder:text-[#48286c]/20"
                    placeholder="Receiver ID"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#48286c]/8 my-4"></div>

          {/* Section: Amount & Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="amount" className="block text-[11px] font-light text-[#48286c]/60 mb-2 tracking-wide uppercase">Transfer Amount (USD)</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#48286c]/40 font-light">$</span>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="block w-full pl-8 pr-3 py-2.5 bg-white border border-[#48286c]/15 text-[#48286c] text-sm font-light rounded-sm focus:ring-1 focus:ring-[#48286c]/30 focus:border-[#48286c]/40 transition-all placeholder:text-[#48286c]/20"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                    />
                </div>
            </div>

            <div>
                <label htmlFor="device" className="block text-[11px] font-light text-[#48286c]/60 mb-2 tracking-wide uppercase">Originating Device</label>
                <div className="relative">
                    <select
                        id="device"
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="block w-full pl-3 pr-8 py-2.5 bg-white border border-[#48286c]/15 text-[#48286c] text-sm font-light rounded-sm focus:ring-1 focus:ring-[#48286c]/30 focus:border-[#48286c]/40 transition-all appearance-none cursor-pointer"
                    >
                        {DEVICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#48286c]/30">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                {selectedDevice === 'auto' && (
                    <p className="mt-2 text-[10px] text-[#48286c]/30 truncate font-mono" title={detectedAgent}>
                        User Agent: {detectedAgent}
                    </p>
                )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
                type="submit"
                className="px-8 py-3 bg-[#48286c] text-white rounded-sm text-sm font-light tracking-wide uppercase shadow-[0_1px_2px_rgba(72,40,108,0.15)] hover:bg-[#3a1f59] hover:shadow-[0_2px_4px_rgba(72,40,108,0.2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#48286c]/30 transition-all duration-200"
            >
                Process Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}