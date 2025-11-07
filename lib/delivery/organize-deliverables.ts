/**
 * Organize BIAB Deliverables with Logical Structure
 *
 * Creates a user-friendly folder structure with navigation guide,
 * README files, and logical ordering for easy consumption.
 */

export interface DeliverableFile {
  promptId: string;
  promptName: string;
  sectionName: string;
  content: string;
  outputFormat: 'markdown' | 'pdf';
}

export interface OrganizedStructure {
  folders: FolderStructure[];
  readmeContent: string;
  getStartedContent: string;
}

export interface FolderStructure {
  folderName: string;
  displayName: string;
  order: number;
  description: string;
  icon: string;
  files: Array<{
    filename: string;
    order: number;
    content: string;
    title: string;
  }>;
  readmeContent: string;
}

/**
 * Define the logical folder structure and reading order
 */
const FOLDER_DEFINITIONS: Array<{
  sectionNames: string[];
  folderName: string;
  displayName: string;
  order: number;
  description: string;
  icon: string;
  readingGuide: string;
}> = [
  {
    sectionNames: ['Business Model & Market Research'],
    folderName: '01-market-research',
    displayName: 'Phase 1: Market Research',
    order: 1,
    description: 'Understand your market, competition, and target audience',
    icon: '📊',
    readingGuide: `
# 📊 Phase 1: Market Research

**Purpose:** Validate your business idea and understand the market landscape.

**Reading Order:**
1. Business Model Breakdown - Start here to understand your core business model
2. Competitive Analysis - Learn about your competitors and market gaps
3. Target Audience - Deeply understand who your customers are

**Time to Complete:** 30-45 minutes

**Action Items After Reading:**
- [ ] Validate market size estimates with additional research
- [ ] Identify 3-5 direct competitors not mentioned
- [ ] Create detailed customer personas based on target audience insights
- [ ] Refine your unique value proposition based on competitive gaps

**Next Step:** Move to Phase 2 (Branding & Identity) once you've validated your market opportunity.
    `.trim(),
  },
  {
    sectionNames: ['Branding & Visual Identity'],
    folderName: '02-brand-identity',
    displayName: 'Phase 2: Brand Identity',
    order: 2,
    description: 'Define your brand strategy, visual identity, and messaging',
    icon: '🎨',
    readingGuide: `
# 🎨 Phase 2: Brand Identity

**Purpose:** Create a memorable brand that resonates with your target audience.

**Reading Order:**
1. Brand Strategy & Positioning - Define your brand foundation
2. Logo & Visual Identity - Understand your visual brand system

**Time to Complete:** 20-30 minutes

**Action Items After Reading:**
- [ ] Review brand values and ensure they align with your vision
- [ ] Save brand colors and fonts for all marketing materials
- [ ] Create a mood board based on the visual identity guide
- [ ] Draft your elevator pitch using the positioning strategy

**Assets Included:**
- Brand color palette (exact hex codes)
- Typography recommendations
- Logo concepts and rationale
- Voice and tone guidelines

**Next Step:** Use these brand guidelines consistently as you move to Phase 3 (Product Development).
    `.trim(),
  },
  {
    sectionNames: ['Product & Service Development'],
    folderName: '03-product-development',
    displayName: 'Phase 3: Product Development',
    order: 3,
    description: 'Define your MVP, product roadmap, and pricing strategy',
    icon: '🚀',
    readingGuide: `
# 🚀 Phase 3: Product Development

**Purpose:** Define what you're building and how you'll price it.

**Reading Order:**
1. MVP Definition & Product Roadmap - Understand what to build first
2. Product Pricing Strategy - Set profitable prices that customers will pay

**Time to Complete:** 30-40 minutes

**Action Items After Reading:**
- [ ] Prioritize MVP features based on customer pain points
- [ ] Create a 90-day development timeline
- [ ] Validate pricing with 5-10 potential customers
- [ ] Identify technical resources needed to build MVP

**Key Outputs:**
- Clear MVP feature list (what's in, what's out)
- Product roadmap for first 12 months
- Pricing tiers with detailed justification
- Revenue projections based on pricing

**Next Step:** Begin Phase 4 (Team & Operations) to understand who you need to hire.
    `.trim(),
  },
  {
    sectionNames: ['Operations & Team Building'],
    folderName: '04-operations-team',
    displayName: 'Phase 4: Operations & Team',
    order: 4,
    description: 'Plan your hiring, operations, and day-to-day execution',
    icon: '👥',
    readingGuide: `
# 👥 Phase 4: Operations & Team

**Purpose:** Understand how your business will operate and who you need to hire.

**Reading Order:**
1. Hiring Plan & Key Roles - Know who to hire and when

**Time to Complete:** 20-30 minutes

**Action Items After Reading:**
- [ ] Create job descriptions for first 3 hires
- [ ] Set realistic salary budgets for each role
- [ ] Identify advisors or consultants you need
- [ ] Map out your org chart for first 12 months

**Key Considerations:**
- Prioritize roles that directly impact revenue
- Consider contractors/freelancers before full-time hires
- Build a diverse team with complementary skills
- Don't hire too early - validate first

**Next Step:** Move to Phase 5 (Marketing Strategy) to learn how to get customers.
    `.trim(),
  },
  {
    sectionNames: ['Go-To-Market Strategy & Growth'],
    folderName: '05-marketing-strategy',
    displayName: 'Phase 5: Marketing Strategy',
    order: 5,
    description: 'Learn how to launch, acquire customers, and grow',
    icon: '📈',
    readingGuide: `
# 📈 Phase 5: Marketing Strategy

**Purpose:** Create a systematic plan to acquire and retain customers.

**Reading Order:**
1. Go-To-Market Launch Plan - Your first 90 days strategy
2. Customer Acquisition Strategy - How to get your first 100 customers
3. Social Media Content Strategy - Build an engaged audience

**Time to Complete:** 45-60 minutes

**Action Items After Reading:**
- [ ] Create a pre-launch email list building campaign
- [ ] Set up Google Analytics and Facebook Pixel
- [ ] Draft your first 30 days of social media content
- [ ] Identify 5 strategic partnerships or influencers
- [ ] Set monthly customer acquisition goals

**Marketing Channels to Activate:**
- Social media (Instagram, TikTok, LinkedIn)
- Content marketing (blog, SEO)
- Paid advertising (Google, Facebook, Instagram)
- Email marketing and automation
- Partnerships and referrals

**Next Step:** Phase 6 (Financial Planning) to understand your numbers.
    `.trim(),
  },
  {
    sectionNames: ['Financial Planning & Projections'],
    folderName: '06-financial-planning',
    displayName: 'Phase 6: Financial Planning',
    order: 6,
    description: 'Understand your revenue, costs, and profitability',
    icon: '💰',
    readingGuide: `
# 💰 Phase 6: Financial Planning

**Purpose:** Build a realistic financial model and understand your path to profitability.

**Reading Order:**
1. Revenue & Profitability Forecast - Your financial projections

**Time to Complete:** 30-40 minutes

**Action Items After Reading:**
- [ ] Create a detailed startup cost spreadsheet
- [ ] Build a 12-month cash flow forecast
- [ ] Identify your break-even point (customers needed)
- [ ] Determine if you need funding (and how much)
- [ ] Set monthly revenue and profitability goals

**Critical Metrics to Track:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Burn Rate and Runway
- Gross Margin and Net Margin

**Next Step:** Phase 7 (Legal & Compliance) to handle legal requirements.
    `.trim(),
  },
  {
    sectionNames: ['Legal & Compliance'],
    folderName: '07-legal-compliance',
    displayName: 'Phase 7: Legal & Compliance',
    order: 7,
    description: 'Handle legal structure, contracts, and compliance',
    icon: '⚖️',
    readingGuide: `
# ⚖️ Phase 7: Legal & Compliance

**Purpose:** Ensure you're legally compliant and protected from day one.

**Reading Order:**
1. Legal & Compliance Checklist - Everything you need to handle legally

**Time to Complete:** 20-30 minutes

**Action Items After Reading:**
- [ ] Register your business entity (LLC, Corp, etc.)
- [ ] Get an EIN from the IRS
- [ ] Open a business bank account
- [ ] Purchase business insurance
- [ ] Create customer terms of service and privacy policy
- [ ] Consult with a lawyer on contracts and agreements

**Important:** Don't skip legal setup. It protects you, your assets, and your customers.

**Recommended Services:**
- LegalZoom or Stripe Atlas (business formation)
- Clerky (startup legal documents)
- Rocket Lawyer (contract templates)
- Hiscox or Next Insurance (business insurance)

**Next Step:** Phase 8 (Tech Setup) to choose your technology stack.
    `.trim(),
  },
  {
    sectionNames: ['Tech & Automation Setup'],
    folderName: '08-tech-stack',
    displayName: 'Phase 8: Tech Stack',
    order: 8,
    description: 'Choose the right tools and technology for your business',
    icon: '⚙️',
    readingGuide: `
# ⚙️ Phase 8: Tech Stack

**Purpose:** Select the right tools and technology to run your business efficiently.

**Reading Order:**
1. Tech Stack Recommendations - Recommended tools and platforms

**Time to Complete:** 30-40 minutes

**Action Items After Reading:**
- [ ] Sign up for recommended tools (start with free tiers)
- [ ] Set up your domain and email
- [ ] Create project management workspace
- [ ] Set up payment processing (Stripe, PayPal)
- [ ] Configure analytics and tracking
- [ ] Set up customer support system

**Essential Tool Categories:**
- Website & hosting
- Payment processing
- Email marketing
- Customer relationship management (CRM)
- Project management
- Accounting and invoicing
- Communication and collaboration

**Next Step:** Phase 9 (Investor Pitch) if you plan to raise funding.
    `.trim(),
  },
  {
    sectionNames: ['Investor Pitch & Funding Strategy'],
    folderName: '09-investor-pitch',
    displayName: 'Phase 9: Investor Pitch (Optional)',
    order: 9,
    description: 'Prepare your pitch deck and funding strategy',
    icon: '💼',
    readingGuide: `
# 💼 Phase 9: Investor Pitch (Optional)

**Purpose:** If you plan to raise funding, use this pitch deck outline to create a compelling presentation.

**Reading Order:**
1. Startup Pitch Deck Outline - Structure and content for your investor pitch

**Time to Complete:** 30-45 minutes

**Action Items After Reading:**
- [ ] Create your pitch deck (10-15 slides)
- [ ] Practice your 5-minute pitch
- [ ] Research angel investors and VCs in your space
- [ ] Join startup communities (AngelList, Y Combinator Startup School)
- [ ] Prepare financial model for investor questions

**When to Raise Funding:**
- You've validated product-market fit
- You have traction (revenue or users)
- You need capital to scale quickly
- You have a clear use of funds

**Alternative Funding Options:**
- Bootstrapping (self-funded)
- Friends and family round
- Revenue-based financing
- Small business loans
- Crowdfunding

**Note:** Most successful businesses start by bootstrapping and proving the concept before raising.

**Next Step:** Phase 10 (Launch Tools) to build your website and launch.
    `.trim(),
  },
  {
    sectionNames: ['Launch Tools'],
    folderName: '10-website-launch',
    displayName: 'Phase 10: Website & Launch',
    order: 10,
    description: 'Build your website and go live',
    icon: '🌐',
    readingGuide: `
# 🌐 Phase 10: Website & Launch

**Purpose:** Build your website and launch your business to the world.

**Reading Order:**
1. Website Builder AI Prompt - Detailed prompt to build your website with AI

**Time to Complete:** Variable (depending on complexity)

**Action Items After Reading:**
- [ ] Use the AI prompt with v0.dev, Replit, or Claude to build your site
- [ ] Customize the generated code with your branding
- [ ] Add your content (copy, images, videos)
- [ ] Set up hosting and domain
- [ ] Configure SSL certificate
- [ ] Test on mobile and desktop
- [ ] Launch! 🚀

**Website Builders Recommended:**
- v0.dev (AI-powered, Next.js/React)
- Replit (collaborative coding)
- Webflow (no-code, professional)
- WordPress (traditional, flexible)
- Shopify (e-commerce)

**Pre-Launch Checklist:**
- [ ] Website is live and tested
- [ ] Payment processing is configured
- [ ] Email marketing is set up
- [ ] Social media accounts created
- [ ] Google Analytics installed
- [ ] Customer support system ready
- [ ] Launch announcement email drafted
- [ ] Press release prepared (optional)

**Congratulations!** You've completed all 10 phases. Time to launch and get your first customers! 🎉
    `.trim(),
  },
];

/**
 * Organize deliverables into logical folder structure
 */
export function organizeDeliverables(
  deliverables: DeliverableFile[],
  projectName: string
): OrganizedStructure {
  const folders: FolderStructure[] = [];

  // Create folder structure based on definitions
  for (const folderDef of FOLDER_DEFINITIONS) {
    const folderFiles = deliverables
      .filter((d) => folderDef.sectionNames.includes(d.sectionName))
      .map((d, index) => ({
        filename: generateFilename(d.promptName, index + 1, d.outputFormat),
        order: index + 1,
        content: d.content,
        title: d.promptName,
      }));

    if (folderFiles.length > 0) {
      folders.push({
        folderName: folderDef.folderName,
        displayName: folderDef.displayName,
        order: folderDef.order,
        description: folderDef.description,
        icon: folderDef.icon,
        files: folderFiles,
        readmeContent: folderDef.readingGuide,
      });
    }
  }

  // Sort folders by order
  folders.sort((a, b) => a.order - b.order);

  // Generate main README
  const readmeContent = generateMainReadme(projectName, folders);

  // Generate GET_STARTED guide
  const getStartedContent = generateGetStartedGuide(projectName, folders);

  return {
    folders,
    readmeContent,
    getStartedContent,
  };
}

/**
 * Generate filename with logical numbering
 */
function generateFilename(
  promptName: string,
  order: number,
  format: 'markdown' | 'pdf'
): string {
  const extension = format === 'pdf' ? 'pdf' : 'md';
  const slug = promptName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${order.toString().padStart(2, '0')}-${slug}.${extension}`;
}

/**
 * Generate main README.md for the package
 */
function generateMainReadme(
  projectName: string,
  folders: FolderStructure[]
): string {
  const folderList = folders
    .map(
      (f) =>
        `### ${f.icon} ${f.displayName}\n${f.description}\n📁 \`${f.folderName}/\` (${f.files.length} documents)\n`
    )
    .join('\n');

  return `
# ${projectName} - Business in a Box

Welcome to your complete business package! This contains everything you need to launch **${projectName}**.

## 📦 What's Inside

This package contains **${folders.reduce((sum, f) => sum + f.files.length, 0)} professionally written documents** organized into **10 logical phases**.

${folderList}

## 🚀 How to Use This Package

**Step 1:** Start with \`GET_STARTED.md\` - read this first!

**Step 2:** Work through each phase in order (01 → 10)

**Step 3:** Complete the action items in each phase's README

**Step 4:** Use the documents as living guides - update them as you learn

## 📖 Reading Guide

Each folder contains:
- **README.md** - Reading order, action items, and context
- **Numbered documents** - Read in sequential order (01, 02, 03...)
- **PDF versions** - Professional formatted documents for offline reading

**Estimated Time:** 6-8 hours to read everything thoroughly

**Recommended Pace:** 1-2 phases per day over 1 week

## 🎯 Your Next Steps

1. ✅ Read \`GET_STARTED.md\` (5 minutes)
2. ✅ Read Phase 1: Market Research (30-45 mins)
3. ✅ Validate your market opportunity with additional research
4. ✅ Complete action items before moving to Phase 2

## 💡 Tips for Success

- **Don't skip phases** - Each builds on the previous
- **Take notes** - Jot down ideas and questions as you read
- **Take action** - Complete the checklists, don't just read
- **Iterate** - These documents are guides, not gospel. Adapt to your reality.
- **Ask for help** - Join startup communities, find mentors, ask questions

## 🛠️ Tools You'll Need

- **Spreadsheet software** (Google Sheets, Excel) for financial models
- **Design tools** (Canva, Figma) for branding and marketing
- **Project management** (Notion, Trello, Asana) to track tasks
- **Note-taking app** (Notion, Evernote) for insights and ideas

## 📞 Need Help?

If you have questions or need clarification on any section:
- Email: support@fullstackvibecoder.com
- Book a call: calendly.com/fullstackvibecoder/support

## 🎉 Ready to Launch?

Your business is more than an idea now - it's a complete plan. Time to execute!

**Remember:** Planning is essential, but execution is everything. Use this package as your roadmap, but don't wait for perfection. Launch, learn, and iterate.

Good luck! 🚀

---

Generated with [FullStackVibeCoder](https://fullstackvibecoder.com) - Business in a Box
  `.trim();
}

/**
 * Generate GET_STARTED.md quick guide
 */
function generateGetStartedGuide(
  projectName: string,
  folders: FolderStructure[]
): string {
  const phaseChecklist = folders
    .map((f, i) => `- [ ] ${f.icon} Phase ${i + 1}: ${f.displayName}`)
    .join('\n');

  return `
# 🚀 GET STARTED - ${projectName}

**Congratulations!** You've received your complete **Business in a Box** package.

This quick guide will help you make the most of your documents in the next 7 days.

## ✅ 7-Day Launch Plan

### Day 1-2: Research & Validation
- ✅ Read Phase 1: Market Research
- ✅ Validate market size with online research
- ✅ List 10 potential competitors
- ✅ Interview 3-5 potential customers

### Day 3: Branding & Identity
- ✅ Read Phase 2: Brand Identity
- ✅ Save brand colors and fonts
- ✅ Create social media accounts using brand guidelines
- ✅ Design initial logo concepts (or hire designer)

### Day 4: Product & Pricing
- ✅ Read Phase 3: Product Development
- ✅ Create detailed MVP feature list
- ✅ Validate pricing with potential customers
- ✅ Sketch wireframes or mockups

### Day 5: Marketing Strategy
- ✅ Read Phase 5: Marketing Strategy
- ✅ Draft 30 days of social media content
- ✅ Set up email marketing platform
- ✅ Create pre-launch landing page

### Day 6: Financials & Legal
- ✅ Read Phase 6: Financial Planning
- ✅ Read Phase 7: Legal & Compliance
- ✅ Register business entity
- ✅ Build financial model spreadsheet

### Day 7: Tech & Website
- ✅ Read Phase 8: Tech Stack
- ✅ Read Phase 10: Website & Launch
- ✅ Start building website (use AI prompt provided)
- ✅ Set up payment processing

## 📋 Full Phase Checklist

${phaseChecklist}

## 🎯 What Success Looks Like in 30 Days

By the end of 30 days, you should have:

✅ A validated business idea with real customer feedback
✅ A clear brand identity (colors, logo, messaging)
✅ A functional MVP or detailed prototype
✅ A pricing strategy backed by research
✅ A professional website (live or in development)
✅ Social media presence with 30 days of content planned
✅ A registered business entity
✅ 10-50 email subscribers (pre-launch list)
✅ A detailed financial model
✅ First paying customer (or pilot user)

## 💪 Mindset for Success

**1. Bias Towards Action**
Don't wait for perfection. Launch a simple version and iterate.

**2. Talk to Customers Daily**
Customer feedback is worth more than any business plan.

**3. Focus on Revenue**
The best validation is someone paying you money.

**4. Be Flexible**
Your initial plan will change. That's normal and healthy.

**5. Track Metrics**
Measure what matters: customers, revenue, engagement.

## 🚫 Common Mistakes to Avoid

❌ Building for months without customer feedback
❌ Perfectionism (waiting to launch until "everything is ready")
❌ Ignoring financials until you run out of money
❌ Hiring too many people too quickly
❌ Copying competitors instead of creating unique value
❌ Skipping legal setup (this will bite you later)
❌ Not testing pricing assumptions early

## 🎬 Your First Action

**Right now, take 5 minutes to:**

1. Open your calendar
2. Block out 1 hour each day for the next 7 days
3. Label these blocks "Build ${projectName}"
4. Commit to showing up every day

Consistency beats intensity. Small daily progress compounds into big results.

## 🤝 Join the Community

Connect with other builders:
- Twitter: Share your progress with #BuildInPublic
- Reddit: r/startups, r/Entrepreneur
- Indie Hackers: indiehackers.com
- Y Combinator Startup School: startupschool.org

## 📞 Questions?

Email: support@fullstackvibecoder.com
Book a call: calendly.com/fullstackvibecoder/support

---

**You've got this!** 🚀

The difference between dreamers and builders is action. You've done the planning. Now go build something people want.

— Team FullStackVibeCoder
  `.trim();
}
