/**
 * Client Access Setup Guide Page
 * 
 * Comprehensive guide for clients to set up access for their automation projects.
 * Features cyberpunk styling consistent with the rest of the site.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Client Access Setup Guide | FullStack Vibe Coder',
  description: 'Complete guide for providing technical access needed for your automation projects. Simple setup in under 10 minutes.',
};

export default function ClientAccessPage() {
  return (
    <div className="min-h-screen pt-[80px] bg-black relative overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-cyan-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22grid%22%20width%3D%2260%22%20height%3D%2260%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M%2060%200%20L%200%200%200%2060%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%220.5%22%20opacity%3D%220.1%22%2F%3E%3C%2Fpattern%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23grid)%22%2F%3E%3C%2Fsvg%3E')] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Main Header with Gradient */}
        <div className="mb-12 text-center">
          <h1 
            className="text-5xl md:text-6xl font-bold mb-4 animate-gradient"
            style={{
              background: 'linear-gradient(135deg, #FF0080 0%, #FF0060 25%, #7000FF 50%, #00D4FF 75%, #00FF88 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'gradient 3s ease infinite',
            }}
          >
            Client Access Setup Guide
          </h1>
          <p className="text-xl text-gray-400">Last Updated: November 2025</p>
          <p className="text-lg text-cyan-400 mt-4 max-w-2xl mx-auto">
            This guide helps our clients quickly provide the technical access needed to start their automation projects. 
            Most setups take under 10 minutes.
          </p>
        </div>

        {/* Quick Overview Section */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-pink-500/30 rounded-lg p-8 shadow-2xl shadow-pink-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Quick Overview
          </h2>
          <p className="text-gray-300 mb-4">For most projects, we need access to:</p>
          <ol className="space-y-3 ml-4">
            <li className="flex items-start">
              <span className="text-cyan-400 font-bold mr-3">1.</span>
              <div>
                <span className="text-white font-semibold">Airtable</span>
                <span className="text-gray-400"> - Your database/workflow system</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 font-bold mr-3">2.</span>
              <div>
                <span className="text-white font-semibold">Google Drive</span>
                <span className="text-gray-400"> - Document storage</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-cyan-400 font-bold mr-3">3.</span>
              <div>
                <span className="text-white font-semibold">Other Tools</span>
                <span className="text-gray-400"> - Any specialized platforms you use</span>
              </div>
            </li>
          </ol>
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
            <p className="text-sm text-gray-300">
              We'll use a project-specific email (like <code className="text-cyan-400">yourproject@fullstackvibecoder.com</code>) for all access. 
              This keeps things secure and makes cleanup easy when the project ends.
            </p>
          </div>
        </section>

        {/* Airtable Access Section */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 shadow-2xl shadow-cyan-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Airtable Access
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-pink-400 mb-3">Finding Your Base Information</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex"><span className="text-cyan-400 mr-2">1.</span> Open your Airtable workspace</li>
                <li className="flex"><span className="text-cyan-400 mr-2">2.</span> Navigate to your specific base (e.g., "Homework Submissions")</li>
                <li className="flex"><span className="text-cyan-400 mr-2">3.</span> Click "Share and sync" button (top right, looks like a person with a + sign)</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-pink-400 mb-3">Adding Our Project Email</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex"><span className="text-cyan-400 mr-2">1.</span> In the sharing dialog, click "Invite by email"</li>
                <li className="flex"><span className="text-cyan-400 mr-2">2.</span> Enter: <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">[project-name]@fullstackvibecoder.com</code></li>
                <li className="flex"><span className="text-cyan-400 mr-2">3.</span> Set permission level to <span className="font-semibold text-white">Creator</span> (we need this for webhooks/automation)</li>
                <li className="flex"><span className="text-cyan-400 mr-2">4.</span> Click "Send invite"</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-pink-400 mb-3">Getting Your Base ID (if needed)</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex"><span className="text-cyan-400 mr-2">1.</span> While in your base, look at the URL in your browser</li>
                <li className="flex"><span className="text-cyan-400 mr-2">2.</span> It will look like: <code className="bg-gray-800 px-2 py-1 rounded text-gray-400">airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY</code></li>
                <li className="flex"><span className="text-cyan-400 mr-2">3.</span> The part starting with <code className="text-cyan-400">app</code> is your Base ID</li>
                <li className="flex"><span className="text-cyan-400 mr-2">4.</span> Share this with us via secure message</li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-semibold text-pink-400 mb-3">API Key (Advanced - only if requested)</h3>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li>1. Click your profile picture (bottom left)</li>
                <li>2. Go to "Developer hub"</li>
                <li>3. Click "Create token" (blue button)</li>
                <li>4. Name it: <code className="text-cyan-400">FullStackVibeCoder-[YourProject]</code></li>
                <li>5. Under "Scopes", select: <code className="text-cyan-400">data.records:read</code>, <code className="text-cyan-400">data.records:write</code>, <code className="text-cyan-400">webhook:manage</code></li>
                <li>6. Under "Access", add your specific base</li>
                <li>7. Click "Create token"</li>
                <li>8. <span className="text-yellow-400 font-semibold">Important:</span> Copy immediately - you can't see it again!</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Google Drive Access Section */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-lg p-8 shadow-2xl shadow-green-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            Google Drive Access
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-pink-400 mb-3">Sharing a Folder</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex"><span className="text-cyan-400 mr-2">1.</span> Open Google Drive (drive.google.com)</li>
                <li className="flex"><span className="text-cyan-400 mr-2">2.</span> Right-click on your project folder</li>
                <li className="flex"><span className="text-cyan-400 mr-2">3.</span> Click "Share" → "Share with others"</li>
                <li className="flex"><span className="text-cyan-400 mr-2">4.</span> Enter: <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">[project-name]@fullstackvibecoder.com</code></li>
                <li className="flex"><span className="text-cyan-400 mr-2">5.</span> Set to <span className="font-semibold text-white">Viewer</span> (we only need read access)</li>
                <li className="flex"><span className="text-cyan-400 mr-2">6.</span> Uncheck "Notify people" (we'll see it immediately)</li>
                <li className="flex"><span className="text-cyan-400 mr-2">7.</span> Click "Share"</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-pink-400 mb-3">Finding Folder ID (if needed)</h3>
              <ol className="space-y-2 text-gray-300">
                <li className="flex"><span className="text-cyan-400 mr-2">1.</span> Open the folder in Google Drive</li>
                <li className="flex"><span className="text-cyan-400 mr-2">2.</span> Look at the URL: <code className="bg-gray-800 px-2 py-1 rounded text-gray-400">drive.google.com/drive/folders/XXXXXXXXXXXXX</code></li>
                <li className="flex"><span className="text-cyan-400 mr-2">3.</span> The string after <code className="text-cyan-400">/folders/</code> is your Folder ID</li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-500/30">
              <h3 className="text-lg font-semibold text-green-400 mb-2">For Google Workspace Admins</h3>
              <p className="text-sm text-gray-300">If you need to grant broader access:</p>
              <ol className="space-y-1 text-sm text-gray-300 mt-2">
                <li>1. Go to admin.google.com</li>
                <li>2. Navigate to Apps → Google Workspace → Drive and Docs</li>
                <li>3. Click "Sharing settings"</li>
                <li>4. Ensure external sharing is enabled for your domain</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Common AI/Automation Platforms */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-8 shadow-2xl shadow-purple-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Common AI/Automation Platforms
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Pickaxe</h3>
              <ol className="space-y-1 text-sm text-gray-300">
                <li>1. Log into your Pickaxe account</li>
                <li>2. Go to Settings → API Keys</li>
                <li>3. Click "Create New Key"</li>
                <li>4. Name it: <code className="text-cyan-400 text-xs">FullStackVibeCoder-Integration</code></li>
                <li>5. Copy and share securely</li>
              </ol>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Make (Integromat)</h3>
              <ol className="space-y-1 text-sm text-gray-300">
                <li>1. Go to Organization Settings</li>
                <li>2. Click "API Keys" in left menu</li>
                <li>3. Generate new key for our project</li>
                <li>4. Set appropriate scopes</li>
              </ol>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Zapier</h3>
              <ol className="space-y-1 text-sm text-gray-300">
                <li>1. Navigate to Settings & Members</li>
                <li>2. Click "Developer" → "API Key"</li>
                <li>3. Generate project-specific key</li>
                <li>4. Share via secure channel</li>
              </ol>
            </div>

            <div className="bg-black/30 p-4 rounded-lg border border-purple-500/20">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">ChatGPT/OpenAI</h3>
              <ol className="space-y-1 text-sm text-gray-300">
                <li>1. Visit platform.openai.com</li>
                <li>2. Go to API Keys section</li>
                <li>3. Click "Create new secret key"</li>
                <li>4. Name it descriptively</li>
                <li>5. Set usage limits for safety</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Security Best Practices */}
        <section className="mb-12 bg-gradient-to-r from-red-900/20 to-pink-900/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-8 shadow-2xl shadow-red-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
            Security Best Practices
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                <span className="mr-2">✅</span> What We Do
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Use project-specific emails</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Store credentials in encrypted vaults</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Enable 2FA where possible</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Document all access</li>
                <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> Revoke access post-project</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                <span className="mr-2">❌</span> What We Never Do
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start"><span className="text-red-400 mr-2">✗</span> Ask for your personal passwords</li>
                <li className="flex items-start"><span className="text-red-400 mr-2">✗</span> Request unnecessary admin access</li>
                <li className="flex items-start"><span className="text-red-400 mr-2">✗</span> Share credentials between projects</li>
                <li className="flex items-start"><span className="text-red-400 mr-2">✗</span> Keep access after contract ends</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sending Credentials Securely */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-blue-500/30 rounded-lg p-8 shadow-2xl shadow-blue-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Sending Credentials Securely
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-500/30">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Option 1: During Screen Share</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Simplest for non-technical users</li>
                <li>• We'll guide you through each step</li>
                <li>• Takes 15-20 minutes total</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Option 2: Encrypted Message</h3>
              <p className="text-sm text-gray-300">We'll send you a secure link where you can paste credentials. The link:</p>
              <ul className="text-sm text-gray-300 space-y-1 mt-2">
                <li>• Self-destructs after viewing</li>
                <li>• Is encrypted end-to-end</li>
                <li>• Leaves an audit trail</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 p-6 rounded-lg border border-pink-500/30">
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">Option 3: Password Manager</h3>
              <p className="text-sm text-gray-300">If your team uses 1Password, LastPass, etc:</p>
              <ul className="text-sm text-gray-300 space-y-1 mt-2">
                <li>• Create a shared vault</li>
                <li>• Add credentials there</li>
                <li>• Share with project email</li>
                <li>• Revoke when complete</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-8 shadow-2xl shadow-yellow-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            Troubleshooting Common Issues
          </h2>
          
          <div className="space-y-6">
            <div className="bg-black/30 p-6 rounded-lg border border-yellow-500/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">"I can't add external emails"</h3>
              <p className="text-gray-300 mb-2">Your IT team may have restrictions. Either:</p>
              <ol className="space-y-1 text-gray-300">
                <li>1. Ask IT to whitelist <code className="text-cyan-400">@fullstackvibecoder.com</code></li>
                <li>2. Create a service account within your system</li>
                <li>3. We'll work with your security requirements</li>
              </ol>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-yellow-500/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">"I don't see these options"</h3>
              <p className="text-gray-300 mb-2">You might not have admin access. You'll need to:</p>
              <ol className="space-y-1 text-gray-300">
                <li>1. Contact your workspace admin</li>
                <li>2. Or schedule a call where they can join</li>
                <li>3. We're happy to work with your team</li>
              </ol>
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-yellow-500/20">
              <h3 className="text-xl font-semibold text-yellow-400 mb-3">"Our security team has questions"</h3>
              <p className="text-gray-300 mb-2">Perfect! We welcome security reviews. We can provide:</p>
              <ul className="space-y-1 text-gray-300">
                <li>• Security practices documentation</li>
                <li>• Insurance certificates</li>
                <li>• Data handling agreements</li>
                <li>• References from similar projects</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12 bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-8 shadow-2xl shadow-indigo-500/10">
          <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Q: Why do you need Creator/Editor access in Airtable?</h3>
              <p className="text-gray-300">A: To set up webhooks and automations. We can work with less access but it limits functionality.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Q: Can we revoke access ourselves later?</h3>
              <p className="text-gray-300">A: Absolutely! We encourage it. We'll also remind you when the project ends.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Q: What if we use different tools?</h3>
              <p className="text-gray-300">A: This guide covers 80% of cases. We'll provide specific instructions for your unique tools.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Q: Is the project email monitored 24/7?</h3>
              <p className="text-gray-300">A: It forwards to our main system, so we'll see any notifications immediately during business hours.</p>
            </div>
          </div>
        </section>

        {/* Ready to Start CTA */}
        <section className="mb-12 bg-gradient-to-r from-pink-900/30 to-purple-900/30 backdrop-blur-sm border border-pink-500/30 rounded-lg p-12 shadow-2xl shadow-pink-500/20 text-center">
          <h2 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
            Ready to Start?
          </h2>
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-cyan-400 text-2xl">1.</span>
              <p className="text-lg text-gray-300">Gather the access points you can</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-cyan-400 text-2xl">2.</span>
              <p className="text-lg text-gray-300">Use this guide to add our project email</p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-cyan-400 text-2xl">3.</span>
              <p className="text-lg text-gray-300">Book a quick call for anything unclear</p>
            </div>
          </div>

          <p className="text-xl text-cyan-400 mt-8 mb-8">
            Most clients complete setup in under 15 minutes. We're here to help if you need us!
          </p>

          <div className="pt-6 border-t border-pink-500/30">
            <p className="text-gray-400">
              Questions? Email <a href="mailto:ara@fullstackvibecoder.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">ara@fullstackvibecoder.com</a> 
              {' '}or check <a href="/security" className="text-cyan-400 hover:text-cyan-300 transition-colors">fullstackvibecoder.com/security</a>
            </p>
          </div>
        </section>
      </div>

    </div>
  );
}