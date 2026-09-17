# PLAN.md

## Build Principle
สร้างทีละช่วงที่เล็กที่สุดและตรวจสอบได้จริง โดยทุกช่วงต้องจบด้วยสิ่งที่ผู้ใช้สามารถเปิดดูและตรวจสอบได้ ก่อนเริ่มช่วงถัดไป

## Phase Overview
- Phase 1: Project setup + Login + Role foundation
- Phase 2: Supply master data management
- Phase 3: Issue / เบิกของ
- Phase 4: Purchase flow + Receive stock + Invoice upload
- Phase 5: Dashboard + Alerts + Email notifications
- Phase 6: History + Final review

---

## Phase 1: Project setup + Login + Role foundation

### Goal
ให้ระบบเริ่มต้นใช้งานได้ มีการ Login และแยกสิทธิ์พื้นฐานตามบทบาท

### What to Build
- ตั้งค่าโปรเจกต์เว็บ
- ตั้งค่า database และ auth
- สร้างหน้า Login
- สร้างโครง navigation พื้นฐาน
- สร้าง role 3 แบบ: user, purchaser, admin
- จำกัดการเข้าถึงหน้าพื้นฐานตาม role

### What the User Should See or Do
- เปิดเว็บได้
- Login ได้
- เห็นเมนูพื้นฐานหลัง login
- แต่ละ role เห็นสิทธิ์การใช้งานต่างกันตามที่กำหนด

### User Check Checklist
- เปิดเว็บได้จากลิงก์ที่ให้
- Login ได้อย่างน้อย 1 บัญชีทดสอบ
- Logout ได้
- role แต่ละแบบทำงานถูกต้อง
- หน้า protected ไม่เปิดให้ role ที่ไม่เกี่ยวข้องเข้าได้

### Acceptance Criteria
- ระบบ deploy ใช้งานได้
- Login/Logout ทำงานได้
- มี role-based access ขั้นพื้นฐาน
- มีเมนู/หน้า placeholder สำหรับส่วนหลัก

### Dependencies/Notes
- ต้องมีการตั้งค่า Supabase และสร้าง users เริ่มต้น
- ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase 2

---

## Phase 2: Supply master data management

### Goal
ให้สามารถจัดการข้อมูลรายการ Supply ได้

### What to Build
- หน้า Supply List
- หน้าเพิ่ม/แก้ไข Supply
- เก็บข้อมูล:
  - ชื่อรายการ
  - รหัส/ชื่อย่อ
  - supplier name
  - จำนวนคงเหลือ
  - หน่วย
  - ROP
  - lead time
  - สั่งซื้อครั้งล่าสุด
- ค้นหารายการพื้นฐาน
- หน้า Supply Detail เบื้องต้น

### What the User Should See or Do
- Admin หรือผู้มีสิทธิ์เพิ่มรายการ Supply ใหม่ได้
- แก้ไขข้อมูลได้
- เปิดดูรายละเอียดแต่ละรายการได้
- เห็น stock คงเหลือและ ROP ชัดเจน

### User Check Checklist
- เพิ่ม item ใหม่ได้
- แก้ไข item ได้
- ค้นหาด้วยชื่อหรือรหัสได้
- ข้อมูลบันทึกและแสดงผลถูกต้อง

### Acceptance Criteria
- CRUD ขั้นพื้นฐานของ Supply ทำงานได้
- ข้อมูลหลักทุก field ที่ตกลงไว้มีในระบบ
- หน้า list และ detail ใช้งานได้ทั้งมือถือและคอม

### Dependencies/Notes
- ต้องผ่าน Phase 1 ก่อน
- ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase 3

---

## Phase 3: Issue / เบิกของ

### Goal
ให้ผู้ใช้เบิกของได้ และ stock ลดทันที

### What to Build
- หน้าเบิกของแบบ mobile-friendly
- เลือก item
- กรอกจำนวนที่เบิก
- บันทึกการเบิก
- ตัด stock ทันที
- กันการเบิกเกิน stock
- บันทึก movement history สำหรับ issue

### What the User Should See or Do
- ผู้ใช้เปิดมือถือแล้วเบิกของได้สะดวก
- เห็น stock ก่อนเบิก
- หลังเบิกเห็นผลสำเร็จและ stock ใหม่

### User Check Checklist
- เลือก item ได้
- กรอกจำนวนได้
- เบิกสำเร็จแล้ว stock ลดจริง
- เบิกเกินจำนวนคงเหลือไม่ได้
- มีประวัติการเบิกถูกบันทึก

### Acceptance Criteria
- การเบิกทำงานครบ flow
- stock update ถูกต้อง
- history ถูกสร้างทุกครั้ง
- ใช้งานบนมือถือได้สะดวก

### Dependencies/Notes
- ต้องผ่าน Phase 2 ก่อน
- ยังไม่ต้องมี email notification ครบทั้งหมดใน phase นี้
- ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase 4

---

## Phase 4: Purchase flow + Receive stock + Invoice upload

### Goal
ให้ผู้ซื้อทำรายการสั่งซื้อและรับของเข้าได้ครบ

### What to Build
- ปุ่ม/ฟอร์ม “สั่งซื้อแล้ว”
- ฟอร์มระบุ:
  - จำนวนที่สั่ง
  - วันที่คาดว่าของจะเข้า
- สถานะรายการสั่งซื้อ
- ฟอร์ม “รับของเข้า”
- ระบุจำนวนที่รับจริง
- อัปโหลดรูป invoice
- เพิ่ม stock เมื่อรับของเข้า
- อัปเดต last purchase date
- บันทึก movement history สำหรับ order และ receive

### What the User Should See or Do
- ผู้ซื้อเลือก item ที่ต้องสั่งได้
- ระบุ expected arrival date ได้
- กลับมาเปิดรายการเดิมเพื่อรับของเข้าได้
- แนบรูป invoice ได้
- stock เพิ่มทันทีหลังรับของเข้า

### User Check Checklist
- กดสั่งซื้อแล้วและบันทึกได้
- เห็นรายการค้างรับ
- กดรับของเข้าได้
- อัปโหลดรูป invoice ได้
- stock เพิ่มถูกต้อง
- last purchase date อัปเดต
- ประวัติครบ

### Acceptance Criteria
- purchase flow และ receive flow ทำงานครบ
- มีการเก็บข้อมูล expected arrival date และ invoice image
- movement history ครบสำหรับ order และ receive

### Dependencies/Notes
- ต้องผ่าน Phase 3 ก่อน
- ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase 5

---

## Phase 5: Dashboard + Alerts + Email notifications

### Goal
ให้ผู้ใช้งานเห็นภาพรวมและได้รับแจ้งเตือนตามกติกาที่กำหนด

### What to Build
- Dashboard
- Summary cards
- รายการ item ต่ำกว่า/เท่ากับ ROP
- รายการ purchase ที่ overdue
- รายการที่เพิ่งรับเข้า
- ระบบอีเมลแจ้งเตือน:
  - ของขาด/ถึงจุดต้องสั่งซื้อ
  - ของยังไม่เข้าตามกำหนด
  - ของเข้าแล้ว
- หน้าจัดการอีเมลเพิ่มเติมสำหรับรับแจ้งเตือน

### What the User Should See or Do
- เปิด Dashboard แล้วเห็นสิ่งที่ต้องทำทันที
- Admin เพิ่มอีเมลรับแจ้งเตือนได้
- ผู้เกี่ยวข้องได้รับอีเมลเมื่อเกิดเหตุการณ์ที่กำหนด

### User Check Checklist
- Dashboard แสดงรายการเตือนถูกต้อง
- Item ต่ำกว่า/เท่ากับ ROP แสดงถูกต้อง
- Overdue แสดงถูกต้อง
- เพิ่มอีเมลเพิ่มเติมได้
- ระบบส่งอีเมลได้ในแต่ละกรณี

### Acceptance Criteria
- Dashboard ใช้งานได้จริง
- การคำนวณสถานะเตือนถูกต้อง
- Email notification ทำงานในกรณีหลักครบ

### Dependencies/Notes
- ต้องผ่าน Phase 4 ก่อน
- เรื่องป้องกันอีเมลซ้ำอาจใช้กติกาเรียบง่ายในเวอร์ชันแรก
- ต้องหยุดรอผู้ใช้อนุมัติก่อนเริ่ม Phase 6

---

## Phase 6: History + Final review

### Goal
ให้ตรวจสอบย้อนหลังได้ครบ และเตรียมระบบพร้อมใช้งานเวอร์ชันแรก

### What to Build
- หน้า History
- filter ขั้นพื้นฐาน
- แสดงประวัติ:
  - ใครทำ
  - ทำอะไร
  - item ไหน
  - จำนวนเท่าไร
  - เมื่อไร
- ตรวจความครบถ้วนของ flow หลัก
- เก็บรายละเอียดแก้ไขเล็กน้อยจากผู้ใช้

### What the User Should See or Do
- เปิดดูประวัติย้อนหลังได้
- ค้นหารายการเคลื่อนไหวได้
- ทดลองใช้งานครบ flow หลักตั้งแต่เบิก → สั่งซื้อ → รับของเข้า → แจ้งเตือน

### User Check Checklist
- ประวัติขึ้นครบตามการกระทำจริง
- ข้อมูลอ่านง่าย
- flow หลักทั้งหมดใช้งานได้ครบ
- ไม่มีจุดสำคัญที่ใช้งานต่อไม่ได้

### Acceptance Criteria
- history ทำงานได้
- เวอร์ชันแรกครบตาม PRODUCT.md
- ผู้ใช้ตรวจรับและอนุมัติได้

### Dependencies/Notes
- ต้องผ่าน Phase 5 ก่อน
- หลังจบ phase นี้ ให้สรุปสิ่งที่พร้อมใช้งานและ open issues ถ้ามี