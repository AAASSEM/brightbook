"""
Email Utility — Sends real emails via SMTP or logs to console as a fallback.
Uses configurations from app.config.settings.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings


def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """
    Sends an email to the specified recipient using the SMTP configuration in settings.
    If the SMTP settings (user or password) are not configured, it logs the email to the console.
    
    Returns:
        bool: True if sent successfully (or successfully logged to console), False otherwise.
    """
    # Check if SMTP configuration is present
    has_smtp = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    
    if not has_smtp:
        print(f"\n📧 [SIMULATED EMAIL] (SMTP not configured in .env)")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {text_content or html_content}\n")
        return True

    try:
        # Create message container
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to_email

        # Attach text version
        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        
        # Attach HTML version
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Connect to SMTP server
        # Standard ports: 587 (STARTTLS) or 465 (SSL/TLS)
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.ehlo()
        server.starttls()  # Upgrade to secure connection
        server.ehlo()
        
        # Authenticate and send
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
        server.quit()
        
        print(f"📧 [REAL EMAIL SENT] Successfully sent reset email to {to_email}")
        return True

    except Exception as e:
        print(f"❌ [EMAIL ERROR] Failed to send email to {to_email} via SMTP: {e}")
        print(f"📧 [FALLBACK SIMULATION] Reset email details:")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: {text_content or html_content}\n")
        return False
