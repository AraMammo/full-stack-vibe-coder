'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';

export default function PricingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [glitchText, setGlitchText] = useState('BUSINESS IN A BOX');
  const [priceGlitch, setPriceGlitch] = useState('$297');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Enhanced particle system with more visual impact
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
      pulse: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 4 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.pulse = Math.random() * Math.PI * 2;
        
        // More vibrant colors
        const colors = [
          'rgba(255, 0, 100, ',
          'rgba(0, 255, 200, ',
          'rgba(255, 100, 0, ',
          'rgba(150, 0, 255, ',
          'rgba(0, 200, 255, '
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.pulse += 0.05;

        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        const pulseSize = this.size + Math.sin(this.pulse) * 2;
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color.replace('rgba', 'rgb').replace(', 0.8)', ')');
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    function connectParticles() {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * (1 - distance / 150)})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }
        }

        const dx = particles[i].x - mouseX;
        const dy = particles[i].y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          ctx.strokeStyle = `rgba(255, 0, 100, ${0.6 * (1 - distance / 200)})`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(255, 0, 100, 0.8)';
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    // Enhanced glitch effects
    const glitchInterval = setInterval(() => {
      const titles = document.querySelectorAll('.main-title, .price-main');
      const random = titles[Math.floor(Math.random() * titles.length)] as HTMLElement;
      if (random) {
        random.style.transform = `translateX(${Math.random() * 8 - 4}px) translateY(${Math.random() * 4 - 2}px)`;
        random.style.textShadow = `${Math.random() * 4 - 2}px ${Math.random() * 4 - 2}px 0px rgba(255, 0, 100, 0.8)`;
        setTimeout(() => {
          random.style.transform = '';
          random.style.textShadow = '';
        }, 150);
      }
    }, 2000);

    // Text glitch effect
    const textGlitchInterval = setInterval(() => {
      const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const originalText = 'BUSINESS IN A BOX';
      let glitchedText = '';
      
      for (let i = 0; i < originalText.length; i++) {
        if (Math.random() < 0.1) {
          glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
        } else {
          glitchedText += originalText[i];
        }
      }
      
      setGlitchText(glitchedText);
      
      setTimeout(() => {
        setGlitchText(originalText);
      }, 200);
    }, 4000);

    // Price glitch effect
    const priceGlitchInterval = setInterval(() => {
      const prices = ['$297', '$997', '$197', '$397', '$297'];
      const randomPrice = prices[Math.floor(Math.random() * prices.length)];
      setPriceGlitch(randomPrice);
      
      setTimeout(() => {
        setPriceGlitch('$297');
      }, 300);
    }, 3000);

    // Listen for contact form events from navigation
    const handleContactFormEvent = (event: any) => {
      try {
        // Redirect to homepage with contact form
        router.push('/?contact=true&subject=' + encodeURIComponent(event.detail?.subject || 'General Inquiry'));
      } catch (error) {
        console.error('Error handling contact form event:', error);
        router.push('/');
      }
    };

    window.addEventListener('openContactForm', handleContactFormEvent);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('openContactForm', handleContactFormEvent);
      clearInterval(glitchInterval);
      clearInterval(textGlitchInterval);
      clearInterval(priceGlitchInterval);
    };
  }, []);

  return (
    <>
      <Navigation />
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <div className="layer">
        <div className="floating-text ft-1">BUILD</div>
        <div className="floating-text ft-2">SHIP</div>
        <div className="floating-text ft-3">SOLVE</div>
        <div className="floating-text ft-4">FAST</div>
        <div className="floating-text ft-5">LAUNCH</div>
        <div className="floating-text ft-6">SCALE</div>
      </div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="pricing-page">
        <div className="pricing-container">
          {/* Hero Section */}
          <div className="pricing-hero">
            <div className="glitch-container">
              <h1 className="main-title pricing-title" data-text={glitchText}>
                {glitchText}
              </h1>
            </div>

            <h2 className="hero-headline pricing-headline">
              Turn Your Business Idea Into A Live Company In 48 Hours
            </h2>

            <p className="hero-subtext pricing-subtext">
              Record a 5-minute voice note. Get a complete turn-key business: Website. Branding. Business Plan. Marketing. Everything.
            </p>

            {/* Enhanced Price Section */}
            <div className="price-section">
              <div className="price-container pricing-price-container">
                <div className="price-strike pricing-strike">$997</div>
                <div className="price-main pricing-price-main">{priceGlitch}</div>
                <div className="price-label pricing-label">Launch Special - Limited Time</div>
              </div>

              <button 
                className="cta-primary pricing-cta" 
                onClick={() => router.push('/payment')}
              >
                <span className="cta-text">Start Your Business Now</span>
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>

          {/* What's Included Section */}
          <div className="included-section pricing-included">
            <h3 className="included-title pricing-included-title">What You Get:</h3>
            <div className="included-grid pricing-grid">
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Live Landing Page</strong>
                  <p className="item-desc">Hosted & deployed instantly</p>
                </div>
              </div>
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Brand Assets</strong>
                  <p className="item-desc">Logo, colors, fonts</p>
                </div>
              </div>
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Business Plan PDF</strong>
                  <p className="item-desc">10-15 pages, professional</p>
                </div>
              </div>
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Marketing Copy</strong>
                  <p className="item-desc">Social posts, emails, ads</p>
                </div>
              </div>
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Business Model Canvas</strong>
                  <p className="item-desc">Visual one-pager</p>
                </div>
              </div>
              <div className="included-item pricing-item">
                <span className="check pricing-check">✓</span>
                <div className="item-content">
                  <strong className="item-title">Launch Checklist</strong>
                  <p className="item-desc">Step-by-step guide</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Section */}
          <div className="enterprise-section pricing-enterprise">
            <h3 className="enterprise-title pricing-enterprise-title">Need More Than A Startup Kit?</h3>
            <p className="enterprise-desc pricing-enterprise-desc">
              We automate entire businesses end-to-end. Compliance systems. Legal tech. Content engines. 
              If you&apos;re spending $100K+/year on manual processes, we&apos;ll show you how to cut that by 60% in 90 days.
            </p>
            <div className="enterprise-pricing pricing-enterprise-pricing">
              <div className="enterprise-price pricing-enterprise-price">Minimum Investment: $20,000</div>
              <div className="enterprise-range pricing-enterprise-range">Average Project: $75,000 - $250,000</div>
            </div>
            <button 
              className="enterprise-cta pricing-enterprise-cta"
              onClick={() => {
                try {
                  const event = new CustomEvent('openContactForm', { detail: { subject: 'Enterprise Automation Inquiry' } });
                  window.dispatchEvent(event);
                } catch (error) {
                  console.error('Error dispatching contact form event:', error);
                  router.push('/?contact=true&subject=' + encodeURIComponent('Enterprise Automation Inquiry'));
                }
              }}
            >
              Book Enterprise Consultation →
            </button>
          </div>

          {/* Back Button */}
          <div className="back-to-home pricing-back">
            <button className="back-btn pricing-back-btn" onClick={() => router.push('/')}>
              ← Back to Agency Services
            </button>
          </div>
        </div>
      </div>

      <div className="rotating-badges pricing-badges">
        <div className="badge pricing-badge">48 HOURS</div>
        <div className="badge pricing-badge">ZERO MEETINGS</div>
        <div className="badge pricing-badge">FULL OWNERSHIP</div>
      </div>
    </>
  );
}