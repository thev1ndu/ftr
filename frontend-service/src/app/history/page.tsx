'use client';

import { useState } from 'react';
import { lookupHistory, TransactionHistoryItem } from "@/services/fraudService";
import Button from '@/components/ui/Button';

export default function LookupPage() {
    const [accountId, setAccountId] = useState('');
    const [history, setHistory] = useState<TransactionHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLookup = async () => {
        if (!accountId.trim()) return;
        
        setLoading(true);
        setError('');
        try {
            const data = await lookupHistory(accountId);
            setHistory(data);
        } catch (err) {
            setError('Failed to fetch history. Please check the account ID.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalSent = history
        .filter(tx => tx.from_account === accountId && tx.decision !== 'BLOCK')
        .reduce((sum, tx) => sum + tx.amount, 0);

    const totalReceived = history
        .filter(tx => tx.to_account === accountId && tx.decision !== 'BLOCK')
        .reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
            
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
            
            {/* Minimal accent element */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>

            <div className="relative z-10 w-full max-w-4xl">
                
                {/* Header */}
                <div className="mb-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-3">
                        Transaction History
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-black/40">
                        <p>Complete historical record</p>
                    </div>
                    <div className="flex items-center justify-center mt-4 gap-2 text-sm text-black/40">
                        <a href='/' className='text-[#48286c] hover:text-[#3a1f59] underline transition-colors font-light'>/transfer</a>
                    </div>
                </div>

                {/* Search Box */}
                <div className="w-full max-w-2xl mx-auto bg-white border border-black/10 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)] mb-8">
                    <div className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent px-6 py-5 border-b border-[#48286c]/10">
                        <div>
                            <h2 className="text-lg font-light text-[#48286c] tracking-tight">Search Account</h2>
                            <p className="text-[10px] text-[#48286c]/40 tracking-widest uppercase mt-0.5">Lookup Transaction History</p>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-[11px] font-light text-[#48286c]/60 mb-2 tracking-wide uppercase">
                                    Account ID
                                </label>
                                <input 
                                    type="text" 
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                    placeholder="e.g. ACC-123456"
                                    className="block w-full px-0 py-3 bg-transparent border-0 border-b border-[#48286c]/15 text-[#48286c] text-base font-light placeholder:text-[#48286c]/20 focus:outline-none focus:border-[#48286c]/40 transition-colors"
                                />
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleLookup}
                                disabled={loading || !accountId}
                                className="w-full md:w-auto"
                            >
                                {loading ? 'Searching...' : 'Search History'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="w-full max-w-2xl mx-auto mb-8 p-5 bg-rose-500/5 border border-rose-500/20 text-rose-700 rounded-sm text-sm font-light">
                        {error}
                    </div>
                )}

                {/* Account Summary */}
                {history.length > 0 && (
                    <div className="w-full max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white p-6 border border-[#48286c]/10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-2">Total Sent</p>
                                <p className="text-2xl font-light text-[#48286c] tracking-tight">
                                    ${totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-[#48286c]/10 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-2">Total Received</p>
                                <p className="text-2xl font-light text-[#48286c] tracking-tight">
                                    ${totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                {history.length > 0 && (
                    <div className="w-full max-w-2xl mx-auto bg-white border border-black/10 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                        <div className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent px-6 py-5 border-b border-[#48286c]/10">
                            <h2 className="text-lg font-light text-[#48286c] tracking-tight">Transaction Records</h2>
                            <p className="text-[10px] text-[#48286c]/40 tracking-widest uppercase mt-0.5">{history.length} Total Transactions</p>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent border-b border-[#48286c]/10">
                                    <tr>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px]">Date</th>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px]">Type</th>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px] text-right">Amount</th>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px] text-center">Status</th>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px]">Counterparty</th>
                                        <th className="px-6 py-4 font-light text-[#48286c]/50 uppercase tracking-widest text-[10px]">Risk</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#48286c]/5">
                                    {history.map((tx) => {
                                        const isOutgoing = tx.from_account === accountId;
                                        const date = new Date(tx.timestamp).toLocaleString();
                                        
                                        return (
                                            <tr key={tx.transaction_id} className="hover:bg-[#48286c]/[0.02] transition-colors">
                                                <td className="px-6 py-4 text-[#48286c]/60 font-light whitespace-nowrap text-sm">{date}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-sm text-[10px] font-light uppercase tracking-wider border ${
                                                        isOutgoing 
                                                            ? 'bg-amber-500/5 text-amber-700 border-amber-500/20' 
                                                            : 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20'
                                                    }`}>
                                                        {isOutgoing ? 'Outgoing' : 'Incoming'}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-right font-light text-base ${isOutgoing ? 'text-[#48286c]' : 'text-emerald-700'}`}>
                                                    {isOutgoing ? '-' : '+'}${tx.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {tx.decision === 'ALLOW' && <span className="text-emerald-600 font-light text-xs uppercase tracking-wide">Approved</span>}
                                                    {tx.decision === 'BLOCK' && <span className="text-rose-600 font-light text-xs uppercase tracking-wide">Blocked</span>}
                                                    {tx.decision === 'REVIEW' && <span className="text-amber-600 font-light text-xs uppercase tracking-wide">Review</span>}
                                                    {tx.decision === 'PENDING_REVIEW' && <span className="text-amber-600 font-light text-xs uppercase tracking-wide">Pending</span>}
                                                </td>
                                                <td className="px-6 py-4 text-[#48286c]/60 font-light font-mono text-xs">
                                                    {isOutgoing ? tx.to_account : tx.from_account}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-20 h-[2px] bg-[#48286c]/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all ${
                                                                    tx.risk_score < 20 ? 'bg-emerald-500' : 
                                                                    tx.risk_score < 70 ? 'bg-amber-500' : 'bg-rose-500'
                                                                }`} 
                                                                style={{ width: `${tx.risk_score}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-light text-[#48286c]/40 tabular-nums">{tx.risk_score}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {history.length === 0 && !loading && accountId && !error && (
                    <div className="text-center py-20">
                        <div className="inline-flex flex-col items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#48286c]/10"></div>
                            <p className="text-sm font-light text-[#48286c]/30 tracking-wide">No transactions found for this account</p>
                        </div>
                    </div>
                )}

                {/* Footer hint */}
                {!accountId && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center gap-2 text-[10px] text-[#48286c]/20 tracking-widest uppercase">
                            <span>Enter account ID to begin</span>
                        </div>
                    </div>
                )}

                {/* Footer mark */}
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