from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class Transaction(BaseModel):
    transaction_id: str
    from_account: str
    to_account: str
    amount: float
    timestamp: datetime
    ip_address: str
    device_id: str


class TransactionScanRequest(BaseModel):
    """Request body for /scan: transaction payload + optional OTP (required for large amounts)."""
    transaction_id: str
    from_account: str
    to_account: str
    amount: float
    timestamp: datetime
    ip_address: str
    device_id: str
    otp: Optional[str] = None

    def to_transaction(self) -> Transaction:
        return Transaction(
            transaction_id=self.transaction_id,
            from_account=self.from_account,
            to_account=self.to_account,
            amount=self.amount,
            timestamp=self.timestamp,
            ip_address=self.ip_address,
            device_id=self.device_id,
        )
