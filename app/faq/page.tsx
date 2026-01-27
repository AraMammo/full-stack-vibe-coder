'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: JSX.Element;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number>(0); // First question open by default

  const faqs: FAQItem[] = [
    {
      question: "What is vibe coding?",
      answer: (
        <div className="faq-answer-content">
          <p>
            Vibe coding is how modern developers build software in 2025. You describe what you want in natural language. 
            AI generates working code. You review and refine it. Then ship it.
          </p>
          
          <p>
            This is not no-code. No-code tools lock you into templates. Vibe coding produces real, custom code—TypeScript, 
            React, Python, whatever you need—just exponentially faster.
          </p>

          <div className="faq-section">
            <h3>How it works</h3>
            <ul>
              <li>Describe the intent: "Build user authentication with email verification"</li>
              <li>AI generates complete implementation with security and error handling</li>
              <li>Human reviews logic and edge cases</li>
              <li>Iterate instantly: "Make password requirements stricter" → done in seconds</li>
              <li>Ship production code, not prototypes</li>
            </ul>
          </div>

          <div className="faq-section">
            <h3>Why this matters</h3>
            <p>
              I'm out-coding 20-year veterans right now. Not because I'm smarter. Because I'm using 2025 tools. 
              A senior dev writing line-by-line is being outpaced by someone who clearly articulates requirements and uses AI to build.
            </p>
          </div>

          <div className="faq-section">
            <h3>Speed comparison</h3>
            <p><strong>Traditional:</strong> Think → Code → Debug → Test → Refactor (hours to days per feature)</p>
            <p><strong>Vibe coding:</strong> Think → Describe → Review → Ship (minutes to hours per feature)</p>
          </div>

          <div className="faq-section">
            <h3>What makes a good vibe coder</h3>
            <ul>
              <li><strong>Domain knowledge:</strong> Understanding what good software looks like</li>
              <li><strong>Clear communication:</strong> Vague prompts get vague code</li>
              <li><strong>Code literacy:</strong> Read and understand generated code to catch errors</li>
              <li><strong>System thinking:</strong> How components interact and depend on each other</li>
              <li><strong>Quality judgment:</strong> Know when AI output needs human refinement</li>
            </ul>
          </div>

          <p className="faq-punch">
            Everyone will code this way by 2026. Developers still writing boilerplate by hand will be like designers who 
            refused to learn Photoshop in 2000. Technically skilled but economically obsolete.
          </p>
        </div>
      )
    },
    {
      question: "How long does delivery take?",
      answer: (
        <div className="faq-answer-content">
          <p>
            Business In A Box packages are delivered in under 30 minutes. Most complete in 10-20 minutes.
          </p>
          <p>
            Record a voice note describing your business idea. Our AI generates everything—market research,
            brand identity, live website, and publishing guide—and delivers it all as a downloadable package.
          </p>
          <p>
            No meetings. No sales calls. Just record your idea and receive everything you need to launch.
          </p>
        </div>
      )
    },
    {
      question: "What's included in Business In A Box?",
      answer: (
        <div className="faq-answer-content">
          <p>Everything you need to launch your business, delivered in under 30 minutes:</p>
          <ul>
            <li><strong>Live Working Website:</strong> Deployed to a development link you can test immediately</li>
            <li><strong>Brand Identity:</strong> 5 custom logo designs, color scheme, typography, and brand guidelines</li>
            <li><strong>Business Analysis:</strong> Market research, competitor analysis, and business model validation</li>
            <li><strong>Publishing Guide:</strong> Step-by-step instructions to connect your own domain and go live</li>
            <li><strong>30-Minute Delivery:</strong> Complete package delivered in under 30 minutes</li>
            <li><strong>Full Ownership:</strong> You own everything—all code, designs, and assets</li>
          </ul>
        </div>
      )
    },
    {
      question: "How much does it cost?",
      answer: (
        <div className="faq-answer-content">
          <p>
            <strong>Business In A Box:</strong> Start free, upgrade anytime
          </p>
          <p>
            Three tiers available: Starter (Free), Complete ($197), and Turnkey ($497).
            Each includes market research, brand identity, and everything you need to launch.
            Delivered in under 30 minutes. You own everything.
          </p>
          <p>
            <strong>Custom Development:</strong> Contact for pricing
          </p>
          <p>
            For companies needing custom software, automation, or integrations beyond the standard packages.
            We build end-to-end solutions tailored to your specific needs.
          </p>
        </div>
      )
    },
    {
      question: "Do I need to know how to code?",
      answer: (
        <div className="faq-answer-content">
          <p>
            No. You just need to clearly describe what you want.
          </p>
          <p>
            I handle all the technical work—architecture, coding, testing, deployment. You communicate your requirements 
            through voice notes or text. I translate that into working software.
          </p>
          <p>
            If you do know code, great. You'll be able to review and understand what's being built. But it's not required.
          </p>
        </div>
      )
    },
    {
      question: "How is this different from hiring a traditional developer?",
      answer: (
        <div className="faq-answer-content">
          <p><strong>Speed:</strong> 10x faster delivery using vibe coding and AI</p>
          <p><strong>Cost:</strong> 50-70% less than traditional development agencies</p>
          <p><strong>Communication:</strong> No meetings. Voice notes only. Get proposals in hours, not weeks.</p>
          <p><strong>Ownership:</strong> You own all the code and assets. No vendor lock-in.</p>
          <p>
            Traditional developers write code line by line. I use AI to generate code, then apply 
            human expertise to review, refine, and ensure production quality. You get better results faster.
          </p>
        </div>
      )
    },
    {
      question: "What if I need changes or revisions?",
      answer: (
        <div className="faq-answer-content">
          <p>
            Business In A Box includes one round of revisions within the first week.
          </p>
          <p>
            For enterprise projects, revisions are handled based on the scope outlined in your proposal. 
            Most changes are simple with vibe coding—describe what you want changed, and it's done in minutes.
          </p>
          <p>
            If you need ongoing changes or maintenance, we can discuss a support arrangement. But most clients 
            get exactly what they need from the initial delivery.
          </p>
        </div>
      )
    },
    {
      question: "Can you integrate with my existing systems?",
      answer: (
        <div className="faq-answer-content">
          <p>
            Yes. I integrate with any system that has an API: Stripe, Airtable, Supabase, Shopify, HubSpot, 
            Make.com, Zapier—whatever you're using.
          </p>
          <p>
            For enterprise automation, most projects involve connecting multiple systems to eliminate manual data 
            transfer and streamline workflows.
          </p>
          <p>
            If your system doesn't have an API, we can often work around it with web scraping or manual exports, 
            depending on the use case.
          </p>
        </div>
      )
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion(index);
    }
  };

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <main className="faq-page">
        <div className="faq-container">
          <header className="faq-header">
            <h1 className="faq-title">Frequently Asked Questions</h1>
            <p className="faq-subtitle">
              Direct answers. No corporate speak. If you don't see your question, just ask.
            </p>
          </header>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  id={`faq-question-${index}`}
                  className={`faq-question ${openIndex === index ? 'active' : ''}`}
                  onClick={() => toggleAccordion(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-icon" aria-hidden="true">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </button>
                
                <div
                  id={`faq-answer-${index}`}
                  className={`faq-answer ${openIndex === index ? 'open' : ''}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                >
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>

          <div className="faq-cta">
            <h2>Still have questions?</h2>
            <p>Record a voice note describing your project. I'll answer your specific questions in the proposal.</p>
            <button
              className="faq-cta-button"
              onClick={() => window.location.href = '/get-started'}
            >
              Record Your Idea
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
