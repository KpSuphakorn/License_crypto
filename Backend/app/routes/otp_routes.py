from fastapi import APIRouter, HTTPException, Query
import imaplib
import email
import re
import smtplib
import os
from email.mime.text import MIMEText
from email.header import Header
from email.utils import parsedate_to_datetime
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

load_dotenv()

POLICE_EMAIL = os.getenv("POLICE_EMAIL")
POLICE_PASSWORD = os.getenv("POLICE_PASSWORD")
IMAP_SERVER = os.getenv("IMAP_SERVER")
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))

router = APIRouter(prefix="/otp", tags=["OTP"])

# === 1. อ่าน OTP จากเมล ===
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

        # ดึงข้อความจาก email (รองรับทั้ง HTML และ plain text)
        msg_body = ""
        if message.is_multipart():
            for part in message.walk():
                content_type = part.get_content_type()
                if content_type == "text/html":
                    msg_body = part.get_payload(decode=True).decode()
                    break
                elif content_type == "text/plain":
                    msg_body = part.get_payload(decode=True).decode()
        else:
            msg_body = message.get_payload(decode=True).decode()

        # ค้นหา OTP ที่เป็นเลข 6 หลัก
        otp_match = re.search(r"\b\d{6}\b", msg_body)
        if not otp_match:
            return {"message": "OTP not found in email"}

        # แปลงเวลาเป็นเวลาไทย
        email_datetime = parsedate_to_datetime(message["Date"])
        thai_time = email_datetime.astimezone(ZoneInfo("Asia/Bangkok"))
        formatted_date = thai_time.strftime("%Y-%m-%d %H:%M:%S")

        return {
            "otp": otp_match.group(0),
            "from": message["From"],
            "subject": message["Subject"],
            "date": formatted_date
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 2. Mock ส่งอีเมล OTP แบบ HTML ===
@router.post("/mock-send")
def mock_send_otp_email(otp: str = Query(..., description="OTP to send")):
    try:
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
            <p style="margin-top: 40px; font-size: 12px; color: #999;">
                เข้าไปที่ <a href="#" style="color: red;">การจัดการบัญชี</a> เพื่อยกเลิกวิธีการยืนยันตัวตนที่คุณไม่ต้องการ
            </p>
        </body>
        </html>
        """

        msg = MIMEText(html_body, "html", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = "Chainalysis <" + POLICE_EMAIL + ">"
        msg["To"] = POLICE_EMAIL

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(POLICE_EMAIL, POLICE_PASSWORD)
        server.sendmail(POLICE_EMAIL, [POLICE_EMAIL], msg.as_string())
        server.quit()

        return {"message": "Mock OTP email sent successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
