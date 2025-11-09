/**
 * Create Stripe Promo Code for Testing
 *
 * Creates a 100% off promo code in Stripe for testing the complete checkout flow
 * without real charges.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

async function createPromoCode() {
  console.log('\n🎟️  Creating Stripe Promo Code for Testing\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Create a 100% off coupon
    console.log('Step 1: Creating 100% off coupon...');

    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'forever',
      name: 'Fullstack Vibe Coder - Testing Coupon',
      metadata: {
        purpose: 'Testing checkout flow',
        created_by: 'create-stripe-promo-code.ts',
      },
    });

    console.log(`✅ Coupon created: ${coupon.id}`);
    console.log(`   Name: ${coupon.name}`);
    console.log(`   Percent Off: ${coupon.percent_off}%`);
    console.log(`   Duration: ${coupon.duration}`);
    console.log('');

    // Step 2: Create a promotion code using that coupon
    console.log('Step 2: Creating promotion code "FSVC100"...');

    const promotionCode = await stripe.promotionCodes.create({
      promotion: {
        coupon: coupon.id,
      },
      code: 'FSVC100',
      active: true,
      metadata: {
        purpose: 'Testing checkout flow',
        created_by: 'create-stripe-promo-code.ts',
      },
    });

    console.log(`✅ Promotion Code created: ${promotionCode.id}`);
    console.log(`   Code: ${promotionCode.code}`);
    console.log(`   Active: ${promotionCode.active}`);
    console.log(`   Coupon: ${(promotionCode as any).promotion?.coupon || coupon.id}`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SUCCESS - Promo Code Ready!\n');
    console.log('📋 Details:');
    console.log(`   Code: FSVC100`);
    console.log(`   Discount: 100% off`);
    console.log(`   Status: Active`);
    console.log(`   Applies to: All products`);
    console.log('');
    console.log('🧪 How to Use:');
    console.log('   1. Go to checkout on fullstackvibecoder.com/get-started');
    console.log('   2. Click "Add promotion code" on Stripe checkout page');
    console.log('   3. Enter: FSVC100');
    console.log('   4. Complete checkout with $0.00 total');
    console.log('   5. Stripe will still process the "payment" and fire webhook');
    console.log('   6. BIAB execution will trigger normally');
    console.log('');
    console.log('💡 Note: This tests the COMPLETE flow including:');
    console.log('   - Stripe checkout session creation');
    console.log('   - Payment processing (for $0)');
    console.log('   - Webhook firing');
    console.log('   - User/Project/Payment creation');
    console.log('   - BIAB execution trigger');
    console.log('   - All 16 prompts + logos + v0 deployment');
    console.log('');
    console.log('🗑️  To Remove Later:');
    console.log(`   stripe.promotionCodes.update('${promotionCode.id}', { active: false })`);
    console.log(`   stripe.coupons.delete('${coupon.id}')`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Error creating promo code:', error.message);

    if (error.code === 'resource_already_exists') {
      console.log('\n💡 The promo code "FSVC100" already exists!');
      console.log('   You can use it right away, or delete it first:');
      console.log('');
      console.log('   To find and delete existing promo code:');
      console.log('   1. Go to: https://dashboard.stripe.com/coupons');
      console.log('   2. Search for "FSVC100"');
      console.log('   3. Archive the existing code');
      console.log('   4. Run this script again');
      console.log('');
    } else if (error.code === 'invalid_request_error') {
      console.log('\n💡 Check your STRIPE_SECRET_KEY:');
      console.log('   - Make sure it starts with sk_live_ or sk_test_');
      console.log('   - Verify it\'s set correctly in environment variables');
      console.log('');
    }

    throw error;
  }
}

// Run the script
createPromoCode()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
