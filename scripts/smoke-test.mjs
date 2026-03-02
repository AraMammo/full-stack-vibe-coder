import dotenv from 'dotenv';
import Stripe from 'stripe';

// Load .env first, then .env.local overrides (matches Next.js behavior)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function test() {
  let pass = 0;
  let fail = 0;

  // 1. SUPABASE
  console.log('=== SUPABASE MANAGEMENT API ===');
  try {
    const res = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: 'Bearer ' + process.env.SUPABASE_MANAGEMENT_API_KEY }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).substring(0, 200));
    const projects = await res.json();
    console.log('PASS — ' + projects.length + ' projects found');
    projects.forEach(p => console.log('  - ' + p.name + ' (' + p.id + ') ' + p.status));
    pass++;
  } catch(e) { console.log('FAIL: ' + e.message); fail++; }

  // 2. VERCEL
  console.log('\n=== VERCEL API ===');
  try {
    const res = await fetch('https://api.vercel.com/v9/projects?teamId=' + process.env.VERCEL_TEAM_ID + '&limit=5', {
      headers: { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).substring(0, 200));
    const data = await res.json();
    console.log('PASS — ' + data.projects.length + ' projects on team');
    data.projects.forEach(p => console.log('  - ' + p.name));
    pass++;
  } catch(e) { console.log('FAIL: ' + e.message); fail++; }

  // 3. GITHUB
  console.log('\n=== GITHUB API ===');
  try {
    const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    const orgName = process.env.GITHUB_ORG_NAME;

    const res = await fetch('https://api.github.com/orgs/' + orgName, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).substring(0, 200));
    const org = await res.json();
    console.log('PASS — Org: ' + org.login + ', Public repos: ' + org.public_repos + ', Private: ' + (org.total_private_repos || 0));

    // Check repo creation scope
    const reposRes = await fetch('https://api.github.com/orgs/' + orgName + '/repos?per_page=5', {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' }
    });
    if (!reposRes.ok) throw new Error('Cannot list org repos: HTTP ' + reposRes.status);
    const repos = await reposRes.json();
    console.log('  Repo list access OK (' + repos.length + ' repos)');
    repos.forEach(r => console.log('    - ' + r.full_name));
    pass++;
  } catch(e) { console.log('FAIL: ' + e.message); fail++; }

  // 4. STRIPE
  console.log('\n=== STRIPE API ===');
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const account = await stripe.accounts.retrieve();
    const name = account.settings?.dashboard?.display_name || account.business_profile?.name || 'Unknown';
    console.log('PASS — Account: ' + name + ' (' + (account.livemode ? 'LIVE' : 'TEST') + ' mode)');

    // Verify hosting price
    const priceId = process.env.STRIPE_HOSTING_PRICE_ID;
    const price = await stripe.prices.retrieve(priceId);
    console.log('  Hosting price: $' + (price.unit_amount / 100) + '/' + price.recurring?.interval + ' (active: ' + price.active + ')');

    // Test Connect: create + immediately delete a test account
    console.log('  Testing Stripe Connect...');
    const testAccount = await stripe.accounts.create({
      type: 'express',
      email: 'smoketest-' + Date.now() + '@test.shipkit.io',
      business_type: 'individual',
      metadata: { smoke_test: 'true' },
    });
    console.log('  Connect account created: ' + testAccount.id);
    await stripe.accounts.del(testAccount.id);
    console.log('  Connect account deleted (cleanup OK)');

    pass++;
  } catch(e) { console.log('FAIL: ' + e.message); fail++; }

  // Summary
  console.log('\n=============================');
  console.log(pass + '/4 services OK, ' + fail + '/4 failed');
  if (fail > 0) process.exit(1);
}

test();
