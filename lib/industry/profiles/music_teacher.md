## 18. MUSIC TEACHER/TUTOR

### Core Workflows
- Student inquiry (instrument, level, goals, schedule preference)
- Trial lesson
- Recurring lesson schedule set (weekly, same day/time)
- Lessons conducted (in-person or virtual)
- Attendance tracked, practice assigned
- Monthly invoicing (based on lessons attended)
- Recital/performance coordination (periodic)
- Progress tracking (skill assessments, repertoire learned)

### Must-Have Features
- **Recurring lesson scheduling** (weekly slots, same time each week)
- **Attendance tracking** with make-up lesson management
- **Calendar-based billing** (auto-calculate monthly invoice from lessons attended)
- **Practice assignments** (what to practice, with resources/links)
- **Student/parent portal** (schedule, payments, practice log)
- **Make-up lesson policy** management (reschedule within X days)
- **Family accounts** (multiple students per household, one bill)
- **Recital management** (program, repertoire, scheduling)
- **Progress notes** per lesson

### Database Schema
```
families (id, parent_name, email, phone, address, payment_method_id, billing_preference[PER_LESSON|MONTHLY|SEMESTER])
students (id, family_id, name, age, instrument[], level[BEGINNER|INTERMEDIATE|ADVANCED], goals, notes, start_date)
lesson_schedules (id, student_id, day_of_week, time, duration_min[30|45|60], rate, room_or_location, status[ACTIVE|PAUSED|ENDED])
lessons (id, schedule_id, student_id, date, time, duration_min, status[SCHEDULED|COMPLETED|CANCELLED|NO_SHOW|MAKEUP], teacher_notes, practice_assignment_id)
practice_assignments (id, student_id, lesson_id, items_json[{piece, section, tempo, notes, resource_url}], due_date)
practice_logs (id, student_id, date, duration_min, pieces_practiced[], notes)
invoices (id, family_id, period_start, period_end, lessons_billed[], amount, status[GENERATED|SENT|PAID|OVERDUE], paid_at)
makeup_lessons (id, original_lesson_id, rescheduled_lesson_id, reason, status[PENDING|SCHEDULED|COMPLETED|FORFEITED])
recitals (id, name, date, venue, program_json[{order, student_id, piece, composer}])
progress_records (id, student_id, date, skills_json[{skill, level}], repertoire_completed[], teacher_assessment)
```

### API Routes
```
POST   /api/students                         — enroll student
POST   /api/schedules                        — set recurring lesson
GET    /api/calendar?week=                   — weekly schedule
POST   /api/lessons/:id/attendance           — mark attendance
POST   /api/lessons/:id/notes                — save lesson notes
POST   /api/practice-assignments             — assign practice
GET    /api/students/:id/practice-log        — view practice log
POST   /api/invoices/generate                — auto-generate invoices
POST   /api/makeup-lessons                   — schedule make-up
GET    /api/families/:id/portal              — parent portal
POST   /api/recitals                         — create recital
GET    /api/students/:id/progress            — progress report
```

### Payment Patterns
Per-lesson rate ($40-120/lesson). Monthly tuition (4-5 lessons/month). Semester prepay (discount). Family discounts for multiple students. Make-up lesson policies (credit vs. forfeit). Recital fees. Material fees.

### Client Interaction Model
Find via word of mouth, Google, local music stores, school programs. Trial lesson converts. Weekly recurring schedule = automatic retention. Parent communication (not student for minors). Recitals build community. Students stay 2-5 years on average.

### Industry-Specific Nuances
- **Calendar-based billing** -- invoice generated from attendance, not a fixed monthly fee
- **Make-up lesson management** -- the #1 administrative headache
- **Family accounts** -- one family may have 3 students, wants one invoice
- **Practice assignment delivery** -- links to YouTube, sheet music PDFs, recordings
- **Recital logistics** -- program ordering, timing, rehearsal scheduling

### What They Currently Cobble Together (and Cost)
- My Music Staff: ~$15-30/mo
- Fons (scheduling): $20/mo
- Google Calendar
- Venmo/Zelle for payments
- Email/text for practice assignments
- Paper attendance books
- **Total monthly SaaS spend: $15-50/mo (most just use free tools)**

---