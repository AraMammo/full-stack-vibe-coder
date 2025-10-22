import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "What is Vibe Coding? | Software Development in 2025 | FullStackVibeCoder",
  description: "Vibe coding is how modern developers build software 10x faster using AI. Learn why traditional line-by-line coding is becoming obsolete and how vibe coders are out-building seasoned developers.",
  keywords: "vibe coding, what is vibe coding, vibe coder, AI coding, AI software development, future of coding 2025, AI-assisted development",
  openGraph: {
    title: "What is Vibe Coding? The 2025 Developer Advantage",
    description: "Natural language + AI = production code in minutes. This is how everyone will code by 2026.",
    type: "article",
  },
  alternates: {
    canonical: "https://fullstackvibecoder.com/what-is-vibe-coding"
  }
};

export default function WhatIsVibeCodingPage() {
  // FAQ Schema for rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is vibe coding?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vibe coding is how modern developers build software in 2025. You describe what you want in natural language, AI generates working code, you review and refine it, then ship it. Unlike no-code tools, vibe coding produces real custom code at 10x the speed of traditional development."
        }
      },
      {
        "@type": "Question",
        "name": "How fast is vibe coding compared to traditional coding?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vibe coding is approximately 10x faster than traditional development. Features that take hours or days to code manually can be completed in minutes to hours with vibe coding. The speed comes from AI handling boilerplate and implementation while humans focus on architecture and requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Is vibe coding the same as no-code?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. No-code tools lock you into templates and platforms. Vibe coding produces real, custom code in languages like TypeScript, React, and Python that you own and can modify. It combines the speed of AI generation with the flexibility of traditional development."
        }
      },
      {
        "@type": "Question",
        "name": "Will vibe coding replace developers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Vibe coding makes good developers unstoppable. It requires domain knowledge, code literacy, system thinking, and quality judgment. The skill shifts from writing syntax to architecting systems and clearly communicating requirements. Developers who adopt vibe coding significantly outperform those who don't."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <article className="vibe-coding-page">
        <div className="vibe-coding-container">
          
          {/* Hero Section */}
          <header className="vibe-hero">
            <h1 className="vibe-h1">What is Vibe Coding?</h1>
            <p className="vibe-subtitle">
              The future of software development is here. This is how everyone will code by 2026.
            </p>
            
            <div className="vibe-hero-content">
              <div className="vibe-hero-text">
                <p className="vibe-lead">
                  Vibe coding is how modern developers build software in 2025. You describe what you want in plain language. 
                  AI generates production-ready code. You review and refine it. Then ship.
                </p>
                <p>
                  This is not no-code. No-code locks you into templates. Vibe coding produces real, custom code—TypeScript, 
                  React, Python, whatever you need—just exponentially faster.
                </p>
              </div>
              
              <div className="vibe-hero-example">
                <div className="code-block">
                  <div className="code-header">Your prompt</div>
                  <pre><code>"Build user authentication with email verification and password reset"</code></pre>
                </div>
                <div className="code-arrow">↓ AI generates in seconds ↓</div>
                <div className="code-block">
                  <div className="code-header">Working code produced</div>
                  <pre><code>{`// Complete implementation:
- JWT token management
- Email verification flow
- Password reset with expiry
- Security best practices
- Error handling
- Tests included`}</code></pre>
                </div>
              </div>
            </div>
            
            <a href="/pricing" className="vibe-cta-primary">
              See Vibe Coding in Action
            </a>
          </header>

          {/* How It Works */}
          <section className="vibe-section" aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="vibe-h2">How Vibe Coding Works</h2>
            
            <div className="vibe-steps">
              <div className="vibe-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Describe Intent</h3>
                  <p className="step-description">
                    Tell the AI what you want in natural language. Be specific about requirements, but don't worry about implementation details.
                  </p>
                  <div className="code-block small">
                    <pre><code>"Create admin dashboard with user table, filters, charts, and CSV export"</code></pre>
                  </div>
                </div>
              </div>

              <div className="vibe-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">AI Generates Code</h3>
                  <p className="step-description">
                    AI handles the implementation: components, state management, styling, error handling, and edge cases.
                  </p>
                  <div className="code-annotation">
                    ✓ Component structure<br/>
                    ✓ Data fetching<br/>
                    ✓ Responsive design<br/>
                    ✓ Error states
                  </div>
                </div>
              </div>

              <div className="vibe-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Human Review</h3>
                  <p className="step-description">
                    Read the code. Check logic. Test edge cases. This is where your expertise adds value.
                  </p>
                  <div className="code-block small">
                    <pre><code>// Review: "Add pagination for tables with 100+ rows"
// Refinement applied in seconds</code></pre>
                  </div>
                </div>
              </div>

              <div className="vibe-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3 className="step-title">Ship Production Code</h3>
                  <p className="step-description">
                    Deploy real, tested, production-ready code. No prototypes. No technical debt.
                  </p>
                  <div className="metric">
                    <strong>4 hours of work → 20 minutes</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="vibe-section" aria-labelledby="comparison">
            <h2 id="comparison" className="vibe-h2">Vibe Coding vs Traditional Coding</h2>
            
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Traditional Coding</th>
                    <th className="highlight-col">Vibe Coding</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="row-label">Speed</td>
                    <td>1x baseline</td>
                    <td className="highlight-col"><strong>10x faster</strong></td>
                  </tr>
                  <tr>
                    <td className="row-label">Primary Skill</td>
                    <td>Syntax mastery</td>
                    <td className="highlight-col"><strong>System thinking</strong></td>
                  </tr>
                  <tr>
                    <td className="row-label">Bottleneck</td>
                    <td>Typing speed</td>
                    <td className="highlight-col"><strong>Idea clarity</strong></td>
                  </tr>
                  <tr>
                    <td className="row-label">Learning Curve</td>
                    <td>Years</td>
                    <td className="highlight-col"><strong>Weeks</strong></td>
                  </tr>
                  <tr>
                    <td className="row-label">Cost</td>
                    <td>$100-200/hr</td>
                    <td className="highlight-col"><strong>$50-100/hr</strong></td>
                  </tr>
                  <tr>
                    <td className="row-label">Code Quality</td>
                    <td>Variable (human fatigue)</td>
                    <td className="highlight-col"><strong>Consistent (AI + review)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Real Examples */}
          <section className="vibe-section" aria-labelledby="real-examples">
            <h2 id="real-examples" className="vibe-h2">Real Examples</h2>
            
            <div className="examples-grid">
              <div className="example-card">
                <h3 className="example-title">Authentication System</h3>
                <div className="example-comparison">
                  <div className="example-time traditional">
                    <span className="time-label">Traditional:</span>
                    <span className="time-value">4 hours</span>
                  </div>
                  <div className="example-time vibe">
                    <span className="time-label">Vibe Coding:</span>
                    <span className="time-value">15 minutes</span>
                  </div>
                </div>
                <div className="example-prompt">
                  <strong>Prompt:</strong> "Build JWT-based auth with email verification and password reset"
                </div>
                <div className="example-details">
                  Complete implementation including setup, validation, error handling, security best practices, and email templates.
                </div>
              </div>

              <div className="example-card">
                <h3 className="example-title">Admin Dashboard</h3>
                <div className="example-comparison">
                  <div className="example-time traditional">
                    <span className="time-label">Traditional:</span>
                    <span className="time-value">8 hours</span>
                  </div>
                  <div className="example-time vibe">
                    <span className="time-label">Vibe Coding:</span>
                    <span className="time-value">45 minutes</span>
                  </div>
                </div>
                <div className="example-prompt">
                  <strong>Prompt:</strong> "Create admin dashboard with user table, charts, filters, and export"
                </div>
                <div className="example-details">
                  Full dashboard with data tables, interactive charts, search/filter functionality, CSV export, and responsive design.
                </div>
              </div>

              <div className="example-card">
                <h3 className="example-title">Payment Integration</h3>
                <div className="example-comparison">
                  <div className="example-time traditional">
                    <span className="time-label">Traditional:</span>
                    <span className="time-value">2 days</span>
                  </div>
                  <div className="example-time vibe">
                    <span className="time-label">Vibe Coding:</span>
                    <span className="time-value">2 hours</span>
                  </div>
                </div>
                <div className="example-prompt">
                  <strong>Prompt:</strong> "Integrate Stripe checkout with subscription management and webhooks"
                </div>
                <div className="example-details">
                  Complete Stripe integration with checkout flow, subscription handling, webhook processing, and error recovery.
                </div>
              </div>
            </div>
          </section>

          {/* Common Misconceptions */}
          <section className="vibe-section" aria-labelledby="misconceptions">
            <h2 id="misconceptions" className="vibe-h2">Common Misconceptions</h2>
            
            <div className="misconceptions-grid">
              <div className="misconception-card">
                <h3 className="misconception-title">"It's just ChatGPT"</h3>
                <p className="misconception-reality">
                  <strong>Reality:</strong> It's AI + architecture knowledge + code review + testing + deployment expertise. 
                  ChatGPT is one tool. Vibe coding is a methodology that combines multiple AI tools with human judgment.
                </p>
              </div>

              <div className="misconception-card">
                <h3 className="misconception-title">"The code must be terrible"</h3>
                <p className="misconception-reality">
                  <strong>Reality:</strong> It's production-tested and human-reviewed. AI doesn't get tired, doesn't cut corners, 
                  and follows best practices consistently. Human review catches edge cases AI might miss.
                </p>
              </div>

              <div className="misconception-card">
                <h3 className="misconception-title">"This will replace developers"</h3>
                <p className="misconception-reality">
                  <strong>Reality:</strong> It makes good developers unstoppable. You still need to understand systems, make 
                  architectural decisions, and review code. But you're freed from writing boilerplate.
                </p>
              </div>

              <div className="misconception-card">
                <h3 className="misconception-title">"Real developers don't need this"</h3>
                <p className="misconception-reality">
                  <strong>Reality:</strong> Real developers are already using it. The ones resisting are being outpaced by 
                  those who embrace it. This is Photoshop in 2000. Adapt or become economically obsolete.
                </p>
              </div>
            </div>
          </section>

          {/* Who Uses Vibe Coding */}
          <section className="vibe-section" aria-labelledby="who-uses">
            <h2 id="who-uses" className="vibe-h2">Who Uses Vibe Coding</h2>
            
            <div className="users-grid">
              <div className="user-card">
                <h3>Solo Developers</h3>
                <p>Shipping products 10x faster than they could writing line-by-line</p>
              </div>
              
              <div className="user-card">
                <h3>Development Agencies</h3>
                <p>Reducing costs while improving quality and delivery speed</p>
              </div>
              
              <div className="user-card">
                <h3>Startups</h3>
                <p>Building MVPs in weeks instead of months</p>
              </div>
              
              <div className="user-card">
                <h3>Technical Founders</h3>
                <p>Who understand code but don't want to write boilerplate</p>
              </div>
            </div>
          </section>

          {/* The Future */}
          <section className="vibe-section vibe-future" aria-labelledby="future">
            <h2 id="future" className="vibe-h2">The Future is Now</h2>
            
            <div className="future-content">
              <p className="future-statement">
                By 2026, vibe coding will be standard. The developers resisting this shift are like graphic designers who 
                refused to learn Photoshop in 2000. Technically skilled but economically obsolete.
              </p>
              
              <p className="future-statement">
                The question isn't whether to adopt vibe coding. It's whether you'll be early or late.
              </p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="vibe-final-cta">
            <h2 className="cta-title">Experience Vibe Coding For Your Project</h2>
            <p className="cta-description">
              Record your idea. Get a proposal in 6 hours.
            </p>
            <a href="/pricing" className="vibe-cta-primary large">
              Start a Project
            </a>
          </section>

        </div>
      </article>
    </>
  );
}
