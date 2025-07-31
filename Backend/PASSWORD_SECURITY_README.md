# ระบบความปลอดภัยรหัสผ่าน (Password Security System)

## ภาพรวม
ระบบนี้ได้ถูกปรับปรุงให้มีความปลอดภัยมากขึ้นโดยการ hash รหัสผ่านก่อนเก็บในฐานข้อมูล

## การเปลี่ยนแปลงที่สำคัญ

### 1. การ Hash รหัสผ่าน
- ใช้ `bcrypt` library สำหรับ hash รหัสผ่าน
- รหัสผ่านจะถูก hash ด้วย salt ก่อนเก็บในฐานข้อมูล
- ไม่สามารถถอดรหัสกลับมาเป็น plain text ได้

### 2. ไฟล์ที่เพิ่มใหม่
- `app/utils/password_handler.py` - ฟังก์ชันสำหรับ hash และ verify รหัสผ่าน
- `migrate_passwords.py` - script สำหรับ migrate รหัสผ่านที่มีอยู่แล้ว
- `PASSWORD_SECURITY_README.md` - ไฟล์นี้

### 3. ไฟล์ที่แก้ไข
- `app/routes/auth_routes.py` - เพิ่มการ hash รหัสผ่านใน register และ verify ใน login
- `requirements.txt` - เพิ่ม dependency `bcrypt`

## การติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
cd Backend
pip install -r requirements.txt
```

### 2. Migrate รหัสผ่านที่มีอยู่แล้ว
หากมีผู้ใช้ในฐานข้อมูลแล้ว ให้รัน migration script:

```bash
cd Backend
python migrate_passwords.py
```

**คำเตือน**: ควร backup ฐานข้อมูลก่อนรัน migration script

## การทำงานของระบบ

### การลงทะเบียน (Register)
1. ผู้ใช้กรอกข้อมูลรวมถึงรหัสผ่าน
2. ระบบตรวจสอบความถูกต้องของข้อมูล
3. รหัสผ่านถูก hash ด้วย `bcrypt` และ salt
4. ข้อมูลถูกเก็บในฐานข้อมูล

### การเข้าสู่ระบบ (Login)
1. ผู้ใช้กรอกหมายเลขโทรศัพท์และรหัสผ่าน
2. ระบบค้นหาผู้ใช้จากหมายเลขโทรศัพท์
3. ระบบใช้ `bcrypt.checkpw()` เพื่อเปรียบเทียบรหัสผ่าน
4. หากตรงกัน จะสร้าง JWT token และส่งกลับ

## ความปลอดภัย

### 1. Salt
- แต่ละรหัสผ่านจะมี salt ที่แตกต่างกัน
- Salt ถูกสร้างโดย `bcrypt.gensalt()`
- ทำให้รหัสผ่านเดียวกันจะได้ hash ที่แตกต่างกัน

### 2. Hash Format
- รหัสผ่านที่ hash แล้วจะมีรูปแบบ: `$2b$12$...`
- `$2b$` = bcrypt version
- `12` = cost factor (จำนวนรอบการ hash)

### 3. ไม่สามารถถอดรหัสได้
- bcrypt เป็น one-way hash function
- ไม่สามารถแปลง hash กลับเป็น plain text ได้
- การตรวจสอบทำได้โดยการ hash รหัสผ่านที่ผู้ใช้กรอกแล้วเปรียบเทียบ

## การทดสอบ

### ทดสอบการ Hash
```python
from app.utils.password_handler import hash_password, verify_password

# Hash รหัสผ่าน
hashed = hash_password("mypassword123")
print(f"Hashed: {hashed}")

# ตรวจสอบรหัสผ่าน
is_valid = verify_password("mypassword123", hashed)
print(f"Valid: {is_valid}")  # True

is_invalid = verify_password("wrongpassword", hashed)
print(f"Invalid: {is_invalid}")  # False
```

## หมายเหตุสำคัญ

1. **Backup ฐานข้อมูล**: ควร backup ฐานข้อมูลก่อนรัน migration
2. **รหัสผ่านเก่า**: รหัสผ่านที่ hash แล้วจะไม่สามารถดูเป็น plain text ได้อีก
3. **การ Reset รหัสผ่าน**: หากต้องการ reset รหัสผ่าน ต้องสร้างรหัสผ่านใหม่และ hash ใหม่
4. **Performance**: bcrypt ใช้เวลานานกว่า MD5/SHA แต่ปลอดภัยกว่า

## การแก้ไขปัญหา

### ปัญหา: ไม่สามารถ login ได้หลัง migration
**สาเหตุ**: รหัสผ่านในฐานข้อมูลยังเป็น plain text
**วิธีแก้**: รัน migration script อีกครั้ง

### ปัญหา: bcrypt ไม่ติดตั้ง
**สาเหตุ**: ไม่ได้ติดตั้ง dependencies
**วิธีแก้**: รัน `pip install -r requirements.txt`

### ปัญหา: Migration ไม่ทำงาน
**สาเหตุ**: ไม่มีไฟล์ .env หรือการตั้งค่าไม่ถูกต้อง
**วิธีแก้**: ตรวจสอบไฟล์ .env และการตั้งค่า MongoDB 