# PROGRESS-TRACKER.md

## Current Phase
Phase 6 — History + Final review

## Overall Progress
6 / 6 phases approved (เวอร์ชันแรกเสร็จสมบูรณ์)

## Phase Status
- Phase 1: Approved
- Phase 2: Approved
- Phase 3: Approved
- Phase 4: Approved
- Phase 5: Approved
- Phase 6: Approved ✅

## Current Phase Check
ทุก phase approved แล้ว — เวอร์ชันแรก done
Production: https://supply-stock-one.vercel.app (ตรวจแล้ว login + 7 หน้า + role guard ผ่าน, ข้อมูลจาก Supabase)
แก้ปัญหา deploy: env ต้อง Redeploy หลังแก้ไขทุกครั้ง (ป้าย Needs Attention)

Phase 6 checklist:
- [ ] ประวัติขึ้นครบตามที่ทำจริง (เบิก/สั่งซื้อ/รับเข้า) พร้อมคนทำ วันเวลา จำนวน
- [ ] กรองตาม item และประเภทได้
- [ ] พิมพ์ค้นหาชื่อ item / คนทำ / หมายเหตุได้
- [ ] แต่ละ item แนบรูปได้ (เพิ่มตอนสร้าง/แก้) และเห็นรูปตอนเบิก + สั่งซื้อ (+ list/detail/รับเข้า)
- [ ] flow หลักครบ ไม่มีจุดที่ใช้งานต่อไม่ได้

## Final Acceptance (เทียบ PRODUCT.md)
- [x] 1. login + สิทธิ์ตาม role
- [x] 2. เบิกจากมือถือ stock ลดทันที
- [x] 3. สั่งซื้อระบุจำนวน + วันที่คาดเข้า
- [x] 4. รับของเข้า + stock เพิ่ม + แนบ invoice
- [x] 5. dashboard: stock / ROP / overdue
- [x] 6. อีเมล 3 กรณี (ส่งจริงเมื่อตั้ง RESEND_API_KEY)
- [x] 7. ประวัติครบ
- [x] 8. admin จัดการ user + อีเมลเพิ่มเติม

## Open Issues / ข้อจำกัดเวอร์ชันแรก
1. ส่งอีเมลจริงต้องตั้ง RESEND_API_KEY + verify domain (ตอนนี้ log เป็น skipped)
2. รูป invoice + ข้อมูลเก็บ local (data/db.json, public/uploads) — ขึ้น production ควรย้ายไป Supabase (DB/Auth/Storage) ตาม supabase/001_init.sql
3. demo auth เก็บรหัส plain + เปลี่ยนสิทธิ์ต้อง login ใหม่ — ย้ายไป Supabase Auth เมื่อใช้จริง
4. เช็ก overdue ตอนเปิด dashboard (ไม่มี cron/job)
5. ยังไม่ deploy Vercel (ต้องมี account + env)

## User Feedback / Requested Changes
- แอพเป็นเว็บแอพจัดการ Supply
- มี 3 บทบาท: ผู้ใช้ / ผู้ซื้อ / Admin
- ผู้ใช้เบิกของได้
- ผู้ซื้อสั่งซื้อและรับของเข้าได้
- มี Dashboard
- มี ROP, lead time, last purchase date
- ตอนสั่งซื้อ ต้องระบุวันที่ของจะเข้า
- หากถึงกำหนดแล้วยังไม่เข้า ต้องแจ้งเตือน
- แจ้งเตือนทาง Email
- ตอนรับของเข้า ต้องแนบรูป invoice
- เก็บประวัติการเคลื่อนไหว
- เพิ่มรายการ Supply ได้เฉพาะ Admin
- หน้า Supply กรองเฉพาะรายการที่ต้องสั่งซื้อได้
- Admin จัดการ user ได้ (เพิ่ม/ลบ/สิทธิ์/เปิด-ปิด)

## Approval Record
- 2026-09-14: Phase 1 approved (user: “ok ไปเฟส 2 ต่อเลย”)
- 2026-09-14: Phase 2 approved (user: “ok ไปเฟส 3 ต่อ”)
- 2026-09-14: Phase 3 approved (user: “เริ่มเฟส 4”)
- 2026-09-17: Phase 4 approved (user: “ไปเฟส 5”)
- 2026-09-17: Phase 5 approved (user: “ok ไปต่อเฟสต่อไปได้”)
- 2026-09-17: Phase 6 approved (user: “OK approve”) — v1 done 6/6

## Progress Log
- 2026-09-14: Gathered first-version requirements
- 2026-09-14: Created PRODUCT.md
- 2026-09-14: Created DESIGN.md
- 2026-09-14: Created PLAN.md
- 2026-09-14: Created PROGRESS-TRACKER.md
- 2026-09-14: Created AGENTS.md
- 2026-09-14: Phase 1 built (Next.js + demo auth + role middleware + placeholders + supabase/001_init.sql) — build passed, runtime verified (login 200, wrong pass 401, protected redirect 307, role block 307)
- 2026-09-14: Phase 1 approved, started Phase 2
- 2026-09-14: Phase 2 built (file store + API CRUD + List/Search/Badges + Detail/Edit + role write-guard) — build passed, runtime verified (401/403/400/201/200, pages 200)
- 2026-09-14: Phase 2 approved, started Phase 3
- 2026-09-14: Phase 3 built (POST /api/issues + IssueForm mobile-first + movement log + detail recent history) — build passed, runtime verified (401/400/201, stock 120→118, pages 200; test data reset)
- 2026-09-14: Phase 3 approved, started Phase 4
- 2026-09-17: Phase 4 built (orders API + receive + invoice upload + /orders + order/receive forms + role guard) — build passed, runtime verified (403/400/201/200, stock 5→53, invoice served, double-receive blocked; test artifacts cleaned, user issue history kept)
- 2026-09-17: Phase 4 changes per user — เพิ่ม Supply เฉพาะ Admin + กรองต้องสั่งซื้อ — build passed, verified
- 2026-09-17: Phase 4 approved, started Phase 5
- 2026-09-17: Phase 5 built (dashboard จริง + overdue check + Resend + 3 triggers + กันส่งซ้ำ + extra emails CRUD + email log) — build passed, runtime verified
- 2026-09-17: Phase 5 change per user — Admin จัดการ user ได้ — build passed, 18 checks ok
- 2026-09-17: Phase 5 approved, started Phase 6
- 2026-09-17: Phase 6 built (history เต็ม + filter item/ประเภท + final review ครบ 8 ข้อ) — build passed, e2e verified (add→issue→order→receive→history→dashboard; filters ok; 7 pages 200; test artifacts cleaned, user data kept)
- 2026-09-17: Phase 6 change per user — ประวัติค้นหาด้วยข้อความได้ (ชื่อ item/คนทำ/หมายเหตุ) — build passed, verified
- 2026-09-17: Phase 6 change per user — item แนบรูปได้ (อัปโหลด/ลบ, โชว์ใน list/detail/เบิก/สั่งซื้อ/รับเข้า) — build passed, verified (401/403/400/200, delete cleans file)
