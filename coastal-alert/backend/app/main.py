from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from . import models, schemas, auth
from .database import SessionLocal, engine, Base
from .notifier import notifier
from .config import settings
from .auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Coastal Threat Alert API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

THRESHOLDS = {
    "water_level": 3.5,
    "wind_speed": 120.0,
    "rainfall_24h": 100.0,
    "wave_height": 5.0,
    "storm_surge": 2.0
}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Coastal Threat Alert API", "version": "1.0.0"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Coastal Alert System"}

# Authentication endpoints - Admin only
@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

@app.post("/api/contacts", response_model=schemas.ContactOut)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    # Check for duplicate email if provided
    if contact.email:
        existing_email = db.query(models.Contact).filter(models.Contact.email == contact.email).first()
        if existing_email:
            raise HTTPException(
                status_code=400, 
                detail=f"Contact with email '{contact.email}' already exists"
            )
    
    # Check for duplicate phone if provided
    if contact.phone:
        existing_phone = db.query(models.Contact).filter(models.Contact.phone == contact.phone).first()
        if existing_phone:
            raise HTTPException(
                status_code=400, 
                detail=f"Contact with phone number '{contact.phone}' already exists"
            )
    
    # At least one contact method required
    if not contact.email and not contact.phone:
        raise HTTPException(
            status_code=400,
            detail="At least one contact method (email or phone) is required"
        )
    
    db_contact = models.Contact(**contact.dict())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.get("/api/contacts", response_model=List[schemas.ContactOut])
def list_contacts(db: Session = Depends(get_db)):
    return db.query(models.Contact).order_by(models.Contact.created_at.desc()).all()

@app.get("/api/contacts/{contact_id}", response_model=schemas.ContactOut)
def get_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@app.put("/api/contacts/{contact_id}", response_model=schemas.ContactOut)
def update_contact(contact_id: int, contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    db_contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not db_contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Check for duplicate email if it's being changed
    if contact.email and contact.email != db_contact.email:
        existing_email = db.query(models.Contact).filter(
            models.Contact.email == contact.email,
            models.Contact.id != contact_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"Contact with email '{contact.email}' already exists"
            )
    
    # Check for duplicate phone if it's being changed
    if contact.phone and contact.phone != db_contact.phone:
        existing_phone = db.query(models.Contact).filter(
            models.Contact.phone == contact.phone,
            models.Contact.id != contact_id
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail=f"Contact with phone number '{contact.phone}' already exists"
            )
    
    # At least one contact method required
    if not contact.email and not contact.phone:
        raise HTTPException(
            status_code=400,
            detail="At least one contact method (email or phone) is required"
        )
    
    for key, value in contact.dict().items():
        setattr(db_contact, key, value)
    
    db.commit()
    db.refresh(db_contact)
    return db_contact

@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(models.Contact).filter(models.Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"ok": True, "message": f"Contact {contact_id} deleted"}

@app.post("/api/alerts")
def trigger_alert(alert: schemas.AlertIn, db: Session = Depends(get_db)):
    metric = alert.metric
    value = alert.value
    threshold = THRESHOLDS.get(metric)
    
    if threshold is None:
        raise HTTPException(status_code=400, detail=f"Unknown metric: {metric}. Available metrics: {list(THRESHOLDS.keys())}")

    severity = "CRITICAL" if value > threshold * 1.5 else "HIGH" if value > threshold else "NORMAL"
    
    log = models.AlertLog(
        metric=metric,
        value=value,
        threshold=threshold,
        message="",
        sent=False
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    if value > threshold:
        location_str = f" at {alert.location}" if alert.location else ""
        msg = f"COASTAL THREAT ALERT [{severity}]\\n"
        msg += f"Metric: {metric.replace('_', ' ').title()}\\n"
        msg += f"Current: {value:.2f} (Threshold: {threshold:.2f})\\n"
        msg += f"Location: {alert.location or 'Coastal Region'}\\n"
        msg += f"Take immediate precautions!"
        
        log.message = msg
        
        # Filter contacts by location if specified
        if alert.location:
            # Check if multiple locations are specified (separated by pipe |)
            if '|' in alert.location:
                # Multiple locations selected
                locations = alert.location.split('|')
                # Build OR query for multiple locations
                from sqlalchemy import or_
                location_filters = [models.Contact.region.ilike(f"%{loc.strip()}%") for loc in locations]
                contacts = db.query(models.Contact).filter(
                    or_(*location_filters)
                ).all()
                print(f"Filtering contacts for multiple locations: {locations}")
            else:
                # Single location
                contacts = db.query(models.Contact).filter(
                    models.Contact.region.ilike(f"%{alert.location}%")
                ).all()
                print(f"Filtering contacts for location: {alert.location}")
            
            # If no contacts found for specific location(s)
            if not contacts:
                print(f"No contacts found for location(s): {alert.location}")
        else:
            # If no location specified, get all contacts
            contacts = db.query(models.Contact).all()
            print("No location specified, notifying all contacts")
        
        success_count = 0
        notification_count = 0
        
        for contact in contacts:
            sent_via_phone = False
            sent_via_email = False
            
            if contact.phone:
                if notifier.send_sms(contact.phone, msg):
                    sent_via_phone = True
                    notification_count += 1
                    
            if contact.email:
                subject = f"[{severity}] Coastal Threat Alert - {metric.replace('_', ' ').title()}"
                if notifier.send_email(contact.email, subject, msg):
                    sent_via_email = True
                    notification_count += 1
            
            # Count contact only once even if notified via multiple channels
            if sent_via_phone or sent_via_email:
                success_count += 1
        
        log.sent = True
        db.commit()
        
        # Get total contacts in database for comparison
        total_db_contacts = db.query(models.Contact).count()
        
        return {
            "alert": True,
            "severity": severity,
            "sent_to": success_count,  # Number of unique contacts notified
            "notifications_sent": notification_count,  # Total notifications (SMS + Email)
            "area_contacts": len(contacts),  # Contacts in the affected area
            "total_contacts": total_db_contacts,  # Total contacts in database
            "location": alert.location.replace('|', ', ') if alert.location else "All Regions",
            "message": msg
        }
    
    return {
        "alert": False,
        "severity": "NORMAL",
        "message": f"Value {value:.2f} is below threshold {threshold:.2f}"
    }

@app.get("/api/alerts/logs", response_model=List[schemas.AlertLogOut])
def alert_logs(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.AlertLog).order_by(models.AlertLog.created_at.desc()).limit(limit).all()

@app.get("/api/thresholds")
def get_thresholds():
    return THRESHOLDS

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_contacts = db.query(models.Contact).count()
    total_alerts = db.query(models.AlertLog).count()
    alerts_sent = db.query(models.AlertLog).filter(models.AlertLog.sent == True).count()
    
    return {
        "total_contacts": total_contacts,
        "total_alerts": total_alerts,
        "alerts_sent": alerts_sent,
        "thresholds": THRESHOLDS
    }

# API Testing Endpoints - For Model Testing with Dummy Data
@app.get("/api/test/contacts")
def get_test_contacts():
    """Returns dummy contact data for testing purposes"""
    return [
        {
            "id": 101,
            "name": "Test User 1",
            "email": "test1@example.com",
            "phone": "+1234567890",
            "region": "North Coast",
            "is_active": True
        },
        {
            "id": 102,
            "name": "Test User 2",
            "email": "test2@example.com",
            "phone": "+1234567891",
            "region": "South Coast",
            "is_active": True
        },
        {
            "id": 103,
            "name": "Test User 3",
            "email": "test3@example.com",
            "phone": "+1234567892",
            "region": "East Coast",
            "is_active": True
        },
        {
            "id": 104,
            "name": "Test User 4",
            "email": "test4@example.com",
            "phone": "+1234567893",
            "region": "West Coast",
            "is_active": True
        },
        {
            "id": 105,
            "name": "Test User 5",
            "email": "test5@example.com",
            "phone": "+1234567894",
            "region": "Central Region",
            "is_active": True
        },
        {
            "id": 106,
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+1234567895",
            "region": "North Coast",
            "is_active": True
        },
        {
            "id": 107,
            "name": "Sarah Johnson",
            "email": "sarah.j@example.com",
            "phone": "+1234567896",
            "region": "South Coast",
            "is_active": True
        },
        {
            "id": 108,
            "name": "Mike Davis",
            "email": "mike.davis@example.com",
            "phone": "+1234567897",
            "region": "East Coast",
            "is_active": True
        },
        {
            "id": 109,
            "name": "Emily Wilson",
            "email": "emily.w@example.com",
            "phone": "+1234567898",
            "region": "West Coast",
            "is_active": True
        },
        {
            "id": 110,
            "name": "Robert Brown",
            "email": "robert.b@example.com",
            "phone": "+1234567899",
            "region": "North Coast",
            "is_active": True
        },
        {
            "id": 111,
            "name": "Lisa Anderson",
            "email": "lisa.anderson@example.com",
            "phone": "+1234567900",
            "region": "Central Region",
            "is_active": True
        },
        {
            "id": 112,
            "name": "David Martinez",
            "email": "david.m@example.com",
            "phone": "+1234567901",
            "region": "South Coast",
            "is_active": True
        },
        {
            "id": 113,
            "name": "Jennifer Taylor",
            "email": "jennifer.t@example.com",
            "phone": "+1234567902",
            "region": "East Coast",
            "is_active": True
        },
        {
            "id": 114,
            "name": "William Jones",
            "email": "william.jones@example.com",
            "phone": "+1234567903",
            "region": "West Coast",
            "is_active": True
        },
        {
            "id": 115,
            "name": "Maria Garcia",
            "email": "maria.g@example.com",
            "phone": "+1234567904",
            "region": "North Coast",
            "is_active": True
        },
        {
            "id": 116,
            "name": "James Miller",
            "email": "james.miller@example.com",
            "phone": "+1234567905",
            "region": "South Coast",
            "is_active": True
        },
        {
            "id": 117,
            "name": "Patricia Lee",
            "email": "patricia.lee@example.com",
            "phone": "+1234567906",
            "region": "Central Region",
            "is_active": True
        },
        {
            "id": 118,
            "name": "Christopher White",
            "email": "chris.white@example.com",
            "phone": "+1234567907",
            "region": "East Coast",
            "is_active": True
        },
        {
            "id": 119,
            "name": "Nancy Harris",
            "email": "nancy.h@example.com",
            "phone": "+1234567908",
            "region": "West Coast",
            "is_active": True
        },
        {
            "id": 120,
            "name": "Daniel Clark",
            "email": "daniel.clark@example.com",
            "phone": "+1234567909",
            "region": "North Coast",
            "is_active": True
        },
        {
            "id": 121,
            "name": "Karen Lewis",
            "email": "karen.lewis@example.com",
            "phone": "+1234567910",
            "region": "South Coast",
            "is_active": True
        },
        {
            "id": 122,
            "name": "Thomas Robinson",
            "email": "thomas.r@example.com",
            "phone": "+1234567911",
            "region": "Central Region",
            "is_active": True
        },
        {
            "id": 123,
            "name": "Sandra Walker",
            "email": "sandra.walker@example.com",
            "phone": "+1234567912",
            "region": "East Coast",
            "is_active": True
        },
        {
            "id": 124,
            "name": "Kevin Hall",
            "email": "kevin.hall@example.com",
            "phone": "+1234567913",
            "region": "West Coast",
            "is_active": True
        },
        {
            "id": 125,
            "name": "Angela Young",
            "email": "angela.young@example.com",
            "phone": "+1234567914",
            "region": "North Coast",
            "is_active": True
        }
    ]

@app.post("/api/test/alert")
def trigger_test_alert(alert: schemas.AlertIn, db: Session = Depends(get_db)):
    """
    Test endpoint that simulates alert processing without actually sending notifications.
    Returns what would be sent without actually sending.
    """
    metric = alert.metric
    value = alert.value
    threshold = THRESHOLDS.get(metric)
    
    if threshold is None:
        raise HTTPException(status_code=400, detail=f"Unknown metric: {metric}. Available metrics: {list(THRESHOLDS.keys())}")

    severity = "CRITICAL" if value > threshold * 1.5 else "HIGH" if value > threshold else "NORMAL"
    
    # Create log entry but mark as test
    log = models.AlertLog(
        metric=f"TEST_{metric}",
        value=value,
        threshold=threshold,
        message="TEST MODE - No actual notifications sent",
        sent=False
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    test_contacts = get_test_contacts()
    notifications_to_send = []

    if value > threshold:
        location_str = f" at {alert.location}" if alert.location else ""
        msg = f"COASTAL THREAT ALERT [{severity}]\\n"
        msg += f"Metric: {metric.replace('_', ' ').title()}\\n"
        msg += f"Current: {value:.2f} (Threshold: {threshold:.2f})\\n"
        msg += f"Location: {alert.location or 'Coastal Region'}\\n"
        msg += f"Take immediate precautions!"
        
        log.message = f"TEST MODE: {msg}"
        
        # Filter test contacts by location if specified
        filtered_contacts = test_contacts
        if alert.location:
            if '|' in alert.location:
                locations = alert.location.split('|')
                filtered_contacts = [c for c in test_contacts if any(loc.strip().lower() in c['region'].lower() for loc in locations)]
            else:
                filtered_contacts = [c for c in test_contacts if alert.location.lower() in c['region'].lower()]
        
        # Simulate notifications
        for contact in filtered_contacts:
            notification = {
                "contact_id": contact['id'],
                "contact_name": contact['name'],
                "methods": []
            }
            
            if contact['phone']:
                notification['methods'].append({
                    "type": "SMS",
                    "to": contact['phone'],
                    "message": msg
                })
            
            if contact['email']:
                notification['methods'].append({
                    "type": "EMAIL",
                    "to": contact['email'],
                    "subject": f"[{severity}] Coastal Threat Alert - {metric.replace('_', ' ').title()}",
                    "message": msg
                })
            
            notifications_to_send.append(notification)
        
        db.commit()
        
        return {
            "status": "TEST_MODE",
            "severity": severity,
            "metric": metric,
            "value": value,
            "threshold": threshold,
            "exceeded": True,
            "message": msg,
            "location_filter": alert.location,
            "contacts_to_notify": len(filtered_contacts),
            "notifications": notifications_to_send,
            "log_id": log.id,
            "note": "This is a test simulation. No actual notifications were sent."
        }
    else:
        return {
            "status": "TEST_MODE",
            "severity": severity,
            "metric": metric,
            "value": value,
            "threshold": threshold,
            "exceeded": False,
            "message": f"Value {value} is within normal range (threshold: {threshold})",
            "contacts_to_notify": 0,
            "notifications": [],
            "log_id": log.id,
            "note": "This is a test simulation. Value is below threshold."
        }