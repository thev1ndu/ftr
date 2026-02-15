
export interface FraudCheckResponse {
  is_fraud: boolean;
  risk_score: number; // Mapping confidence to risk score
  reason: string;
  transaction_id: string;
}

interface BackendResponse {
  transaction_id: string;
  ai_decision: {
    decision: 'ALLOW' | 'REVIEW' | 'BLOCK';
    confidence: number; // This maps to risk_score
    reason: string;
    score?: number; // Optional handle for new agent output
  };
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
    risk_score: riskScore,
    reason: decision.reason,
    transaction_id: data.transaction_id
  };
};
