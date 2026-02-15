'use client';

import { useState } from 'react';
import { FraudCheckResponse, reviewTransaction } from "@/services/fraudService";

interface TransactionResultProps {
  result: FraudCheckResponse;
  amount: number;
  onReset: () => void;
  onUpdate: (newResult: FraudCheckResponse) => void;
}

export default function TransactionResult({ result, amount, onReset, onUpdate }: TransactionResultProps) {
  const isFraud = result.is_fraud;
  const decision = result.decision;
  const isPending = decision === 'PENDING_REVIEW';
  const score = result.risk_score || 0;
  
  const [reviewReason, setReviewReason] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  // Define risk level colors
  const getRiskColor = (s: number) => {
    if (s < 20) return "text-green-500 stroke-green-500";
    if (s < 70) return "text-yellow-500 stroke-yellow-500";
    return "text-red-500 stroke-red-500";
  };
  
  const handleReview = async (action: 'APPROVE' | 'DECLINE') => {
      if (!reviewReason.trim()) {
          alert("Please provide a reason for your decision.");
          return;
      }
      setIsReviewing(true);
      try {
          const newResult = await reviewTransaction(result.transaction_id, action, reviewReason);
          onUpdate(newResult);
      } catch (error) {
          console.error("Review failed", error);
          alert("Failed to submit review. Please try again.");
      } finally {
          setIsReviewing(false);
      }
  };
  
  const riskColorClass = getRiskColor(score);
  const riskLabel = score < 20 ? "Low Risk" : score < 70 ? "Medium Risk" : "High Risk";
  
  // Dynamic Styles based on status
  let statusBg = "bg-green-50 border-green-200";
  let statusText = "text-green-700";
  let statusTitle = "Payment Processed Successfully";
  let statusDesc = "The transaction has passed all security checks and has been sent to the beneficiary.";
  let Icon = (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  );

  if (isPending) {
      statusBg = "bg-yellow-50 border-yellow-200";
      statusText = "text-yellow-700";
      statusTitle = "Manual Review Required";
      statusDesc = "This transaction has been flagged for manual review due to high risk factors. Please approve or decline below.";
      Icon = (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      );
  } else if (isFraud) {
      statusBg = "bg-red-50 border-red-200";
      statusText = "text-red-700";
      statusTitle = "Transaction Blocked";
      statusDesc = "Our security systems have flagged this transaction as high risk. No funds have been deducted.";
      Icon = (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      );
  }

  return (
    <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-none shadow-sm">
      
      {/* Header Panel */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-semibold text-gray-800">Transaction Receipt</h2>
           <p className="text-xs text-gray-500">FINAL STATUS REPORT</p>
        </div>
        <div className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${isPending ? 'bg-yellow-100 text-yellow-700' : isFraud ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {isPending ? 'Pending Review' : isFraud ? 'Security Alert' : 'Transfer Successful'}
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Status Banner */}
        <div className={`p-4 rounded border ${statusBg} flex items-start space-x-3`}>
             <div className={`flex-shrink-0 mt-0.5 ${statusText}`}>
                {Icon}
             </div>
             <div>
                 <h3 className={`text-sm font-bold ${statusText === 'text-green-700' ? 'text-green-800' : statusText === 'text-yellow-700' ? 'text-yellow-800' : 'text-red-800'}`}>
                    {statusTitle}
                 </h3>
                 <p className={`text-xs mt-1 ${statusText} leading-relaxed`}>
                    {statusDesc}
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
        
        {/* Review Action Section */}
        {isPending && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Review Action</label>
                <textarea 
                    className="w-full text-sm p-2 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                    placeholder="Enter reason for approval or rejection..."
                    rows={2}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                ></textarea>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => handleReview('APPROVE')}
                        disabled={isReviewing}
                        className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {isReviewing ? 'Processing...' : 'APPROVE TRANSACTION'}
                    </button>
                    <button 
                        onClick={() => handleReview('DECLINE')}
                        disabled={isReviewing}
                        className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {isReviewing ? 'Processing...' : 'DECLINE TRANSACTION'}
                    </button>
                </div>
            </div>
        )}

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
        {!isPending && (
            <button
            onClick={onReset}
            className="px-6 py-2.5 bg-[#48286c] text-white text-sm font-medium rounded shadow-sm hover:bg-[#3a1f59] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#48286c] transition-colors"
            >
            New Transaction
            </button>
        )}
      </div>
    </div>
  );
}
