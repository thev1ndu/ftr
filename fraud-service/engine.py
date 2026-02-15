def basic_rule_check(transaction):
    score = 0

    if transaction.amount <= 0:
        return "BLOCK", 100

    if transaction.amount > 200000:
        score += 80

    if transaction.from_account == transaction.to_account:
        score += 50

    if score > 70:
        return "REVIEW", score

    return "ALLOW", score