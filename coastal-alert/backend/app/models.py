from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    region = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to contacts
    contacts = relationship("Contact", back_populates="user")

class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=True, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    region = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="contacts")

class AlertLog(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    metric = Column(String)
    value = Column(Float)
    threshold = Column(Float)
    message = Column(String)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())