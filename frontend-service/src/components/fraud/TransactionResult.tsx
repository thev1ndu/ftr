'use client';

import { useState } from 'react';
import { FraudCheckResponse, reviewTransaction } from "@/services/fraudService";
import Button from '@/components/ui/Button';

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
    if (s < 20) return "text-emerald-600";
    if (s < 70) return "text-amber-600";
    return "text-black-600";
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
  let statusBg = "bg-emerald-500/5 border-emerald-500/20";
  let statusText = "text-emerald-700";
  let statusTitle = "Payment Processed Successfully";
  let statusDesc = "The transaction has passed all security checks and has been sent to the beneficiary.";
  let badgeBg = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  let badgeText = "Transfer Successful";

  if (isPending) {
      statusBg = "bg-amber-500/5 border-amber-500/20";
      statusText = "text-amber-700";
      statusTitle = "Manual Review Required";
      statusDesc = "This transaction has been flagged for manual review due to high risk factors. Please approve or decline below.";
      badgeBg = "bg-amber-500/10 text-amber-700 border-amber-500/20";
      badgeText = "Pending Review";
  } else if (isFraud) {
      statusBg = "bg-rose-500/5 border-rose-500/20";
      statusText = "text-rose-700";
      statusTitle = "Transaction Blocked";
      statusDesc = "Our security systems have flagged this transaction as high risk. No funds have been deducted.";
      badgeBg = "bg-rose-500/10 text-rose-700 border-rose-500/20";
      badgeText = "Security Alert";
  }

  return (
    <div className="w-full max-w-2xl bg-white border border-black/10 rounded-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      
      {/* Header Panel */}
      <div className="bg-gradient-to-b from-[#48286c]/[0.02] to-transparent px-6 py-5 border-b border-[#48286c]/10 flex justify-between items-center">
        <div>
           <h2 className="text-lg font-light text-[#48286c] tracking-tight">Transaction Receipt</h2>
           <p className="text-[10px] text-[#48286c]/40 tracking-widest uppercase mt-0.5">Final Status Report</p>
        </div>
        <div className={`px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider rounded-sm border ${badgeBg}`}>
            {badgeText}
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        {/* Status Banner - Minimal */}
        <div className={`p-5 rounded-sm border ${statusBg}`}>
             <div>
                 <h3 className={`text-base font-light ${statusText} tracking-tight mb-2`}>
                    {statusTitle}
                 </h3>
                 <p className={`text-sm font-light ${statusText}/70 text-black leading-relaxed`}>
                    {statusDesc}
                 </p>
             </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Amount */}
            <div>
                 <label className="block text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-3">Total Amount</label>
                 <div className="text-3xl font-light text-[#48286c] tracking-tight">${amount.toFixed(2)}</div>
            </div>

            {/* Risk Score */}
            <div>
                 <label className="block text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-3">Risk Analysis</label>
                 <div className="flex items-center gap-3">
                    <div className="h-[2px] flex-1 bg-[#48286c]/5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${
                             score < 20 ? 'bg-emerald-500' : score < 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} style={{ width: `${score}%` }}></div>
                    </div>
                    <span className={`text-sm font-light ${getRiskColor(score)}`}>{score}/100</span>
                 </div>
                 <p className="text-[10px] text-[#48286c]/30 mt-2 uppercase tracking-wide font-light">{riskLabel}</p>
            </div>
        </div>

        {/* System Output */}
        <div>
             <label className="block text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-3">Engine Report</label>
             <div className="bg-[#48286c]/[0.02] rounded-sm border border-[#48286c]/10 p-4">
                 <p className="text-sm text-[#48286c]/70 font-light font-mono leading-relaxed">
                    {result.reason}
                 </p>
             </div>
        </div>
        
        {/* Review Action Section */}
        {isPending && (
            <div className="mt-2 p-5 bg-[#48286c]/[0.02] border border-[#48286c]/10 rounded-sm">
                <label className="block text-[10px] font-light text-[#48286c]/50 uppercase tracking-widest mb-3">Review Action</label>
                <textarea 
                    className="w-full text-sm font-light p-3 border border-[#48286c]/15 rounded-sm mb-4 focus:ring-1 focus:ring-[#48286c]/30 focus:border-[#48286c]/40 outline-none text-[#48286c] bg-white placeholder:text-[#48286c]/20 transition-all"
                    placeholder="Enter reason for approval or rejection"
                    rows={2}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                ></textarea>
                <div className="flex gap-3">
                    <Button
                        variant="success"
                        onClick={() => handleReview('APPROVE')}
                        disabled={isReviewing}
                    >
                        {isReviewing ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => handleReview('DECLINE')}
                        disabled={isReviewing}
                    >
                        {isReviewing ? 'Processing...' : 'Decline'}
                    </Button>
                </div>
            </div>
        )}

        {/* Footer Info */}
        <div className="pt-6 border-t border-[#48286c]/5 flex justify-between items-center">
            <div className="text-[10px] text-[#48286c]/30 font-mono font-light tracking-wide">
                REF: {result.transaction_id}
            </div>
            <div className="text-[10px] text-[#48286c]/30 font-light">
                {new Date().toISOString()}
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gradient-to-b from-transparent to-[#48286c]/[0.02] p-6 border-t border-[#48286c]/10 flex justify-end gap-3">
        <Button variant="secondary" onClick={onReset}>
          Close Receipt
        </Button>
        {!isPending && (
          <Button variant="primary" onClick={onReset}>
            New Transaction
          </Button>
        )}
      </div>
    </div>
  );
}