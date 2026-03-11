## 19. ONLINE COURSE CREATOR/EDUCATOR

### Core Workflows
- Create course content (video lectures, quizzes, resources)
- Build sales page/landing page
- Launch with email marketing campaign
- Students purchase and enroll
- Students progress through modules
- Community engagement (Q&A, discussions)
- Certificate generation on completion
- Upsell to next course or membership

### Must-Have Features
- **Course builder** (modules, lessons, quizzes, assignments)
- **Video hosting** (embedded player, progress tracking)
- **Student portal** with progress tracking
- **Payment processing** (one-time, payment plan, subscription)
- **Email marketing** (launch sequences, drip campaigns, broadcasts)
- **Sales/landing pages** (conversion-optimized)
- **Certificate generation** on completion
- **Community/discussion forum** per course
- **Coupon/discount management**
- **Analytics** (enrollment, completion rates, revenue)

### Database Schema
```
courses (id, title, description, slug, price, payment_options[ONE_TIME|PAYMENT_PLAN|SUBSCRIPTION], status[DRAFT|PRE_LAUNCH|LIVE|ARCHIVED], thumbnail_url, sales_page_content, launch_date)
modules (id, course_id, title, order, description)
lessons (id, module_id, title, order, type[VIDEO|TEXT|QUIZ|ASSIGNMENT], content, video_url, duration_min, is_free_preview)
quizzes (id, lesson_id, questions_json[{question, options[], correct_answer, explanation}], passing_score)
enrollments (id, user_id, course_id, status[ACTIVE|COMPLETED|REFUNDED|EXPIRED], enrolled_at, completed_at, stripe_payment_id, payment_plan_id)
lesson_progress (id, enrollment_id, lesson_id, status[NOT_STARTED|IN_PROGRESS|COMPLETED], completed_at, quiz_score)
certificates (id, enrollment_id, certificate_number, issued_at, pdf_url)
coupons (id, code, type[PERCENTAGE|FIXED], amount, course_ids[], usage_limit, used_count, expires_at)
discussions (id, course_id, lesson_id, user_id, content, parent_id, created_at)
email_sequences (id, name, trigger[ENROLLMENT|CART_ABANDON|COMPLETION|CUSTOM], emails_json[{delay_days, subject, body}])
subscribers (id, email, name, tags[], source, subscribed_at)
```

### API Routes
```
POST   /api/courses                          — create course
POST   /api/courses/:id/modules              — add module
POST   /api/courses/:id/lessons              — add lesson
POST   /api/enrollments                      — enroll student
PATCH  /api/progress/:enrollment_id/:lesson_id — update progress
POST   /api/quizzes/:id/submit               — submit quiz
POST   /api/certificates/generate            — generate certificate
POST   /api/coupons                          — create coupon
GET    /api/courses/:id/analytics            — course analytics
POST   /api/email/broadcast                  — send broadcast
GET    /api/students/:id/courses             — student's enrolled courses
POST   /api/discussions                      — post discussion
```

### Payment Patterns
One-time course purchase ($47-2,000). Payment plans (3-12 installments). Subscription access (monthly). Bundle pricing (multiple courses). Launch pricing (early bird discounts). Affiliate commissions (20-50%). Upsells/order bumps at checkout.

### Client Interaction Model
Find via social media, podcast, YouTube, blog, paid ads, affiliates. Email list is the asset. Launch model (scarcity-driven) or evergreen (always available). Community is the retention lever. Completion rates drive testimonials. Upsell ladder.

### Industry-Specific Nuances
- **Drip content** -- release modules on a schedule, not all at once
- **Completion tracking** is critical for course quality metrics
- **Affiliate program** management
- **Cart abandonment recovery** sequences
- **Refund period** (typically 30 days) tracking
- **Pre-launch email sequence** is the revenue driver

### What They Currently Cobble Together (and Cost)
- Kajabi: $89-499/mo (all-in-one but expensive)
- Teachable: $39-99/mo + 5% transaction fee on Basic
- Thinkific: free-$99/mo
- ConvertKit/Kit for email: $29-199/mo
- Stripe: 2.9%
- Zoom for live sessions
- **Total monthly SaaS spend: $100-700/mo**

---