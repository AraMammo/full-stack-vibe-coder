'use client';

import { useEffect, useRef } from 'react';

export default function SuccessPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Celebration particles
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.8 + 0.2;
        this.color = `hsl(${Math.random() * 60 + 120}, 70%, 60%)`; // Green to yellow range
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.005;

        if (this.x > canvas!.width) this.x = 0;
        if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color.replace(')', `, ${this.opacity})`).replace('hsl', 'hsla');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle());
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        
        if (particle.opacity <= 0) {
          particles[index] = new Particle();
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>
      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="success-page">
        <div className="success-container">
          <div className="success-icon">🎉</div>
          
          <h1 className="success-title" data-text="SUCCESS!">SUCCESS!</h1>
          
          <h2 className="success-subtitle">
            Your Business Is Being Built
          </h2>

          <p className="success-message">
            We&apos;ve received your voice note and our team is now working on your complete business package. 
            You&apos;ll receive everything within 48 hours.
          </p>

          <div className="success-timeline">
            <div className="timeline-item">
              <div className="timeline-icon">✓</div>
              <div className="timeline-content">
                <strong>Payment Processed</strong>
                <p>Your order is confirmed</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-icon">🎤</div>
              <div className="timeline-content">
                <strong>Voice Note Received</strong>
                <p>Your business idea is being analyzed</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-icon">⚡</div>
              <div className="timeline-content">
                <strong>Building Your Business</strong>
                <p>Website, branding, and assets in progress</p>
              </div>
            </div>
            
            <div className="timeline-item">
              <div className="timeline-icon">📧</div>
              <div className="timeline-content">
                <strong>Delivery</strong>
                <p>Complete package delivered within 48 hours</p>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <a href="mailto:ara@fullstackvibecoder.com" className="success-btn">
              Questions? Email Us →
            </a>
            <button 
              className="success-btn secondary"
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </button>
          </div>

          <div className="success-guarantee">
            <p>💯 <strong>100% Money-Back Guarantee</strong></p>
            <p>If we don&apos;t deliver in 48 hours, full refund. No questions asked.</p>
          </div>
        </div>
      </div>
    </>
  );
}
