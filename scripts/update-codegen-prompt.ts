/**
 * Update Codegen Prompt — Platform Fee Instructions
 *
 * Appends platform fee logic to the sk_nextjs_codebase_08 prompt template.
 * Run with: npx tsx scripts/update-codegen-prompt.ts
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

const PLATFORM_FEE_INSTRUCTION = `

## Platform Fee (Stripe Connect)

When creating Stripe PaymentIntents in the generated application:

1. Read \`NEXT_PUBLIC_PLATFORM_FEE_PERCENT\` from environment variables
2. If set, calculate: \`application_fee_amount = Math.round(amount * feePercent / 100)\`
3. Include \`application_fee_amount\` in the PaymentIntent create call
4. Use the platform's Stripe key with the \`stripeAccount\` parameter to route payments to the Connected Account

Example:
\`\`\`typescript
const feePercent = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT || '0');
const applicationFee = feePercent > 0 ? Math.round(amount * feePercent / 100) : undefined;

const paymentIntent = await stripe.paymentIntents.create({
  amount,
  currency: 'usd',
  ...(applicationFee ? { application_fee_amount: applicationFee } : {}),
}, {
  stripeAccount: process.env.STRIPE_CONNECT_ACCOUNT_ID,
});
\`\`\`

This ensures the platform collects a percentage fee on every transaction processed through customer apps.
`;

async function main() {
  const prompt = await prisma.promptTemplate.findUnique({
    where: { promptId: 'sk_nextjs_codebase_08' },
  });

  if (!prompt) {
    console.error('Prompt sk_nextjs_codebase_08 not found in database');
    process.exit(1);
  }

  // Check if already updated
  if (prompt.systemPrompt.includes('NEXT_PUBLIC_PLATFORM_FEE_PERCENT')) {
    console.log('Prompt already contains platform fee instructions. Skipping.');
    process.exit(0);
  }

  await prisma.promptTemplate.update({
    where: { promptId: 'sk_nextjs_codebase_08' },
    data: {
      systemPrompt: prompt.systemPrompt + PLATFORM_FEE_INSTRUCTION,
    },
  });

  console.log('Updated sk_nextjs_codebase_08 with platform fee instructions.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
