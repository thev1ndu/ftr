const getFraudBase = () => process.env.NEXT_PUBLIC_FRAUD_URL || '';

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

/** Error from transaction middleware (limits / OTP). */
export interface MiddlewareErrorDetail {
  error_code: string;
  message: string;
  account_type?: string;
  single_tx_limit?: number;
  daily_limit?: number;
  daily_used?: number;
}

export class TransactionMiddlewareError extends Error {
  detail: MiddlewareErrorDetail;
  constructor(message: string, detail: MiddlewareErrorDetail) {
    super(message);
    this.name = 'TransactionMiddlewareError';
    this.detail = detail;
  }
}

export interface AccountLimitsResponse {
  account_id: string;
  account_type: string;
  single_tx_limit: number;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  otp_required_above: number;
  account_types_info: Record<string, { single_tx_limit: number; daily_limit: number }>;
}

export interface RequestOtpResponse {
  transaction_id: string;
  message: string;
  otp_demo: string;
  expires_in_seconds: number;
  otp_required_threshold: number;
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

export interface ScanTransactionOptions {
  transactionId?: string;
  otp?: string;
}

export const scanTransaction = async (
  amount: number,
  deviceId: string,
  fromAccount: string,
  toAccount: string,
  options?: ScanTransactionOptions
): Promise<FraudCheckResponse> => {
  const transactionId = options?.transactionId ?? crypto.randomUUID();
  const payload = {
    transaction_id: transactionId,
    from_account: fromAccount,
    to_account: toAccount,
    amount,
    timestamp: new Date().toISOString(),
    ip_address: '192.168.1.1',
    device_id: deviceId,
    ...(options?.otp != null && options.otp !== '' ? { otp: options.otp } : {}),
  };

  const response = await fetch(`${getFraudBase()}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const body = await response.json().catch(() => ({}));
      const raw = body?.detail;
      const detail: MiddlewareErrorDetail =
        typeof raw === 'object' && raw !== null && 'error_code' in raw
          ? {
              error_code: (raw as MiddlewareErrorDetail).error_code,
              message: (raw as MiddlewareErrorDetail).message ?? 'Transaction not allowed',
              account_type: (raw as MiddlewareErrorDetail).account_type,
              single_tx_limit: (raw as MiddlewareErrorDetail).single_tx_limit,
              daily_limit: (raw as MiddlewareErrorDetail).daily_limit,
              daily_used: (raw as MiddlewareErrorDetail).daily_used,
            }
          : {
              error_code: 'MIDDLEWARE_ERROR',
              message: typeof raw === 'string' ? raw : 'Transaction not allowed.',
            };
      throw new TransactionMiddlewareError(detail.message, detail);
    }
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

export const requestOtp = async (
  transactionId: string,
  fromAccount: string,
  amount?: number
): Promise<RequestOtpResponse> => {
  const response = await fetch(`${getFraudBase()}/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId, from_account: fromAccount, amount: amount ?? 0 }),
  });
  if (!response.ok) throw new Error('Failed to request OTP');
  return response.json();
};

export const getAccountLimits = async (accountId: string): Promise<AccountLimitsResponse> => {
  const response = await fetch(`${getFraudBase()}/limits/${encodeURIComponent(accountId)}`);
  if (!response.ok) throw new Error('Failed to fetch account limits');
  return response.json();
};

export const setAccountType = async (
  accountId: string,
  accountType: 'SAVINGS' | 'CHECKING' | 'PREMIUM'
): Promise<AccountLimitsResponse> => {
  const response = await fetch(`${getFraudBase()}/limits/${encodeURIComponent(accountId)}/type`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_type: accountType }),
  });
  if (!response.ok) throw new Error('Failed to set account type');
  return getAccountLimits(accountId);
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
