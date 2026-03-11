import crypto from "crypto";
import { IndustryProfile } from "./types";

/**
 * Generate raw SQL INSERT statements for seeding a freshly-provisioned
 * coaching app database. Runs after `prisma migrate deploy`.
 */
export function generateSeedSql(profile: IndustryProfile): string {
  const lines: string[] = [];
  const coachId = uuid();
  const now = new Date().toISOString();

  // ── 1. Coach User ──────────────────────────────────────────────────────────
  lines.push(`-- Coach User`);
  lines.push(
    `INSERT INTO "User" (id, email, name, role, timezone, "createdAt", "updatedAt")` +
      ` VALUES (${q(coachId)}, ${q(profile.ownerEmail)}, ${q(profile.ownerName)}, 'ADMIN', ${q(profile.timezone)}, ${q(now)}, ${q(now)});`
  );

  // ── 2. Site Settings ───────────────────────────────────────────────────────
  lines.push(`\n-- Site Settings`);
  lines.push(
    `INSERT INTO "SiteSettings" (id, "businessName", "ownerName", "primaryColor", "accentColor", "defaultCurrency", "defaultTimezone", "cancellationPolicyHours", "setupComplete", "analyticsEnabled", "createdAt", "updatedAt")` +
      ` VALUES ('default', ${q(profile.businessName)}, ${q(profile.ownerName)}, ${q(profile.primaryColor)}, ${q(profile.accentColor)}, 'usd', ${q(profile.timezone)}, ${profile.cancellationPolicyHours ?? 24}, false, true, ${q(now)}, ${q(now)});`
  );

  // ── 3. Services ────────────────────────────────────────────────────────────
  const serviceIds: Map<string, string> = new Map();
  if (profile.services && profile.services.length > 0) {
    lines.push(`\n-- Services`);
    for (const svc of profile.services) {
      const svcId = uuid();
      serviceIds.set(svc.name, svcId);
      const slug = slugify(svc.name);
      lines.push(
        `INSERT INTO "Service" (id, "userId", name, slug, description, duration, price, type, "isActive", "createdAt", "updatedAt")` +
          ` VALUES (${q(svcId)}, ${q(coachId)}, ${q(svc.name)}, ${q(slug)}, ${q(svc.description)}, ${svc.duration}, ${svc.price}, ${q(svc.type)}, true, ${q(now)}, ${q(now)});`
      );
    }
  }

  // ── 4. Packages + PackageService junction ──────────────────────────────────
  if (profile.packages && profile.packages.length > 0) {
    lines.push(`\n-- Packages`);
    for (const pkg of profile.packages) {
      const pkgId = uuid();
      const slug = slugify(pkg.name);
      lines.push(
        `INSERT INTO "Package" (id, "userId", name, slug, description, price, "totalSessions", "validityDays", "isActive", "createdAt", "updatedAt")` +
          ` VALUES (${q(pkgId)}, ${q(coachId)}, ${q(pkg.name)}, ${q(slug)}, ${q(pkg.description)}, ${pkg.price}, ${pkg.totalSessions}, ${pkg.validityDays}, true, ${q(now)}, ${q(now)});`
      );

      // Junction: link package to its services
      for (const svcName of pkg.serviceNames) {
        const svcId = serviceIds.get(svcName);
        if (svcId) {
          lines.push(
            `INSERT INTO "PackageService" (id, "packageId", "serviceId")` +
              ` VALUES (${q(uuid())}, ${q(pkgId)}, ${q(svcId)});`
          );
        }
      }
    }
  }

  // ── 5. Availability ────────────────────────────────────────────────────────
  lines.push(`\n-- Availability`);
  for (const day of profile.businessHours?.daysOfWeek ?? [1, 2, 3, 4, 5]) {
    const availId = `default-availability-${day}`;
    lines.push(
      `INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "isActive", "createdAt", "updatedAt")` +
        ` VALUES (${q(availId)}, ${q(coachId)}, ${day}, ${q(profile.businessHours?.startTime ?? '09:00')}, ${q(profile.businessHours?.endTime ?? '17:00')}, true, ${q(now)}, ${q(now)});`
    );
  }

  // ── 6. Email Templates ─────────────────────────────────────────────────────
  lines.push(`\n-- Email Templates`);
  for (const tmpl of EMAIL_TEMPLATES) {
    lines.push(
      `INSERT INTO "EmailTemplate" (id, "userId", slug, name, subject, body, "isSystem", "isActive", "createdAt", "updatedAt")` +
        ` VALUES (${q(uuid())}, ${q(coachId)}, ${q(tmpl.slug)}, ${q(tmpl.name)}, ${q(tmpl.subject)}, ${q(tmpl.body)}, true, true, ${q(now)}, ${q(now)});`
    );
  }

  return lines.join("\n");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

/** SQL-safe single-quote escaping */
function q(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Hardcoded Email Templates ────────────────────────────────────────────────
// Matches the coaching app's prisma/seed.ts — all 20 system templates.

const EMAIL_TEMPLATES: Array<{
  slug: string;
  name: string;
  subject: string;
  body: string;
}> = [
  {
    slug: "booking-confirmation",
    name: "Booking Confirmation",
    subject: "Your session is confirmed — {{session_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Confirmed</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your session has been confirmed for <strong>{{session_date}}</strong> at <strong>{{session_time}}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Service:</strong> {{service_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Duration:</strong> {{duration}} minutes</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Location:</strong> {{location}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">If you need to reschedule or cancel, please do so at least {{cancellation_hours}} hours in advance.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "new-booking-notification",
    name: "New Booking (Coach)",
    subject: "New booking: {{client_name}} — {{session_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">New Booking</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;"><strong>{{client_name}}</strong> has booked a session.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Date:</strong> {{session_date}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Time:</strong> {{session_time}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Service:</strong> {{service_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Client Email:</strong> {{client_email}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "session-reminder-24h",
    name: "24h Reminder",
    subject: "Reminder: Your session is tomorrow at {{session_time}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Reminder</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">This is a friendly reminder that your session is tomorrow, <strong>{{session_date}}</strong> at <strong>{{session_time}}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Service:</strong> {{service_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Location:</strong> {{location}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Need to reschedule? Please let us know as soon as possible.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "session-starting-soon",
    name: "Starting Soon",
    subject: "Your session starts in 1 hour",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Starting Soon</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your session starts in <strong>1 hour</strong> at <strong>{{session_time}}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Location:</strong> {{location}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">See you soon!</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "session-followup",
    name: "Session Follow-up",
    subject: "Session recap — {{session_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Recap</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for our session on <strong>{{session_date}}</strong>. Here is a summary of what we covered and your action items.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0;">{{session_notes}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Looking forward to our next session. Reach out if you have any questions.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "booking-cancelled",
    name: "Booking Cancelled",
    subject: "Session cancelled — {{session_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Cancelled</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your session scheduled for <strong>{{session_date}}</strong> at <strong>{{session_time}}</strong> has been cancelled.</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">{{cancellation_reason}}</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">If you would like to rebook, please visit our booking page or reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "booking-rescheduled",
    name: "Booking Rescheduled",
    subject: "Session rescheduled to {{new_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Rescheduled</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your session has been rescheduled from {{original_date}} to <strong>{{new_date}}</strong> at <strong>{{new_time}}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Service:</strong> {{service_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Location:</strong> {{location}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">If this new time does not work for you, please let us know.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "invoice-sent",
    name: "Invoice Sent",
    subject: "Invoice {{invoice_number}} — {{amount}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Invoice {{invoice_number}}</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">A new invoice has been generated for <strong>{{amount}}</strong>.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Invoice:</strong> {{invoice_number}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Amount:</strong> {{amount}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Due Date:</strong> {{due_date}}</p>
      </div>
      <a href="{{payment_link}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Pay Now</a>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "payment-receipt",
    name: "Payment Receipt",
    subject: "Payment received — {{amount}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Payment Received</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">We have received your payment of <strong>{{amount}}</strong>. Thank you!</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Amount:</strong> {{amount}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Date:</strong> {{payment_date}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Invoice:</strong> {{invoice_number}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">This email serves as your receipt. No further action is required.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "invoice-overdue",
    name: "Invoice Overdue",
    subject: "Invoice {{invoice_number}} is overdue",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Invoice Overdue</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Invoice <strong>{{invoice_number}}</strong> for <strong>{{amount}}</strong> was due on <strong>{{due_date}}</strong> and is now overdue.</p>
      <a href="{{payment_link}}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Pay Now</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">If you have already made this payment, please disregard this notice.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "package-low-balance",
    name: "Package Low Balance",
    subject: "{{sessions_remaining}} sessions remaining",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Session Balance Update</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">You have <strong>{{sessions_remaining}} sessions</strong> remaining in your <strong>{{package_name}}</strong> package.</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">To continue without interruption, consider renewing your package.</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Reply to this email or reach out if you have any questions.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "package-expiring",
    name: "Package Expiring",
    subject: "Your package expires on {{expires_date}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Package Expiring Soon</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your <strong>{{package_name}}</strong> package expires on <strong>{{expires_date}}</strong>. You have <strong>{{sessions_remaining}}</strong> unused sessions.</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Be sure to book your remaining sessions before the expiration date.</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Contact us if you would like to extend or renew your package.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "testimonial-request",
    name: "Testimonial Request",
    subject: "How was your experience?",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">We Value Your Feedback</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for working with us! We would love to hear about your experience. Your feedback helps us improve and helps others discover our services.</p>
      <a href="{{testimonial_link}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Share Your Experience</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">It only takes a minute. Thank you!</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "contact-notification",
    name: "Contact Form (Coach)",
    subject: "New contact: {{sender_name}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">New Contact Form Submission</h1>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Name:</strong> {{sender_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> {{sender_email}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Phone:</strong> {{sender_phone}}</p>
      </div>
      <div style="background:#f9fafb;border-left:4px solid #2563eb;padding:16px;margin:0;">
        <p style="color:#374151;font-size:14px;margin:0;">{{message}}</p>
      </div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "contact-auto-reply",
    name: "Contact Auto-Reply",
    subject: "Thanks for reaching out, {{sender_name}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Thank You for Reaching Out</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{sender_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Thank you for contacting {{business_name}}. We have received your message and will get back to you within 24 hours.</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">In the meantime, feel free to browse our services and book a session directly if you are ready.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "client-welcome",
    name: "Client Welcome",
    subject: "Welcome to {{business_name}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Welcome!</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Welcome to <strong>{{business_name}}</strong>! We are excited to work with you on your goals.</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">You can access your client portal to view upcoming sessions, resources, and more.</p>
      <a href="{{portal_link}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Access Your Portal</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">If you have any questions, do not hesitate to reach out.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "magic-link",
    name: "Magic Link Login",
    subject: "Your login link",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Your Login Link</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Click the button below to sign in to your account. This link expires in 15 minutes.</p>
      <a href="{{magic_link}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Sign In</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">If you did not request this link, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "payment-failed",
    name: "Payment Failed",
    subject: "Payment issue — action required",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Payment Issue</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">We were unable to process your payment of <strong>{{amount}}</strong>. Please update your payment method to avoid any interruption.</p>
      <a href="{{update_payment_link}}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Update Payment Method</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">If you have questions about this charge, please contact us.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "subscription-renewal-receipt",
    name: "Subscription Renewal",
    subject: "Subscription renewed — {{amount}}",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">Subscription Renewed</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">Your subscription has been renewed. A payment of <strong>{{amount}}</strong> has been processed.</p>
      <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin:0 0 24px;">
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Package:</strong> {{package_name}}</p>
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Amount:</strong> {{amount}}</p>
        <p style="color:#374151;font-size:14px;margin:0;"><strong>Next Renewal:</strong> {{next_renewal_date}}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0;">Thank you for your continued trust in our services.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "no-show-followup",
    name: "No-Show Follow-up",
    subject: "We missed you — reschedule?",
    body: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f9fafb;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
      <h1 style="color:#1f2937;font-size:24px;margin:0 0 16px;">We Missed You</h1>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi {{client_name}},</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">We noticed you were unable to make your session on <strong>{{session_date}}</strong>. We hope everything is okay.</p>
      <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 24px;">We would love to reschedule at a time that works better for you.</p>
      <a href="{{reschedule_link}}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:16px;font-weight:600;">Reschedule Session</a>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:16px 0 0;">If you have any questions, just reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
  },
];
