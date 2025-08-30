import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from .config import settings

class Notifier:
    def send_sms(self, to: str, message: str):
        sid = settings.twilio_sid
        token = settings.twilio_token
        from_num = settings.twilio_from
        
        if sid and token and from_num:
            try:
                from twilio.rest import Client
                client = Client(sid, token)
                msg = client.messages.create(
                    body=message,
                    from_=from_num,
                    to=to
                )
                print(f"SMS sent successfully to {to}: {msg.sid}")
                return True
            except Exception as e:
                print(f"Twilio error: {e}")
                return False
        else:
            print(f"[DEMO] SMS to {to}: {message}")
            return True

    def send_email(self, to_email: str, subject: str, body: str):
        if settings.smtp_host and settings.smtp_username and settings.smtp_password:
            try:
                msg = MIMEMultipart()
                msg['From'] = settings.smtp_from or settings.smtp_username
                msg['To'] = to_email
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))
                
                server = smtplib.SMTP(settings.smtp_host, settings.smtp_port or 587)
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(msg)
                server.quit()
                print(f"Email sent successfully to {to_email}")
                return True
            except Exception as e:
                print(f"Email error: {e}")
                return False
        else:
            print(f"[DEMO] EMAIL to {to_email}: {subject}\n{body}")
            return True

notifier = Notifier()