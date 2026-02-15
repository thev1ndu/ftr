from pydantic import BaseModel
from datetime import datetime

class Transaction(BaseModel):
    transaction_id: str
    from_account: str
    to_account: str
    amount: float
    timestamp: datetime
    ip_address: str
    device_id: str
