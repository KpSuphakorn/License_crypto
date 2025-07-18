from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv
import os
import imaplib
import email
import re
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from email.utils import parsedate_to_datetime, parseaddr
from zoneinfo import ZoneInfo

load_dotenv()
print("LICENSE2_EMAIL:", os.getenv("LICENSE2_EMAIL"))
print("LICENSE2_PASSWORD:", os.getenv("LICENSE2_PASSWORD"))

LICENSE_ACCOUNTS = {
    f"license{i}": {
        "email": os.getenv(f"LICENSE{i}_EMAIL"),
        "password": os.getenv(f"LICENSE{i}_PASSWORD")
    } for i in range(1, 13)
}
print("LICENSE_ACCOUNTS:", LICENSE_ACCOUNTS)

IMAP_SERVER = os.getenv("IMAP_SERVER")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))

router = APIRouter(prefix="/otp", tags=["OTP"])

@router.get("/get")
def get_otp(
    subject_keyword: str = Query("OTP", description="Keyword in subject"),
    license_id: str = Query(..., description="License ID (e.g., license1, license2)"),
):
    license_id = license_id.strip()  # ลบ whitespace หรือ newline
    print(f"Received license_id: {license_id}")
    if license_id not in LICENSE_ACCOUNTS or not LICENSE_ACCOUNTS[license_id]["email"]:
        print(f"Invalid license_id: {license_id}")
        raise HTTPException(status_code=400, detail="Invalid license ID")
    
    license = LICENSE_ACCOUNTS[license_id]
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(license["email"], license["password"])
        mail.select("inbox")

        result, data = mail.search(None, f'(TEXT "{subject_keyword}")')
        if result != "OK":
            raise HTTPException(status_code=500, detail="Error searching inbox")

        email_ids = data[0].split()
        if not email_ids:
            return {"message": "No OTP emails found"}

        for email_id in reversed(email_ids):
            result, data = mail.fetch(email_id, "(RFC822)")
            raw_email = data[0][1]
            message = email.message_from_bytes(raw_email)

            from_addr = parseaddr(message["From"])[1]
            if from_addr.strip().lower() != license["email"].strip().lower():
                continue

            msg_body = ""
            if message.is_multipart():
                for part in message.walk():
                    content_type = part.get_content_type()
                    if content_type in ("text/html", "text/plain"):
                        msg_body = part.get_payload(decode=True).decode()
                        break
            else:
                msg_body = message.get_payload(decode=True).decode()

            otp_match = re.search(r"\b\d{6}\b", msg_body)
            if not otp_match:
                continue

            email_datetime = parsedate_to_datetime(message["Date"])
            thai_time = email_datetime.astimezone(ZoneInfo("Asia/Bangkok"))
            formatted_date = thai_time.strftime("%Y-%m-%d %H:%M:%S")

            return {
                "otp": otp_match.group(0),
                "from": message["From"],
                "to": message.get("To", ""),
                "subject": message["Subject"],
                "date": formatted_date,
                "license_id": license_id
            }

        return {"message": "No matching OTP email found from specified sender"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch OTP: {str(e)}")

@router.post("/mock-send")
def mock_send_otp_email(
    otp: str = Query(..., description="OTP to send"),
    license_id: str = Query(..., description="License ID (e.g., license1, license2)"),
):
    try:
        if license_id not in LICENSE_ACCOUNTS:
            raise HTTPException(status_code=400, detail="Invalid license ID")

        license = LICENSE_ACCOUNTS[license_id]
        if not license["email"] or not license["password"]:
            raise HTTPException(status_code=400, detail="License email or password not configured")

        subject = "รหัส OTP สำหรับการเข้าใช้งานระบบ"
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; text-align: center; background-color: #f2f2f2; padding: 30px;">
            <div style="background-color: white; max-width: 500px; margin: auto; padding: 40px; border-radius: 10px;">
                <h2 style="margin-bottom: 20px;">รหัสลงชื่อเข้าใช้</h2>
                <p style="color: #555;">นี่คือรหัสลงชื่อเข้าใช้ของคุณ:</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">{otp}</div>
                <p style="color: #999;">รหัสจะหมดอายุในเร็ว ๆ นี้</p>
            </div>
        </body>
        </html>
        """

        msg = MIMEText(html_body, "html", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = f"License <{license['email']}>"
        msg["To"] = license["email"]

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(license["email"], license["password"])
        server.sendmail(license["email"], [license["email"]], msg.as_string())
        server.quit()

        return {"message": f"Mock OTP email sent to {license['email']} from {license['email']}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))