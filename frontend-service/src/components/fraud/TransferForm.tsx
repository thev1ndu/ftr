
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
    <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-none shadow-sm">
      
      {/* Header Panel */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-semibold text-gray-800">New Transaction</h2>
           <p className="text-xs text-gray-500">INITIATE FUND TRANSFER</p>
        </div>
        <div className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded">
            Secure Gateway
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Accounts */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Counterparty Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fromAccount" className="block text-xs font-semibold text-gray-600 mb-1.5">Source Account</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                  </span>
                  <input
                    type="text"
                    id="fromAccount"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Sender ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="toAccount" className="block text-xs font-semibold text-gray-600 mb-1.5">Beneficiary Account</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </span>
                  <input
                    type="text"
                    id="toAccount"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="Receiver ID"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* Section: Amount & Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="amount" className="block text-xs font-semibold text-gray-600 mb-1.5">Transfer Amount (USD)</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-medium">$</span>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-medium rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                    />
                </div>
            </div>

            <div>
                <label htmlFor="device" className="block text-xs font-semibold text-gray-600 mb-1.5">Originating Device</label>
                <div className="relative">
                    <select
                        id="device"
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="block w-full pl-3 pr-8 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none"
                    >
                        {DEVICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                {selectedDevice === 'auto' && (
                    <p className="mt-1 text-[10px] text-gray-400 truncate" title={detectedAgent}>
                        User Agent: {detectedAgent}
                    </p>
                )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
                type="submit"
                className="px-6 py-2.5 bg-[#48286c] text-white rounded text-sm font-medium shadow-sm hover:bg-[#3a1f59] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#48286c] transition-colors"
            >
                Process Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
