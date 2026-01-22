/**
 * Contact Page
 * Simple contact form for reaching FullStackVibeCoder team
 */

'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send to contact endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 
            className="text-5xl md:text-7xl font-black mb-4"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Contact Us
          </h1>
          <p className="text-xl text-gray-300">
            Got a project in mind? Let&apos;s build something incredible together.
          </p>
        </div>

        <div className="bg-black/80 backdrop-blur-xl border-2 border-pink-500/30 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-pink-400 uppercase tracking-wider mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-pink-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold text-pink-400 uppercase tracking-wider mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all resize-none"
                placeholder="Tell us about your project..."
              />
            </div>

            {submitStatus === 'success' && (
              <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                Thanks for reaching out! We&apos;ll get back to you soon.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                Something went wrong. Please try again later.
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-4 px-6 rounded-lg font-bold text-lg uppercase tracking-wider
                transition-all duration-300 transform
                ${isSubmitting 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-pink-500 to-cyan-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]'
                }
                text-white
              `}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Or email us directly at{' '}
              <a 
                href="mailto:hello@fullstackvibecoder.com" 
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                hello@fullstackvibecoder.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}