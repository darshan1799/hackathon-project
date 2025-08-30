from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    region: Optional[str] = None

class ContactOut(ContactCreate):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AlertIn(BaseModel):
    metric: str
    value: float
    location: Optional[str] = None

class AlertLogOut(BaseModel):
    id: int
    metric: str
    value: float
    threshold: float
    message: str
    sent: bool
    created_at: datetime
    
    class Config:
        from_attributes = True