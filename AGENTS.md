# AGENTS.md

## Project Purpose
สร้างเว็บแอพสำหรับจัดการ Supply ภายในองค์กร โดยรองรับการเบิกของ การสั่งซื้อ การรับของเข้า การติดตาม ROP การแจ้งเตือนทางอีเมล และการดูประวัติการเคลื่อนไหว

## Working Principles
- สร้างเวอร์ชันแรกให้เล็กที่สุด แต่ใช้งานได้จริง
- เน้น flow หลักก่อน
- ใช้ภาษาง่าย อธิบายสิ่งที่ผู้ใช้ต้องตรวจให้ชัด
- ทุก phase ต้องมีผลลัพธ์ที่ผู้ใช้เปิดดูและตรวจได้จริง
- ถ้ามีข้อสงสัยที่ไม่กระทบการเริ่ม phase ให้ใช้ทางเลือกที่ง่ายที่สุดก่อน

## Tech/Scope Guardrails
- Platform หลัก: browser-based web app
- Stack ที่แนะนำ:
  - Next.js
  - Supabase (DB/Auth/Storage)
  - Vercel
  - Resend
- หลีกเลี่ยงการเพิ่ม scope เกิน PRODUCT.md
- ห้ามเพิ่มฟีเจอร์ขั้นสูงเอง เช่น OCR, barcode scan, integrations ภายนอก, analytics ซับซ้อน เว้นแต่ผู้ใช้ขอ
- รักษาเวอร์ชันแรกให้ lean ที่สุด

## File Responsibilities
- PRODUCT.md = what to build
- DESIGN.md = how it should look and feel
- PLAN.md = planned sequence
- PROGRESS-TRACKER.md = current status and approval state
- AGENTS.md = working rules

## Phase Workflow
สำหรับทุก phase:
1. อ่าน PRODUCT.md, DESIGN.md, PLAN.md ก่อนเริ่ม
2. ทำเฉพาะสิ่งที่อยู่ใน phase ปัจจุบัน
3. อัปเดต PROGRESS-TRACKER.md ระหว่างทำงาน
4. เมื่อ phase พร้อมตรวจ ให้หยุด
5. สรุปสิ่งที่สร้างเสร็จ
6. บอกผู้ใช้ให้ตรวจอะไรบ้างแบบเป็นข้อ
7. รอ approval แบบ explicit
8. ค่อยเริ่ม phase ถัดไปหลังได้รับ approval เท่านั้น

## Mandatory User Approval Gate
**DO NOT EVER proceed to the next phase unless the user has explicitly approved the current phase.**

กฎนี้สำคัญที่สุด และมีผลเหนือความเร็ว ความสะดวก การทำงานต่อเนื่อง หรือการคาดเดาว่าผู้ใช้น่าจะโอเคแล้ว

เงื่อนไขเพิ่มเติม:
- ห้าม scaffold หรือเตรียม phase ถัดไปล่วงหน้า
- ห้ามเริ่ม phase ถัดไปเพราะ test ผ่าน
- ห้ามเริ่ม phase ถัดไปเพราะ deploy สำเร็จ
- ห้ามเริ่ม phase ถัดไปเพราะไม่มี feedback
- silence ไม่ถือว่าอนุมัติ
- “น่าจะโอเค” ไม่ถือว่าอนุมัติ
- ต้องมีคำอนุมัติชัดเจนจากผู้ใช้เท่านั้น

## How to Present a Phase for Review
เมื่อจบแต่ละ phase ต้องแจ้งผู้ใช้ดังนี้:
1. สิ่งที่สร้างเสร็จใน phase นี้
2. วิธีเข้าใช้งาน / ลิงก์ / บัญชีทดสอบ (ถ้ามี)
3. สิ่งที่ผู้ใช้ควรลองทำทีละข้อ
4. checklist สำหรับตรวจรับ
5. ปัญหาที่พบหรือข้อจำกัดที่ยังมี
6. ขอให้ผู้ใช้ตอบชัดเจนว่า:
   - “Approve Phase X”
   - หรือแจ้งสิ่งที่ต้องแก้

## Change Handling
- ถ้าผู้ใช้ขอแก้ไขใน phase ปัจจุบัน ให้คง phase เดิมไว้ก่อน
- อัปเดต PROGRESS-TRACKER.md เป็น “Needs changes” หากจำเป็น
- ทำการแก้ไขเฉพาะสิ่งที่เกี่ยวข้อง
- เมื่อแก้เสร็จ ให้กลับมาขอ approval phase เดิมอีกครั้ง
- ห้ามย้ายไป phase ถัดไปจนกว่าจะได้รับ approval

## File Update Rules
- PRODUCT.md: อัปเดตเมื่อ scope หรือกติกาธุรกิจเปลี่ยน
- DESIGN.md: อัปเดตเมื่อแนวทาง UI/UX เปลี่ยน
- PLAN.md: อัปเดตเมื่อ phase หรือ acceptance criteria เปลี่ยน
- PROGRESS-TRACKER.md: อัปเดตทุกครั้งที่เริ่ม phase, พร้อมให้ตรวจ, ต้องแก้, หรือได้รับ approval
- AGENTS.md: คงเป็นกติกาถาวร เว้นแต่ผู้ใช้สั่งเปลี่ยน

## Definition of Done
งานถือว่า done เมื่อ:
1. สิ่งที่ระบุใน phase ปัจจุบันถูกสร้างครบ
2. ผู้ใช้สามารถตรวจสอบได้จริง
3. มีการอธิบายวิธีตรวจชัดเจน
4. PROGRESS-TRACKER.md ถูกอัปเดต
5. ผู้ใช้ให้ approval แบบ explicit

หากยังไม่ได้รับ approval จากผู้ใช้ งานของ phase นั้นยังไม่ถือว่าเสร็จสมบูรณ์