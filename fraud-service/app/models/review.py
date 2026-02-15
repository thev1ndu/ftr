from pydantic import BaseModel

class ReviewRequest(BaseModel):
    action: str # "APPROVE" or "DECLINE"
    reason: str
