from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    region: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Contact schemas
class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    region: Optional[str] = None

class ContactOut(ContactCreate):
    id: int
    created_at: datetime
    user_id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Alert schemas
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