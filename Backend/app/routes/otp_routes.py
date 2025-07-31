from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv
import os
import imaplib
import email
import re
from email.utils import parsedate_to_datetime
from zoneinfo import ZoneInfo

load_dotenv()

LICENSE_ACCOUNTS = {
    f"license{i}": {
        "email": os.getenv(f"LICENSE{i}_EMAIL"),
        "password": os.getenv(f"LICENSE{i}_PASSWORD")
    } for i in range(1, 13)
}

IMAP_SERVER = os.getenv("IMAP_SERVER")

router = APIRouter(prefix="/otp", tags=["OTP"])

@router.get("/get")
def get_otp(
    subject_keyword: str = Query("Your one-time security code"),
    license_id: str = Query(...),
):
    license_id = license_id.strip()
    if license_id not in LICENSE_ACCOUNTS or not LICENSE_ACCOUNTS[license_id]["email"]:
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