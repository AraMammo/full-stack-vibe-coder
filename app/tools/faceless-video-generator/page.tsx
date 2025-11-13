'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import VideoGeneratorForm from '@/components/VideoGeneratorForm';

export default function FacelessVideoGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: session, status } = useSession();
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
        ctx.fillStyle = `rgba(102, 255, 116, ${this.opacity})`;
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
            ctx.strokeStyle = `rgba(102, 255, 116, ${0.2 * (1 - distance / 120)})`;
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
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 * (1 - distance / 150)})`;
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
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

  // Authentication check
  if (status === 'loading') {
    return (
      <>
        <div className="noise"></div>
        <div className="grid-overlay"></div>
        <canvas ref={canvasRef} id="canvas"></canvas>
        <div className="main-content" style={{ paddingTop: '120px' }}>
          <p style={{ textAlign: 'center', color: '#fff' }}>Loading...</p>
        </div>
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <div className="noise"></div>
        <div className="grid-overlay"></div>
        <canvas ref={canvasRef} id="canvas"></canvas>
        <div className="main-content" style={{ paddingTop: '120px' }}>
          <div className="glitch-container">
            <h1 className="main-title" data-text="FACELESS VIDEO">
              FACELESS VIDEO
            </h1>
            <h1 className="main-title" data-text="GENERATOR">
              GENERATOR
            </h1>
          </div>

          <p className="tagline">
            Create Professional Faceless Videos with Animated Captions
          </p>

          <div
            style={{
              maxWidth: '700px',
              margin: '2rem auto',
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px solid rgba(102, 255, 116, 0.3)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                color: '#66ff74',
              }}
            >
              Sign In Required
            </h2>
            <p
              style={{
                color: '#ccc',
                marginBottom: '1.5rem',
                fontSize: '1.1rem',
                lineHeight: '1.6',
              }}
            >
              Please sign in to access the Faceless Video Generator.
            </p>
            <button
              onClick={() => router.push('/auth/signin')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #66ff74, #06b6d4)',
                border: 'none',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="main-content" style={{ paddingTop: '120px' }}>
        <div className="glitch-container">
          <h1 className="main-title" data-text="FACELESS VIDEO">
            FACELESS VIDEO
          </h1>
          <h1 className="main-title" data-text="GENERATOR">
            GENERATOR
          </h1>
        </div>

        <p className="tagline">
          Transform Image + Audio Pairs into Captioned Videos
        </p>

        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto 3rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '1.1rem',
              color: '#ccc',
              lineHeight: '1.8',
              marginBottom: '1.5rem',
            }}
          >
            Upload images and audio files to create professional faceless videos with:
          </p>

          <div
            style={{
              background: 'rgba(102, 255, 116, 0.1)',
              border: '2px solid rgba(102, 255, 116, 0.3)',
              padding: '1.5rem',
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                color: '#66ff74',
                fontSize: '1.2rem',
                marginBottom: '1rem',
                fontWeight: '700',
              }}
            >
              Features:
            </h3>
            <ul
              style={{
                color: '#ddd',
                fontSize: '1rem',
                lineHeight: '1.8',
                paddingLeft: '1.5rem',
              }}
            >
              <li>
                <strong>Ken Burns zoom effects</strong> - Dynamic image movement
              </li>
              <li>
                <strong>Audio synchronization</strong> - Perfect timing with captions
              </li>
              <li>
                <strong>Animated word-by-word captions</strong> - TikTok-style text
              </li>
              <li>
                <strong>Multiple scenes</strong> - Combine up to 10 image/audio pairs
              </li>
              <li>
                <strong>Custom caption styling</strong> - Colors, fonts, positions
              </li>
              <li>
                <strong>Fast processing</strong> - 2-5 minutes per scene
              </li>
            </ul>
          </div>
        </div>

        {/* Video Generator Form */}
        <VideoGeneratorForm />

        <div
          style={{
            maxWidth: '800px',
            margin: '3rem auto 0',
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h3
            style={{
              color: '#66ff74',
              fontSize: '1.2rem',
              marginBottom: '1rem',
              fontWeight: '700',
            }}
          >
            How It Works:
          </h3>
          <ol
            style={{
              color: '#ddd',
              fontSize: '1rem',
              lineHeight: '1.8',
              paddingLeft: '1.5rem',
            }}
          >
            <li>
              <strong>Upload your scenes</strong> - Add image and audio pairs (up to 10)
            </li>
            <li>
              <strong>Customize captions</strong> - Choose fonts, colors, and positioning (optional)
            </li>
            <li>
              <strong>Generate video</strong> - Our system creates your video with animations
            </li>
            <li>
              <strong>Track progress</strong> - Monitor processing in your dashboard
            </li>
            <li>
              <strong>Download & share</strong> - Get your final video ready to post
            </li>
          </ol>
        </div>
      </div>

      <div className="rotating-badges">
        <div className="badge">Automated</div>
        <div className="badge">Professional</div>
        <div className="badge">Fast</div>
      </div>
    </>
  );
}
