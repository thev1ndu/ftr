from app.models.transaction import Transaction

def format_transaction(transaction: Transaction) -> str:
    return f"""
    Transaction:
    ID: {transaction.transaction_id}
    From: {transaction.from_account}
    To: {transaction.to_account}
    Amount: {transaction.amount}
    Timestamp: {transaction.timestamp}
    IP: {transaction.ip_address}
    Device: {transaction.device_id}
    """
