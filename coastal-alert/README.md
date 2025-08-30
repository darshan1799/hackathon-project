# Coastal Threat Alert System

A real-time monitoring and alert system for coastal threats including water levels, wind speeds, rainfall, wave heights, and storm surges. The system automatically sends notifications to registered contacts when sensor readings exceed safety thresholds.

## Features

- **Real-time Monitoring**: Track multiple coastal threat metrics
- **Automated Alerts**: Instant notifications via SMS and email when thresholds are exceeded
- **Contact Management**: Add, edit, and manage emergency contacts
- **Alert Simulator**: Test the system with simulated sensor readings
- **Alert History**: Complete log of all triggered alerts
- **Dashboard**: Visual overview of system status and statistics
- **Multi-channel Notifications**: Support for SMS (Twilio) and email (SMTP)

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React         │────▶│   FastAPI       │────▶│   SQLite DB     │
│   Frontend      │     │   Backend       │     │                 │
│   (Port 3000)   │     │   (Port 8000)   │     └─────────────────┘
└─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  Notification   │
                        │  Services       │
                        │  (Twilio/SMTP)  │
                        └─────────────────┘
```

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn package manager

## Quick Start

### Windows Users

1. Double-click `start.bat` or run in Command Prompt:
```bash
start.bat
```

### Linux/Mac Users

1. Make the script executable:
```bash
chmod +x start.sh
```

2. Run the startup script:
```bash
./start.sh
```

The script will:
- Check for required dependencies
- Create Python virtual environment
- Install all backend dependencies
- Install all frontend dependencies
- Create .env file from template
- Start both backend and frontend services
- Open the application in your browser

## Manual Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create .env file:
```bash
cp .env.example .env
```

6. Run the backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Configuration

### Alert Thresholds

Default thresholds are configured in `backend/app/main.py`:

| Metric | Threshold | Unit |
|--------|-----------|------|
| Water Level | 3.5 | meters |
| Wind Speed | 120.0 | km/h |
| Rainfall (24h) | 100.0 | mm |
| Wave Height | 5.0 | meters |
| Storm Surge | 2.0 | meters |

### Environment Variables

Edit `backend/.env` to configure notification services:

```env
# Database
DATABASE_URL=sqlite:///./alerts.db

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# SMTP Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com
```

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| GET | `/api/contacts` | List all contacts |
| POST | `/api/contacts` | Create new contact |
| PUT | `/api/contacts/{id}` | Update contact |
| DELETE | `/api/contacts/{id}` | Delete contact |
| POST | `/api/alerts` | Trigger alert (simulate sensor) |
| GET | `/api/alerts/logs` | Get alert history |
| GET | `/api/thresholds` | Get current thresholds |
| GET | `/api/stats` | Get system statistics |

## Usage Guide

### 1. Adding Contacts

1. Navigate to the "Contacts" tab
2. Fill in contact details (name, phone, email, region)
3. Click "Add Contact"
4. Contacts will receive alerts when thresholds are exceeded

### 2. Testing Alerts

1. Go to "Alert Simulator" tab
2. Select a metric type (e.g., water level)
3. Enter a value above the threshold
4. Click "Trigger Alert Test"
5. System will send notifications to all registered contacts

### 3. Monitoring Alerts

1. Check "Alert History" tab for all past alerts
2. View severity levels (NORMAL, HIGH, CRITICAL)
3. See which alerts triggered notifications
4. Filter by number of records

### 4. Dashboard Overview

- View total contacts registered
- Monitor total alerts triggered
- Check success rate of notifications
- Review current threshold settings

## Alert Severity Levels

- **NORMAL**: Value below threshold (no alert)
- **HIGH**: Value exceeds threshold (alert sent)
- **CRITICAL**: Value exceeds 1.5x threshold (urgent alert)

## Notification Channels

### SMS via Twilio
1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to `.env` file

### Email via SMTP
1. Configure SMTP settings in `.env`
2. For Gmail, use App Passwords (not regular password)
3. Enable 2FA and generate app-specific password

## Development

### Project Structure

```
coastal-alert/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database configuration
│   │   ├── notifier.py      # Notification service
│   │   └── config.py        # Settings management
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application
│   │   ├── Dashboard.jsx    # Dashboard component
│   │   ├── ContactManager.jsx # Contact management
│   │   ├── AlertSimulator.jsx # Alert testing
│   │   ├── AlertHistory.jsx # Alert logs
│   │   ├── api.js           # API client
│   │   └── styles.css       # Styling
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
├── start.sh                 # Linux/Mac startup script
├── start.bat               # Windows startup script
└── README.md               # Documentation
```

### Adding New Metrics

1. Add threshold in `backend/app/main.py`:
```python
THRESHOLDS = {
    "new_metric": 10.0,
    # ... existing metrics
}
```

2. Update frontend units in `AlertSimulator.jsx` and `Dashboard.jsx`:
```javascript
function getUnit(metric) {
  const units = {
    new_metric: 'unit',
    // ... existing units
  }
  return units[metric] || ''
}
```

### Customizing Notifications

Edit `backend/app/notifier.py` to add new notification channels:

```python
def send_whatsapp(self, to: str, message: str):
    # Implement WhatsApp notification
    pass

def send_telegram(self, to: str, message: str):
    # Implement Telegram notification
    pass
```

## Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Deployment

### Using Docker

1. Build the containers:
```bash
docker-compose build
```

2. Run the application:
```bash
docker-compose up
```

### Production Deployment

1. Use production database (PostgreSQL recommended)
2. Set secure environment variables
3. Enable HTTPS with SSL certificates
4. Use production WSGI server (Gunicorn)
5. Set up reverse proxy (Nginx)
6. Configure monitoring and logging

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (needs 3.8+)
- Verify virtual environment is activated
- Check port 8000 is not in use
- Review error messages in console

### Frontend won't start
- Check Node.js version: `node --version` (needs 14+)
- Delete `node_modules` and run `npm install` again
- Check port 3000 is not in use
- Clear browser cache

### Notifications not sending
- Verify credentials in `.env` file
- Check Twilio account has credits
- For email, ensure app passwords are used (not regular passwords)
- Check firewall settings

### Database issues
- Delete `alerts.db` to reset database
- Run backend to recreate tables automatically
- Check write permissions in backend directory

## Security Considerations

1. **Never commit `.env` file** to version control
2. Use strong passwords for SMTP
3. Implement rate limiting for alerts
4. Add authentication for production use
5. Use HTTPS in production
6. Validate and sanitize all inputs
7. Keep dependencies updated

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Real-time sensor integration (IoT devices)
- [ ] Machine learning for threat prediction
- [ ] Mobile application (React Native)
- [ ] Geographic mapping of threats
- [ ] Multi-language support
- [ ] WhatsApp Business API integration
- [ ] Weather API integration
- [ ] Historical data analytics
- [ ] User authentication and roles
- [ ] Automated evacuation route suggestions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Create an issue in the repository
- Contact the development team
- Check documentation at `/docs` endpoint

## Acknowledgments

- FastAPI for the backend framework
- React for the frontend framework
- SQLAlchemy for database ORM
- Twilio for SMS services
- Community contributors

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready