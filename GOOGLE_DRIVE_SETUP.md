# Google Drive Upload Setup Guide

## ขั้นตอนการตั้งค่า Google Drive API

### 1. สร้าง Google Cloud Project
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่
3. ตั้งชื่อ Project (เช่น "Librarian Process")

### 2. เปิดใช้งาน Google Drive API
1. ใน Google Cloud Console ค้นหา "Google Drive API"
2. คลิก "Enable" เพื่อเปิดใช้งาน

### 3. สร้าง Service Account
1. ไปที่ "IAM & Admin" > "Service Accounts"
2. คลิก "Create Service Account"
3. ตั้งชื่อ Service Account (เช่น "librarian-drive")
4. คลิก "Create And Continue"
5. ให้สิทธิ์ "Editor" บนโปรเจกต์ (ตัวเลือก: Basic > Editor)
6. คลิก "Continue" แล้วคลิก "Done"

### 4. สร้าง Private Key
1. ไปที่ Service Account ที่เพิ่งสร้าง
2. ไปที่ tab "Keys"
3. คลิก "Add Key" > "Create new key"
4. เลือก "JSON"
5. ดาวน์โหลด JSON file ที่ได้

### 5. ตั้งค่า Environment Variables

**สำหรับ Local Development:**

เลือกหนึ่งในสองตัวเลือก:

**ตัวเลือก A: ใช้ `.env.local` (แนะนำสำหรับความปลอดภัย)**
1. สร้างไฟล์ `.env.local` ในรูท project
2. เติมข้อมูลตามด้านล่าง

**ตัวเลือก B: ใช้ `.env.development` (สำหรับ dev environment เท่านั้น)**
1. สร้างไฟล์ `.env.development` ในรูท project
2. เติมข้อมูลตามด้านล่าง

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1Ga8-yLcJFGvmAl77MyCbnPp1DaAfFTed
```

**วิธีการดึงค่าจาก JSON file:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: ค่า "client_email"
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: ค่า "private_key" (ให้รักษา newline ไว้)

**Note:** ไม่ควร commit `.env.local` ขึ้น repository ทุกตัวเลือกถ้ามี secrets

### 6. แชร์ Google Drive Folder
1. ไปที่ Google Drive folder ที่ต้องการเก็บไฟล์
2. คลิกขวาบน folder > "Share"
3. คัดลอก email ของ Service Account และแชร์ให้สิทธิ์ "Editor"
4. ในที่อยู่ของ folder URL จะมี Folder ID เช่น:
   ```
   https://drive.google.com/drive/folders/1Ga8-yLcJFGvmAl77MyCbnPp1DaAfFTed
   ```
   ส่วน `1Ga8-yLcJFGvmAl77MyCbnPp1DaAfFTed` คือ Folder ID

## การใช้งาน

1. ในหน้า Quote Comparison คลิกปุ่ม "Upload"
2. เลือกหรือลาก-วางไฟล์ (JPG, PNG, PDF)
3. คลิก "Upload" 
4. ไฟล์จะถูกอัปโหลดไปยัง Google Drive folder ที่ตั้งค่าไว้

## Troubleshooting

### ข้อผิดพลาด: "Missing Google Drive configuration"
- ตรวจสอบว่าเติมค่า environment variables ครบหรือไม่
- ตรวจสอบว่าไฟล์ `.env.local` หรือ `.env.development` อยู่ในรูท project
- Restart development server หลังจากเพิ่ม env variables

### ข้อผิดพลาด: "Permission denied"
- ตรวจสอบว่าแชร์ Google Drive folder กับ Service Account แล้วหรือยัง

### ไฟล์ไม่ปรากฏใน Google Drive
- ตรวจสอบว่า Folder ID ถูกต้องหรือไม่
- ลองรีเฟรช Google Drive

## สำหรับ Development

ในการทดสอบในส่วนโลคัล:
```bash
npm run dev
```

ไปที่ `http://localhost:3000/quote-comparison`

## สำหรับ Production

### ตัวเลือก 1: ใช้ `.env.production.local`
1. สร้างไฟล์ `.env.production.local` (ตั้งค่าเฉพาะ production)
2. เพิ่มเติม env variables เดียวกัน
3. เพิ่ม `.env.production.local` ใน `.gitignore`

### ตัวเลือก 2: ใช้ Platform Secrets
สำหรับ Vercel, Netlify, Heroku เป็นต้น:
1. ไปที่ platform settings
2. เพิ่ม environment variables สำหรับ production
3. ไม่ต้องใช้ file-based env

### อะไรควร .gitignore
```
.env.local
.env.development.local
.env.production.local
```
