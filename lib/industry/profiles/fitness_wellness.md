## 4. FITNESS/WELLNESS (Personal Trainer, Yoga Instructor, Gym Owner)

### Core Workflows
- Client signs up (trial class, membership, or PT package)
- Books class/session
- Attends session, tracks workout/progress
- Trainer logs program, adjusts plan
- Monthly billing cycle
- Retention: progress tracking, milestone celebrations

### Must-Have Features
- **Class scheduling** with capacity limits
- **Membership management** (monthly, annual, class packs, drop-ins)
- **Workout/program builder** (exercise library, sets/reps/weight tracking)
- **Progress tracking** (measurements, photos, PR records)
- **Automated billing** (recurring memberships, failed payment retry)
- **Check-in system** (QR code, PIN, or door access integration)
- **Waitlist for full classes**
- **On-demand content** (workout videos for hybrid model)

### Database Schema
```
members (id, name, email, phone, emergency_contact, start_date, membership_id, status[ACTIVE|FROZEN|CANCELLED], goals, health_notes)
memberships (id, name, type[MONTHLY|ANNUAL|CLASS_PACK|DROP_IN], price, billing_cycle, class_limit, includes_pt)
member_memberships (id, member_id, membership_id, stripe_subscription_id, status, started_at, expires_at, classes_remaining)
classes (id, name, instructor_id, capacity, duration_min, recurring_schedule, category[YOGA|HIIT|STRENGTH|SPIN])
class_sessions (id, class_id, datetime, instructor_id, capacity, enrolled_count)
class_enrollments (id, class_session_id, member_id, status[ENROLLED|WAITLISTED|ATTENDED|NO_SHOW|CANCELLED])
workout_programs (id, member_id, trainer_id, name, weeks, created_at)
workout_days (id, program_id, day_number, exercises_json[{exercise, sets, reps, weight, rest, notes}])
progress_logs (id, member_id, date, weight, body_fat, measurements_json, photos[], notes)
check_ins (id, member_id, datetime, method)
```

### API Routes
```
POST   /api/members                          — register member
POST   /api/memberships/:id/subscribe        — start membership
GET    /api/classes/schedule?week=            — class schedule
POST   /api/classes/:session_id/enroll        — book class
POST   /api/classes/:session_id/check-in      — mark attendance
GET    /api/members/:id/progress              — progress history
POST   /api/programs                          — create workout program
POST   /api/progress                          — log progress entry
GET    /api/reports/attendance                — attendance analytics
GET    /api/reports/revenue                   — MRR, churn, LTV
```

### Payment Patterns
Monthly recurring memberships (primary revenue). Class pack purchases (10-class pack). Drop-in rates. Personal training packages (sessions pre-paid). Annual discounts. Freeze fees. Cancellation fees.

### Client Interaction Model
Find via Instagram, Google, ClassPass marketplace, referrals. Trial class is the conversion point. App-based relationship (check schedule, book class, track workout). Community is the retention lever. Progress milestones keep people engaged.

### Industry-Specific Nuances
- **Membership freeze/pause** is essential (not just cancel)
- **Class capacity management** -- overbooking destroys experience
- **Trainer-client relationship** for PT -- workout programming is the core deliverable
- **Hybrid model** (in-person + on-demand video) is now standard
- **Waivers and health forms** required at sign-up

### What They Currently Cobble Together (and Cost)
- Mindbody: $129-400+/mo + 2.89% processing
- Gymdesk: $75/mo
- Trainerize: $9-60/mo (workout programming only)
- ClassPass (marketplace): 30-50% revenue share
- Stripe for billing: 2.9%
- **Total monthly SaaS spend: $100-500/mo**

---