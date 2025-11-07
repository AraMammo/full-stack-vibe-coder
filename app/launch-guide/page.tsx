'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Launch Guide - Customer-facing step-by-step guide
 *
 * Helps Business in a Box customers get their website live on a custom domain.
 * Interactive, on-brand, mobile-responsive.
 */

interface Step {
  number: number;
  title: string;
  time: string;
  content: React.ReactNode;
}

export default function LaunchGuidePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: Step[] = [
    {
      number: 1,
      title: 'Choose Your Domain Name',
      time: '10-15 minutes',
      content: <Step1Content />,
    },
    {
      number: 2,
      title: 'Access Your Vercel Dashboard',
      time: '5 minutes',
      content: <Step2Content />,
    },
    {
      number: 3,
      title: 'Configure DNS Settings',
      time: '10-15 minutes',
      content: <Step3Content />,
    },
    {
      number: 4,
      title: 'Verify & Launch',
      time: '5-30 minutes',
      content: <Step4Content />,
    },
  ];

  const handleStepComplete = (stepNumber: number) => {
    if (!completedSteps.includes(stepNumber)) {
      setCompletedSteps([...completedSteps, stepNumber]);
    }
    if (stepNumber < steps.length) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const currentStepData = steps.find(s => s.number === currentStep);

  return (
    <div className="launch-guide-page">
      {/* Hero Section */}
      <section className="launch-hero">
        <div className="launch-hero-content">
          <h1 className="launch-title">
            Get Your Website Live
          </h1>
          <p className="launch-subtitle">
            Your website is already built and deployed. Now let's get it on your own domain in 4 simple steps.
          </p>
          <div className="launch-stats">
            <div className="stat">
              <div className="stat-number">30-60 min</div>
              <div className="stat-label">Total Time</div>
            </div>
            <div className="stat">
              <div className="stat-number">$10-15</div>
              <div className="stat-label">Per Year</div>
            </div>
            <div className="stat">
              <div className="stat-number">4 Steps</div>
              <div className="stat-label">To Launch</div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="progress-section">
        <div className="progress-container">
          <div className="progress-steps">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`progress-step ${
                  completedSteps.includes(step.number) ? 'completed' : ''
                } ${currentStep === step.number ? 'active' : ''}`}
                onClick={() => setCurrentStep(step.number)}
              >
                <div className="progress-step-number">
                  {completedSteps.includes(step.number) ? '✓' : step.number}
                </div>
                <div className="progress-step-label">{step.title}</div>
              </div>
            ))}
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Current Step Content */}
      {currentStepData && (
        <section className="step-content-section">
          <div className="step-content-container">
            <div className="step-header">
              <div className="step-badge">Step {currentStepData.number} of 4</div>
              <h2 className="step-title">{currentStepData.title}</h2>
              <div className="step-time">⏱️ {currentStepData.time}</div>
            </div>

            <div className="step-content">
              {currentStepData.content}
            </div>

            <div className="step-actions">
              {currentStep > 1 && (
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  ← Previous Step
                </button>
              )}
              <button
                className="btn-primary"
                onClick={() => handleStepComplete(currentStep)}
              >
                {currentStep === steps.length ? 'Finish 🎉' : 'Next Step →'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Completion Message */}
      {completedSteps.length === steps.length && (
        <section className="completion-section">
          <div className="completion-card">
            <h2 className="completion-title">🎉 You're Live!</h2>
            <p className="completion-text">
              Congratulations! Your website is now live on your custom domain.
              Time to tell the world!
            </p>
            <div className="completion-actions">
              <a href="#next-steps" className="completion-btn">
                What's Next?
              </a>
              <Link href="/contact" className="completion-btn-secondary">
                Need Help?
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Help Section */}
      <section className="help-section" id="help">
        <div className="help-container">
          <h2 className="help-title">Need Help?</h2>
          <p className="help-text">
            As a Business in a Box customer, you get 30 days of free support.
          </p>
          <div className="help-grid">
            <div className="help-card">
              <div className="help-icon">📧</div>
              <h3>Email Support</h3>
              <p>support@fullstackvibecoder.com</p>
              <p className="help-meta">Response within 24 hours</p>
            </div>
            <div className="help-card">
              <div className="help-icon">🔧</div>
              <h3>Troubleshooting</h3>
              <p>Check our common issues guide</p>
              <a href="#troubleshooting" className="help-link">View Solutions →</a>
            </div>
            <div className="help-card">
              <div className="help-icon">📚</div>
              <h3>Documentation</h3>
              <p>Detailed technical docs</p>
              <a href="#docs" className="help-link">Read Docs →</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// STEP 1: Choose Domain
// ============================================

function Step1Content() {
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>('');

  const registrars = [
    {
      id: 'namecheap',
      name: 'Namecheap',
      price: '$8-12/year',
      best: 'Beginners',
      url: 'https://www.namecheap.com',
      pros: ['Free privacy protection', 'Easy DNS management', 'Great support'],
    },
    {
      id: 'google',
      name: 'Google Domains',
      price: '$12/year',
      best: 'Simple & Clean',
      url: 'https://domains.google.com',
      pros: ['Google integration', 'Clean interface', 'Reliable'],
    },
    {
      id: 'godaddy',
      name: 'GoDaddy',
      price: '$10-20/year',
      best: 'Most Popular',
      url: 'https://www.godaddy.com',
      pros: ['24/7 phone support', 'Frequent promotions', 'Well-known'],
    },
  ];

  return (
    <div className="step-content-inner">
      <div className="content-block">
        <h3>Choose Your Domain Registrar</h3>
        <p>Pick where you'll buy your domain name. All three are trusted and reliable.</p>

        <div className="registrar-grid">
          {registrars.map((reg) => (
            <div
              key={reg.id}
              className={`registrar-card ${selectedRegistrar === reg.id ? 'selected' : ''}`}
              onClick={() => setSelectedRegistrar(reg.id)}
            >
              <div className="registrar-header">
                <h4>{reg.name}</h4>
                <div className="registrar-badge">{reg.best}</div>
              </div>
              <div className="registrar-price">{reg.price}</div>
              <ul className="registrar-pros">
                {reg.pros.map((pro, i) => (
                  <li key={i}>✓ {pro}</li>
                ))}
              </ul>
              <a href={reg.url} target="_blank" rel="noopener noreferrer" className="registrar-link">
                Visit {reg.name} →
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="content-block">
        <h3>How to Choose Your Domain Name</h3>
        <div className="tips-grid">
          <div className="tip-card tip-do">
            <h4>✅ DO</h4>
            <ul>
              <li>Keep it short (under 15 characters)</li>
              <li>Make it easy to spell and say</li>
              <li>Use .com if available</li>
              <li>Check social media availability</li>
            </ul>
          </div>
          <div className="tip-card tip-dont">
            <h4>❌ DON'T</h4>
            <ul>
              <li>Use hyphens or numbers</li>
              <li>Copy competitor names</li>
              <li>Pick hard-to-spell words</li>
              <li>Rush the decision</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3>Quick Purchase Steps</h3>
        <ol className="steps-list">
          <li>Go to your chosen registrar's website</li>
          <li>Search for your desired domain name</li>
          <li>If available, add .com to cart</li>
          <li>Decline extra services (you don't need them yet)</li>
          <li>Create account and complete purchase</li>
          <li>Verify your email (check spam folder)</li>
        </ol>
      </div>
    </div>
  );
}

// ============================================
// STEP 2: Vercel Dashboard
// ============================================

function Step2Content() {
  return (
    <div className="step-content-inner">
      <div className="content-block">
        <h3>Access Your Vercel Dashboard</h3>
        <p>Your website is already deployed on Vercel. Now we'll connect your custom domain.</p>

        <div className="instruction-card">
          <div className="instruction-number">1</div>
          <div className="instruction-content">
            <h4>Sign into Vercel</h4>
            <p>Go to <a href="https://vercel.com/login" target="_blank" rel="noopener noreferrer">vercel.com/login</a></p>
            <p className="instruction-note">Use the same account from your delivery email</p>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-number">2</div>
          <div className="instruction-content">
            <h4>Find Your Project</h4>
            <p>Look for your project name (sent in delivery email)</p>
            <p className="instruction-note">Click on the project to open it</p>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-number">3</div>
          <div className="instruction-content">
            <h4>Navigate to Domains</h4>
            <ul className="instruction-steps">
              <li>Click "Settings" tab at the top</li>
              <li>Select "Domains" from left menu</li>
              <li>Click "Add Domain" button</li>
            </ul>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-number">4</div>
          <div className="instruction-content">
            <h4>Add Your Domain</h4>
            <p>Type your new domain (e.g., <code>yourbusiness.com</code>)</p>
            <p>Click "Add"</p>
            <div className="alert-info">
              Vercel will show DNS records - keep this page open for the next step!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 3: DNS Configuration
// ============================================

function Step3Content() {
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>('namecheap');

  const dnsConfigs = {
    namecheap: {
      name: 'Namecheap',
      steps: [
        'Log into Namecheap',
        'Go to Dashboard → Domain List',
        'Click "Manage" next to your domain',
        'Click "Advanced DNS" tab',
        'Delete any existing A or CNAME records',
        'Add the records below',
        'Click "Save All Changes"',
      ],
    },
    google: {
      name: 'Google Domains',
      steps: [
        'Log into Google Domains',
        'Select your domain',
        'Click "DNS" in left menu',
        'Under "Custom records", click "Manage custom records"',
        'Add the records below',
        'Click "Save"',
      ],
    },
    godaddy: {
      name: 'GoDaddy',
      steps: [
        'Log into GoDaddy',
        'Go to My Products → DNS',
        'Click "Manage DNS"',
        'Delete existing A records for "@"',
        'Click "Add" to create new records',
        'Add the records below',
        'Click "Save"',
      ],
    },
  };

  const config = dnsConfigs[selectedRegistrar as keyof typeof dnsConfigs];

  return (
    <div className="step-content-inner">
      <div className="content-block">
        <h3>Configure Your DNS Settings</h3>
        <p>This connects your domain name to your Vercel website.</p>

        <div className="registrar-selector">
          <label>Select your domain registrar:</label>
          <div className="registrar-buttons">
            <button
              className={`registrar-btn ${selectedRegistrar === 'namecheap' ? 'active' : ''}`}
              onClick={() => setSelectedRegistrar('namecheap')}
            >
              Namecheap
            </button>
            <button
              className={`registrar-btn ${selectedRegistrar === 'google' ? 'active' : ''}`}
              onClick={() => setSelectedRegistrar('google')}
            >
              Google Domains
            </button>
            <button
              className={`registrar-btn ${selectedRegistrar === 'godaddy' ? 'active' : ''}`}
              onClick={() => setSelectedRegistrar('godaddy')}
            >
              GoDaddy
            </button>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3>{config.name} Instructions</h3>
        <ol className="steps-list">
          {config.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="content-block">
        <h3>DNS Records to Add</h3>
        <div className="dns-records">
          <div className="dns-record">
            <div className="dns-record-header">
              <span className="dns-badge">A Record</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('76.76.21.21')}>
                Copy
              </button>
            </div>
            <div className="dns-field">
              <label>Type:</label>
              <code>A</code>
            </div>
            <div className="dns-field">
              <label>Host/Name:</label>
              <code>@</code>
            </div>
            <div className="dns-field">
              <label>Value:</label>
              <code>76.76.21.21</code>
            </div>
            <div className="dns-field">
              <label>TTL:</label>
              <code>Automatic (or 3600)</code>
            </div>
          </div>

          <div className="dns-record">
            <div className="dns-record-header">
              <span className="dns-badge">CNAME Record</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('cname.vercel-dns.com')}>
                Copy
              </button>
            </div>
            <div className="dns-field">
              <label>Type:</label>
              <code>CNAME</code>
            </div>
            <div className="dns-field">
              <label>Host/Name:</label>
              <code>www</code>
            </div>
            <div className="dns-field">
              <label>Value:</label>
              <code>cname.vercel-dns.com</code>
            </div>
            <div className="dns-field">
              <label>TTL:</label>
              <code>Automatic (or 3600)</code>
            </div>
          </div>
        </div>

        <div className="alert-warning">
          ⏱️ DNS changes take 5-30 minutes to propagate worldwide. Be patient!
        </div>
      </div>
    </div>
  );
}

// ============================================
// STEP 4: Verify & Launch
// ============================================

function Step4Content() {
  return (
    <div className="step-content-inner">
      <div className="content-block">
        <h3>Verify Your Domain</h3>
        <p>Let's check if everything is working correctly.</p>

        <div className="instruction-card">
          <div className="instruction-number">1</div>
          <div className="instruction-content">
            <h4>Return to Vercel Dashboard</h4>
            <p>Go back to your project's Domains settings</p>
            <p className="instruction-note">You should see green checkmarks appearing next to your domain</p>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-number">2</div>
          <div className="instruction-content">
            <h4>Test Your Domain</h4>
            <p>Open a new browser tab and visit: <code>https://yourdomain.com</code></p>
            <p className="instruction-note">Your website should load!</p>
          </div>
        </div>

        <div className="instruction-card">
          <div className="instruction-number">3</div>
          <div className="instruction-content">
            <h4>If It's Not Working Yet...</h4>
            <ul className="instruction-steps">
              <li>DNS can take up to 30 minutes - be patient</li>
              <li>Try clearing your browser cache</li>
              <li>Test on your phone (different network)</li>
              <li>Check in incognito/private browsing mode</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3>SSL Certificate (Automatic)</h3>
        <div className="ssl-info">
          <div className="ssl-icon">🔒</div>
          <div>
            <h4>Your site is automatically secured!</h4>
            <p>Vercel provides a free SSL certificate. Look for the padlock icon in your browser.</p>
            <ul>
              <li>✓ https:// is forced automatically</li>
              <li>✓ Data is encrypted</li>
              <li>✓ Google trusts your site</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="content-block">
        <h3>Launch Checklist</h3>
        <div className="checklist">
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Website loads on custom domain</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>SSL certificate shows (padlock icon)</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Contact forms work</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>Mobile version looks good</span>
          </label>
          <label className="checklist-item">
            <input type="checkbox" />
            <span>All pages load correctly</span>
          </label>
        </div>
      </div>

      <div className="content-block">
        <h3>Next Steps</h3>
        <div className="next-steps-grid">
          <div className="next-step-card">
            <h4>📣 Announce Your Launch</h4>
            <p>Update social media, tell your network, send emails</p>
          </div>
          <div className="next-step-card">
            <h4>📊 Set Up Analytics</h4>
            <p>Add Google Analytics to track your visitors</p>
          </div>
          <div className="next-step-card">
            <h4>🔍 Submit to Google</h4>
            <p>Add your site to Google Search Console</p>
          </div>
        </div>
      </div>
    </div>
  );
}
