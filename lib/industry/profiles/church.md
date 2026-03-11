## 27. CHURCH/RELIGIOUS ORGANIZATION

### Core Workflows
- Member management (families, attendance, groups)
- Service planning (worship set, volunteers, A/V)
- Online and in-person giving
- Small group coordination
- Event management (VBS, retreats, potlucks)
- Volunteer scheduling (nursery, ushers, worship team)
- Communication (announcements, prayer requests, newsletters)
- Facility management (room bookings)

### Must-Have Features
- **Member directory** with family/household grouping
- **Online giving** (one-time, recurring, designated funds)
- **Attendance tracking** (services, small groups, events)
- **Service planning** (worship set lists, volunteer scheduling)
- **Small group management** (groups, leaders, members, curriculum)
- **Volunteer scheduling** with position assignments and confirmations
- **Communication** (email, SMS, push notifications to app)
- **Event registration** (VBS, retreats, mission trips)
- **Check-in system** (child safety, name tags, parent notifications)
- **Facility/room booking**
- **Giving statements** (annual tax statements for donors)

### Database Schema
```
families (id, family_name, address, phone, email, photo_url, joined_date)
members (id, family_id, name, email, phone, birthday, role[MEMBER|VISITOR|REGULAR_ATTENDER|STAFF|PASTOR], baptism_date, membership_date, status[ACTIVE|INACTIVE|MOVED], photo_url)
services (id, name, datetime, type[SUNDAY|WEDNESDAY|SPECIAL], attendance_count)
attendance (id, member_id, service_id, checked_in_at, checked_in_by)
giving (id, member_id, family_id, amount, fund[GENERAL|MISSIONS|BUILDING|BENEVOLENCE|YOUTH], method[ONLINE|CHECK|CASH|TEXT], date, stripe_payment_id, recurring_id)
giving_recurring (id, member_id, amount, fund, frequency[WEEKLY|BIWEEKLY|MONTHLY], stripe_subscription_id, status)
funds (id, name, description, goal_amount, current_amount)
small_groups (id, name, leader_id, meeting_day, meeting_time, location, semester, curriculum, max_size)
small_group_members (id, group_id, member_id, role[LEADER|CO_LEADER|MEMBER])
volunteer_teams (id, name, description[WORSHIP|KIDS|GREETING|AV|PARKING])
volunteer_positions (id, team_id, service_id, position_name, assigned_member_id, confirmed)
events (id, name, date, type, registration_required, max_capacity, cost, registration_count)
event_registrations (id, event_id, member_id, family_members[], payment_status, dietary_needs)
rooms (id, name, capacity, amenities[])
room_bookings (id, room_id, event_or_group, date, start_time, end_time, setup_notes)
check_ins (id, member_id, service_id, room[NURSERY|PRESCHOOL|ELEMENTARY], parent_id, name_tag_printed, security_code)
prayer_requests (id, member_id, request, shared_with[STAFF|GROUP|ALL], date, status)
```

### API Routes
```
GET    /api/members/directory                — member directory
POST   /api/members                          — add member/visitor
POST   /api/giving                           — process donation
GET    /api/giving/statements/:year          — annual giving statement
POST   /api/services/:id/attendance          — record attendance
POST   /api/check-in                         — child check-in (security)
GET    /api/volunteer-schedule?date=         — volunteer schedule
POST   /api/volunteer-schedule               — assign volunteer
POST   /api/events/:id/register             — register for event
GET    /api/small-groups                     — group listing
POST   /api/small-groups/:id/join           — join group
POST   /api/rooms/book                      — book room
POST   /api/prayer-requests                 — submit prayer request
GET    /api/services/:id/plan               — service planning view
GET    /api/reports/giving-trends            — giving analytics
GET    /api/reports/attendance-trends        — attendance analytics
```

### Payment Patterns
Tithes and offerings (recurring weekly/monthly, primary). Designated giving to specific funds (missions, building). Event fees (camp, retreat). Text-to-give. Annual giving statements for tax purposes. No concept of "pricing" -- all voluntary.

### Client Interaction Model
People find via Google, drive-by, invite from friend. Visitor follow-up is the conversion funnel. Small groups build belonging. Volunteering builds investment. Weekly attendance is the engagement metric. Annual giving statement is a touchpoint. App for announcements and giving.

### Industry-Specific Nuances
- **Family-centric** -- members are organized by household, not individual
- **Child check-in security** -- security codes, authorized pick-up, allergy alerts, name tags
- **Fund designation** -- donors specify which fund (general, missions, building, etc.)
- **Annual giving statements** for tax deductions
- **Volunteer scheduling** is the logistical backbone (dozens of positions per Sunday)
- **Visitor follow-up** workflow (first-time guest -> thank you -> invite to group -> membership)

### What They Currently Cobble Together (and Cost)
- Planning Center: $0-239/mo (modular)
- Tithe.ly/Breeze: $72-119/mo
- Mailchimp for email: $13-350/mo
- Canva for graphics: $13/mo
- Facebook Groups for community
- SignUpGenius for volunteer coordination
- **Total monthly SaaS spend: $100-400/mo**

---