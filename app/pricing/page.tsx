'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

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

    // Particle system
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(102, 126, 234, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 100; i++) {
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

          if (distance < 120) {
            ctx.strokeStyle = `rgba(102, 126, 234, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        const dx = particles[i].x - mouseX;
        const dy = particles[i].y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          ctx.strokeStyle = `rgba(118, 75, 162, ${0.4 * (1 - distance / 150)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouseX, mouseY);
          ctx.stroke();
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    // Random glitch effect
    const glitchInterval = setInterval(() => {
      const titles = document.querySelectorAll('.main-title');
      const random = titles[Math.floor(Math.random() * titles.length)] as HTMLElement;
      random.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
      setTimeout(() => {
        random.style.transform = '';
      }, 100);
    }, 3000);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <div className="layer">
        <div className="floating-text ft-1">BUILD</div>
        <div className="floating-text ft-2">SHIP</div>
        <div className="floating-text ft-3">SOLVE</div>
        <div className="floating-text ft-4">FAST</div>
      </div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="main-content">
        <div className="glitch-container">
          <h1 className="main-title" data-text="BUSINESS">BUSINESS</h1>
          <h1 className="main-title" data-text="IN A BOX">IN A BOX</h1>
        </div>

        <h2 className="hero-headline">
          Turn Your Business Idea Into A Live Company In 48 Hours
        </h2>

        <p className="hero-subtext">
          Record a 5-minute voice note. Get a complete turn-key business: Website. Branding. Business Plan. Marketing. Everything.
        </p>

        <div className="price-container">
          <div className="price-strike">$997</div>
          <div className="price-main">$297</div>
          <div className="price-label">Launch Special - Limited Time</div>
        </div>

        <button className="cta-primary" onClick={() => router.push('/payment')}>
          Start Your Business Now →
        </button>

        {/* What's Included Section */}
        <div className="included-section">
          <h3 className="included-title">What You Get:</h3>
          <div className="included-grid">
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Live Landing Page</strong>
                <p>Hosted & deployed instantly</p>
              </div>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Brand Assets</strong>
                <p>Logo, colors, fonts</p>
              </div>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Business Plan PDF</strong>
                <p>10-15 pages, professional</p>
              </div>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Marketing Copy</strong>
                <p>Social posts, emails, ads</p>
              </div>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Business Model Canvas</strong>
                <p>Visual one-pager</p>
              </div>
            </div>
            <div className="included-item">
              <span className="check">✓</span>
              <div>
                <strong>Launch Checklist</strong>
                <p>Step-by-step guide</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="enterprise-section">
          <h3 className="enterprise-title">Need More Than A Startup Kit?</h3>
          <p className="enterprise-desc">
            We automate entire businesses end-to-end. Compliance systems. Legal tech. Content engines. 
            If you&apos;re spending $100K+/year on manual processes, we&apos;ll show you how to cut that by 60% in 90 days.
          </p>
          <div className="enterprise-pricing">
            <div className="enterprise-price">Minimum Investment: $20,000</div>
            <div className="enterprise-range">Average Project: $75,000 - $250,000</div>
          </div>
          <a href="mailto:ara@fullstackvibecoder.com?subject=Enterprise Automation Inquiry" className="enterprise-cta">
            Book Enterprise Consultation →
          </a>
        </div>

        <div className="back-to-home">
          <button className="back-btn" onClick={() => router.push('/')}>
            ← Back to Agency Services
          </button>
        </div>
      </div>

      <div className="rotating-badges">
        <div className="badge">48 Hours</div>
        <div className="badge">Zero Meetings</div>
        <div className="badge">Full Ownership</div>
      </div>
    </>
  );
}
