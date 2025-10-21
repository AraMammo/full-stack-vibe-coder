import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const contactSubmissions = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatSubmissions = pgTable('chat_submissions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  userInput: text('user_input').notNull(),
  inputType: text('input_type').notNull(),
  aiRecommendation: text('ai_recommendation'),
  recommendedProduct: text('recommended_product'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const toolPurchases = pgTable('tool_purchases', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  toolName: text('tool_name').notNull(),
  accessType: text('access_type').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  status: text('status').notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const toolSubmissions = pgTable('tool_submissions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  toolName: text('tool_name').notNull(),
  formData: text('form_data').notNull(),
  makeWebhookTriggered: boolean('make_webhook_triggered').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const deliverables = pgTable('deliverables', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id'),
  email: text('email').notNull(),
  toolName: text('tool_name').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promoCodes = pgTable('promo_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  maxUses: integer('max_uses'),
  usesCount: integer('uses_count').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;
export type ChatSubmission = typeof chatSubmissions.$inferSelect;
export type InsertChatSubmission = typeof chatSubmissions.$inferInsert;
export type ToolPurchase = typeof toolPurchases.$inferSelect;
export type InsertToolPurchase = typeof toolPurchases.$inferInsert;
export type ToolSubmission = typeof toolSubmissions.$inferSelect;
export type InsertToolSubmission = typeof toolSubmissions.$inferInsert;
export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;
