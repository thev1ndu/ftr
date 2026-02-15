
export interface FraudCheckResponse {
  is_fraud: boolean;
  decision: 'ALLOW' | 'REVIEW' | 'BLOCK' | 'PENDING_REVIEW';
  risk_score: number; // Mapping confidence to risk score
  reason: string;
  transaction_id: string;
  anomalies?: string[];
  patterns?: string[];
  anti_patterns?: string[];
}

interface BackendResponse {
  transaction_id: string;
  ai_decision: {
    decision: 'ALLOW' | 'REVIEW' | 'BLOCK' | 'PENDING_REVIEW';
    confidence: number; // This maps to risk_score
    reason: string;
    score?: number; // Optional handle for new agent output
    anomalies?: string[];
    patterns?: string[];
    anti_patterns?: string[];
  };
}

interface ReviewResponse {
    status: string;
    ai_response: string; // JSON string
}

export const scanTransaction = async (
  amount: number, 
  deviceId: string,
  fromAccount: string,
  toAccount: string
): Promise<FraudCheckResponse> => {
  const payload = {
    transaction_id: crypto.randomUUID(),
    from_account: fromAccount,
    to_account: toAccount,
    amount: amount,
    timestamp: new Date().toISOString(),
    ip_address: "192.168.1.1",
    device_id: deviceId
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_FRAUD_URL}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to scan transaction');
  }
  const data: BackendResponse = await response.json();
  const decision = data.ai_decision;

  const riskScore = decision.score ?? decision.confidence;

  return {
    is_fraud: decision.decision !== 'ALLOW',
    decision: decision.decision,
    risk_score: riskScore,
    reason: decision.reason,
    transaction_id: data.transaction_id,
    anomalies: decision.anomalies,
    patterns: decision.patterns,
    anti_patterns: decision.anti_patterns,
  };
};

export const reviewTransaction = async (
    transactionId: string, 
    action: 'APPROVE' | 'DECLINE', 
    reason: string
): Promise<FraudCheckResponse> => {
    const payload = {
        action,
        reason
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_FRAUD_URL}/review/${transactionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('Failed to review transaction');
    }

    const data: ReviewResponse = await response.json();
    
    // Parse the inner JSON from ai_response
    let aiDecision;
    try {
        aiDecision = JSON.parse(data.ai_response);
    } catch (e) {
        console.error("Failed to parse AI response", e);
        // Fallback
        aiDecision = {
            decision: action === 'APPROVE' ? 'ALLOW' : 'BLOCK',
            score: action === 'APPROVE' ? 0 : 100,
            reason: reason
        };
    }

    return {
        is_fraud: aiDecision.decision !== 'ALLOW',
        decision: aiDecision.decision,
        risk_score: aiDecision.score ?? 0,
        reason: aiDecision.reason,
        transaction_id: transactionId
    };
};
// ... existing code ...
export interface TransactionHistoryItem {
    transaction_id: string;
    from_account: string;
    to_account: string;
    amount: number;
    timestamp: string;
    decision: string;
    risk_score: number;
    reason: string;
}

export const lookupHistory = async (accountId: string): Promise<TransactionHistoryItem[]> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FRAUD_URL}/lookup/${accountId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
    }

    return await response.json();
};
