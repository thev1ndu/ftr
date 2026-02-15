
'use client';

import { FraudCheckResponse } from "@/services/fraudService";

interface TransactionResultProps {
  result: FraudCheckResponse;
  amount: number;
  onReset: () => void;
}

export default function TransactionResult({ result, amount, onReset }: TransactionResultProps) {
  const isFraud = result.is_fraud;
  const score = result.risk_score || 0;
  
  // Define risk level colors
  const getRiskColor = (s: number) => {
    if (s < 20) return "text-green-500 stroke-green-500";
    if (s < 70) return "text-yellow-500 stroke-yellow-500";
    return "text-red-500 stroke-red-500";
  };
  
  const riskColorClass = getRiskColor(score);
  const riskLabel = score < 20 ? "Low Risk" : score < 70 ? "Medium Risk" : "High Risk";
  const statusColor = isFraud ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200";
  const statusTextColor = isFraud ? "text-red-700" : "text-green-700";

  return (
    <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-none shadow-sm">
      
      {/* Header Panel */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-semibold text-gray-800">Transaction Receipt</h2>
           <p className="text-xs text-gray-500">FINAL STATUS REPORT</p>
        </div>
        <div className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${isFraud ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {isFraud ? 'Security Alert' : 'Transfer Successful'}
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Status Banner */}
        <div className={`p-4 rounded border ${isFraud ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'} flex items-start space-x-3`}>
             <div className={`flex-shrink-0 mt-0.5 ${isFraud ? 'text-red-600' : 'text-green-600'}`}>
                {isFraud ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
             </div>
             <div>
                 <h3 className={`text-sm font-bold ${isFraud ? 'text-red-800' : 'text-green-800'}`}>
                    {isFraud ? 'Transaction Blocked' : 'Payment Processed Successfully'}
                 </h3>
                 <p className={`text-xs mt-1 ${isFraud ? 'text-red-700' : 'text-green-700'} leading-relaxed`}>
                    {isFraud 
                        ? 'Our security systems have flagged this transaction as high risk. No funds have been deducted.' 
                        : 'The transaction has passed all security checks and has been sent to the beneficiary.'}
                 </p>
             </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Amount */}
            <div>
                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Amount</label>
                 <div className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</div>
            </div>

            {/* Risk Score */}
            <div>
                 <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risk Analysis</label>
                 <div className="flex items-center space-x-2">
                    <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${
                             score < 20 ? 'bg-green-500' : score < 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} style={{ width: `${score}%` }}></div>
                    </div>
                    <span className={`text-sm font-bold ${getRiskColor(score).split(' ')[0]}`}>{score}/100</span>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1 uppercase">{riskLabel}</p>
            </div>
        </div>

        {/* System Output */}
        <div>
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Engine Report</label>
             <div className="bg-gray-50 rounded border border-gray-200 p-3">
                 <p className="text-xs text-gray-600 font-mono leading-relaxed">
                    {result.reason}
                 </p>
             </div>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-[10px] text-gray-400 font-mono">
                REF: {result.transaction_id}
            </div>
            <div className="text-[10px] text-gray-400">
                {new Date().toISOString()}
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end space-x-3">
         <button
          onClick={onReset}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
        >
          Close Receipt
        </button>
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-[#48286c] text-white text-sm font-medium rounded shadow-sm hover:bg-[#3a1f59] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#48286c] transition-colors"
        >
          New Transaction
        </button>
      </div>
    </div>
  );
}
