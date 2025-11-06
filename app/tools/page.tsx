'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Tool {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  annualPrice: number;
  lifetimePrice: number;
  slug: string;
}

const tools: Tool[] = [
  {
    id: 'substack-engine',
    slug: 'substack-engine',
    name: 'Substack Engine',
    description: 'Turn research into polished Substack articles in minutes. Feed it your notes, links, and ideas. Get back publication-ready content with your voice. Perfect for thought leaders, coaches, and experts who need to publish consistently but don\'t have time to write.',
    features: [
      'Research aggregation from multiple sources',
      'AI-powered content generation in your tone',
      'SEO optimization built-in',
      'Direct Substack publishing',
      'Saves 10+ hours per week'
    ],
    monthlyPrice: 67,
    annualPrice: 670,
    lifetimePrice: 997
  },
  {
    id: 'reaction-video-generator',
    slug: 'reaction-video',
    name: 'Reaction Video Generator',
    description: 'Film yourself reacting to TikToks or Reels. Upload your reaction video and the source URL. We professionally composite them together into a polished final edit ready to post. Perfect for content creators who want high-quality reaction videos without editing skills.',
    features: [
      'Upload your own reaction footage',
      'Professional video compositing',
      'Choose positioning style (bottom right, top left, etc.)',
      'Supports .mov and .mp4 files up to 500MB',
      'Fast turnaround - get your edit via email'
    ],
    monthlyPrice: 27,
    annualPrice: 270,
    lifetimePrice: 397
  }
];

export default function ToolsPage() {
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

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="main-content tools-page" style={{ 
        justifyContent: 'flex-start',
        paddingTop: '120px'
      }}>
        <div className="glitch-container">
          <h1 className="main-title" data-text="CONTENT">CONTENT</h1>
          <h1 className="main-title" data-text="AUTOMATION">AUTOMATION</h1>
          <h1 className="main-title" data-text="TOOLS">TOOLS</h1>
        </div>

        <p className="tagline">
          Pre-built automation that saves you hours every week. Built by operators who understand the grind.
        </p>

        {/* Tools Section with Coming Soon Overlay */}
        <div className="tools-section-wrapper">
          <div className="tools-grid tools-grid-locked">
            {tools.map((tool) => (
              <div key={tool.id} className="tool-card chaos-card">
                <h2 className="tool-name">{tool.name}</h2>
                <p className="tool-description">{tool.description}</p>

                <div className="tool-features">
                  <h3>What you get:</h3>
                  <ul>
                    {tool.features.map((feature, index) => (
                      <li key={index}>
                        <span className="feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="tool-pricing">
                  <div className="pricing-options">
                    <div className="pricing-option">
                      <div className="price-label">Monthly</div>
                      <div className="price-amount">${tool.monthlyPrice}/mo</div>
                    </div>
                    <div className="pricing-option">
                      <div className="price-label">Annual</div>
                      <div className="price-amount">${tool.annualPrice}/yr</div>
                      <div className="savings-badge">Save ${(tool.monthlyPrice * 12) - tool.annualPrice}</div>
                    </div>
                    <div className="pricing-option highlight">
                      <div className="price-label">Lifetime</div>
                      <div className="price-amount">${tool.lifetimePrice}</div>
                      <div className="best-value-badge">Best Value</div>
                    </div>
                  </div>
                </div>

                <button
                  className="subscribe-btn"
                  onClick={() => router.push(`/tools/${tool.slug}`)}
                >
                  View Details & Subscribe →
                </button>
              </div>
            ))}
          </div>

          {/* Coming Soon Overlay */}
          <div className="tools-coming-soon-overlay">
            <div className="coming-soon-content">
              <div className="coming-soon-badge">
                <span className="badge-text">COMING SOON</span>
              </div>
              <h2 className="coming-soon-title">These Tools Are Being Perfected</h2>
              <p className="coming-soon-description">
                We're putting the final touches on these automation tools.
                Sign up for Business in a Box below while you wait.
              </p>
              <button
                className="coming-soon-cta"
                onClick={() => router.push('/pricing')}
              >
                Explore Business in a Box →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rotating-badges">
        <div className="badge">Save Time</div>
        <div className="badge">Save Money</div>
        <div className="badge">Scale Fast</div>
      </div>
    </>
  );
}
