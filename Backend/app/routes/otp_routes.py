from fastapi import APIRouter, HTTPException, Query
import imaplib
import email
import re
import smtplib
from email.mime.text import MIMEText
from email.header import Header

router = APIRouter(prefix="/otp", tags=["OTP"])

# ตั้งค่าบัญชีเมลตำรวจ
POLICE_EMAIL = "suphakorn04413@gmail.com"
POLICE_PASSWORD = "hicgmcrpnmenjqmw"
IMAP_SERVER = "imap.gmail.com"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# === 1. อ่าน OTP จากเมลตำรวจ ===
@router.get("/get")
def get_otp(subject_keyword: str = Query("OTP", description="Keyword in subject")):
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER)
        mail.login(POLICE_EMAIL, POLICE_PASSWORD)
        mail.select("inbox")

        result, data = mail.search(None, f'(SUBJECT "{subject_keyword}")')
        if result != "OK":
            raise HTTPException(status_code=500, detail="Error searching inbox")

        email_ids = data[0].split()
        if not email_ids:
            return {"message": "No OTP emails found"}

        latest_email_id = email_ids[-1]
        result, data = mail.fetch(latest_email_id, "(RFC822)")
        raw_email = data[0][1]
        message = email.message_from_bytes(raw_email)

        # ดึงข้อความ
        msg_body = ""
        if message.is_multipart():
            for part in message.walk():
                if part.get_content_type() == "text/plain":
                    msg_body = part.get_payload(decode=True).decode()
                    break
        else:
            msg_body = message.get_payload(decode=True).decode()

        otp_match = re.search(r"\b(\d{6})\b", msg_body)
        if not otp_match:
            return {"message": "OTP not found in email"}

        return {
            "otp": otp_match.group(1),
            "from": message["From"],
            "subject": message["Subject"],
            "date": message["Date"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 2. Mock ส่งอีเมลไปยังเมลตำรวจ ===
@router.post("/mock-send")
def mock_send_otp_email(otp: str = Query(..., description="OTP to send")):
    try:
        # สร้างข้อความ
        subject = "รหัส OTP สำหรับการเข้าใช้งานระบบ"
        body = f"รหัส OTP ของคุณคือ {otp}"

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = POLICE_EMAIL
        msg["To"] = POLICE_EMAIL

        # ส่งอีเมลผ่าน SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(POLICE_EMAIL, POLICE_PASSWORD)
        server.sendmail(POLICE_EMAIL, [POLICE_EMAIL], msg.as_string())
        server.quit()

        return {"message": "Mock OTP email sent successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
