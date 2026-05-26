# Librarian Process Web (Librairy)

ระบบเว็บแอปพลิเคชันสำหรับจัดการกระบวนการทำงานของบรรณารักษ์ (Librarian Process) ซึ่งเป็นส่วนหนึ่งของระบบ **Librairy (Automated Library Acquisition Workflow)** พัฒนาด้วย Next.js และถูกออกแบบมาให้รันผ่าน Docker ในโหมด Production 

---

## 🛠️ โครงสร้างและการตั้งค่าฐานข้อมูล (Database Configuration)

ระบบเชื่อมต่อกับฐานข้อมูล PostgreSQL โดยการตั้งค่า Connection Pool จะอยู่ที่ไฟล์ `lib/db.ts` ดังนี้:

```typescript
import { Pool } from 'pg';

// ตั้งค่า Connection Pool ตามข้อมูลใน pgAdmin หรือ Container
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'librairy', 
  user: 'admin',
  password: 'adminpass'
});
```

---

## 🐳 การเตรียมความพร้อมก่อนรัน (Prerequisites)

เนื่องจากระบบมีการรันผ่าน Docker Compose และทำงานร่วมกับ Reverse Proxy (Traefik) จึงจำเป็นต้องมี External Network ชื่อ `librairy-net` เพื่อให้ Container ต่างๆ มองเห็นกัน

**สร้าง Network ล่วงหน้า (รันเพียงครั้งแรก):**
```bash
docker network create librairy-net
```

---

## 🚀 วิธีการรันระบบ (How to Run)

การตั้งค่าใน `docker-compose.yml` ได้จัดการเรื่อง Environment, Port, และการตั้งค่า Traefik ไว้เรียบร้อยแล้ว

### ขั้นตอนการรัน
1. **เปิด Terminal** ในโฟลเดอร์ที่มีไฟล์ `docker-compose.yml` และ `Dockerfile`
2. **สั่งรันระบบแบบ Background (Detached mode):**
   ```bash
   docker compose up -d --build
   ```
3. **ตรวจสอบสถานะการรัน:**
   ```bash
   docker compose ps
   ```

### ช่องทางการเข้าถึง (Accessing the Application)
- **ผ่าน Domain (Traefik):** `http://librarian-process-web.library.work` 
  *(คุณต้องกำหนดค่า DNS หรือแก้ไขไฟล์ `/etc/hosts` ในเครื่องคอมพิวเตอร์ของคุณให้ชี้โดเมนนี้ไปยัง IP ของเซิร์ฟเวอร์ก่อน)*
- **ผ่าน IP/Localhost ตรงๆ:** `http://localhost:5000`

---

## 📦 โครงสร้างการทำงานของ Docker

### 1. Docker Compose Services
- คอนเทนเนอร์มีชื่อว่า `librarianweb`
- เปิดใช้งานบน Port `5000` (Mapping 5000:5000)
- รันบนสภาพแวดล้อม `NODE_ENV=production` และปิดการส่งข้อมูลสถิติของ Next.js (`NEXT_TELEMETRY_DISABLED=1`)
- มีการตั้งค่า **Traefik Labels** เพื่อช่วยทำ Load Balancing และจัดการ Domain Name โดยอัตโนมัติ

### 2. Dockerfile (Multi-stage Build)
ขั้นตอนการแพ็กแอปพลิเคชันถูกแบ่งเป็น 2 ส่วนเพื่อให้ Image มีขนาดเล็ก ปลอดภัย และทำงานอย่างเต็มประสิทธิภาพใน Production:
- **Builder Stage:** ทำหน้าที่โหลด Dependencies ทั้งหมดและรัน `npm run build` เพื่อแปลงโค้ด Next.js ให้พร้อมใช้งาน
- **Production Stage:** - ติดตั้ง `dumb-init` เพื่อจัดการ Signal (เช่น การปิดคอนเทนเนอร์แบบ Graceful shutdown) ได้อย่างถูกต้อง
  - นำเฉพาะไฟล์ที่จำเป็นจากการ Build (`node_modules` แบบ production, `.next`, และ `public`) มาใช้งาน
  - ใช้ `ENTRYPOINT` คู่กับ `dumb-init` ก่อนที่จะรัน `npm start`

---

## 💡 หมายเหตุและการแก้ไขปัญหาเบื้องต้น (Troubleshooting)

**ข้อควรระวังเรื่อง Healthcheck ใน Dockerfile:**
ใน `Dockerfile` มีคำสั่ง `HEALTHCHECK` ที่ยิงตรวจสอบไปที่ `http://localhost:3000/` แต่แอปพลิเคชันของคุณมีการอัปเดตไปใช้ Port `5000` (อ้างอิงจาก EXPOSE 5000) 
หากพบว่า Container แจ้งเตือนสถานะเป็น **Unhealthy** ให้ปรับแก้บรรทัด HEALTHCHECK ใน `Dockerfile` จากพอร์ต 3000 เป็น 5000 ดังนี้:
```dockerfile
# แก้ไขจาก 3000 เป็น 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3   CMD node -e "require('http').get('http://localhost:5000/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
```
