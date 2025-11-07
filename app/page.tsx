"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatInterface from "./components/ChatInterface";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [formSubject, setFormSubject] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const openForm = useCallback((subject: string) => {
    setFormSubject(subject);
    setShowForm(true);
  }, []);

  // Handle URL parameters for contact form
  useEffect(() => {
    try {
      const contact = searchParams.get("contact");
      const subject = searchParams.get("subject");

      if (contact === "true" && subject) {
        openForm(decodeURIComponent(subject));
        // Clean up URL with a small delay to avoid race conditions
        setTimeout(() => {
          router.replace("/", { scroll: false });
        }, 100);
      }
    } catch (error) {
      console.error("Error handling URL parameters:", error);
    }
  }, [searchParams, router, openForm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Morphing text animation
    const phrases = [
      "products that matter",
      "solutions for real problems",
      "end-to-end systems",
      "friction removed",
      "tech that works for people",
    ];

    let currentPhrase = 0;
    const morphingEl = document.getElementById("morphing");

    const morphInterval = setInterval(() => {
      if (!morphingEl) return;
      morphingEl.style.opacity = "0";
      setTimeout(() => {
        currentPhrase = (currentPhrase + 1) % phrases.length;
        morphingEl.textContent = phrases[currentPhrase];
        morphingEl.style.opacity = "1";
      }, 500);
    }, 3000);

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

    canvas.addEventListener("mousemove", handleMouseMove);

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
      ctx.fillStyle = "rgba(10, 10, 10, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    // Card 3D tilt effect
    const handleCardMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(".chaos-card");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x > 0 && x < rect.width && y > 0 && y < rect.height) {
          const rotateX = (y / rect.height - 0.5) * 10;
          const rotateY = (x / rect.width - 0.5) * -10;
          (card as HTMLElement).style.transform =
            `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        }
      });
    };

    document.addEventListener("mousemove", handleCardMouseMove);

    // Add mouseleave listeners after a delay to ensure cards exist
    setTimeout(() => {
      document.querySelectorAll(".chaos-card").forEach((card) => {
        card.addEventListener("mouseleave", () => {
          (card as HTMLElement).style.transform = "";
        });
      });
    }, 100);

    // Random glitch effect - DISABLED (no .main-title elements in current layout)
    // const glitchInterval = setInterval(() => {
    //   const titles = document.querySelectorAll('.main-title');
    //   if (titles.length > 0) {
    //     const random = titles[Math.floor(Math.random() * titles.length)] as HTMLElement;
    //     random.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
    //     setTimeout(() => {
    //       random.style.transform = '';
    //     }, 100);
    //   }
    // }, 3000);

    // Listen for contact form events from navigation
    const handleContactFormEvent = (event: any) => {
      try {
        openForm(event.detail?.subject || "General Inquiry");
      } catch (error) {
        console.error("Error handling contact form event:", error);
      }
    };

    window.addEventListener("openContactForm", handleContactFormEvent);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mousemove", handleCardMouseMove);
      window.removeEventListener("openContactForm", handleContactFormEvent);
      clearInterval(morphInterval);
      // clearInterval(glitchInterval); // Disabled with glitch effect
    };
  }, [openForm]);

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

      <div className="main-content" style={{ paddingTop: "120px" }}>
        {/* Value Proposition */}
        <div className="value-prop-container" style={{ marginBottom: "2rem" }}>
          <h2
            className="value-prop-headline"
            style={{
              background:
                "linear-gradient(135deg, #ec4899 0%, #f43f5e 25%, #06b6d4 75%, #10b981 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "1rem",
            }}
          >
            Voice note to Market-Ready Business. 30 minutes. $497.
          </h2>
          <p
            className="value-prop-subheadline"
            style={{ marginBottom: "1rem", fontSize: "1.3rem", fontWeight: "600" }}
          >
            Complete website, logo variations, competitive analysis, brand guidelines.
          </p>
          <p
            className="value-prop-subheadline"
            style={{ marginBottom: "1rem" }}
          >
            Plus: Market research, business plan, technical documentation, marketing strategy, and step-by-step launch guide.
          </p>
          <p
            className="value-prop-subheadline"
            style={{ marginBottom: "2rem", opacity: "0.9" }}
          >
            Everything you need to go live. No consultants. No waiting.
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
          <ChatInterface />
        </div>

        <a
          href="/what-is-vibe-coding"
          className="inline-link"
          style={{ marginTop: "2rem", marginBottom: "3rem", display: "block" }}
        >
          What's Vibe Coding? Learn more →
        </a>

        <div className="chaos-grid">
          <div className="chaos-card clickable-card" 
            onClick={() => router.push("/tools")}
            style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
          >
            <h3 className="card-title">
              <span className="badge-new" style={{ marginRight: "0.5rem" }}>
                NEW
              </span>
              Pre-Built Tools
            </h3>
            <p className="card-desc">
              Ready-to-deploy SaaS products. Substack newsletter automation,
              video reaction tools, and more. Each tool is complete and
              production-ready.
            </p>
            <a className="card-btn">
              Explore Pre-Built Tools →
            </a>
            
            {/* Coming Soon Overlay */}
            <div className="card-coming-soon-overlay">
              <div className="coming-soon-badge">
                <span>COMING SOON</span>
              </div>
            </div>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">Who Are We?</h3>
            <p className="card-desc">
              Ara ran a real estate team in Toronto. Got frustrated waiting for
              tech that never shipped. Learned to code. But here&apos;s the
              weapon: full stack developer AND end-to-end marketer. Branding.
              Meta ads. Google campaigns. The whole stack. This is what happens
              when operators become builders.
            </p>
            <a className="card-btn" onClick={() => openForm("Tell Me More")}>
              The origin story →
            </a>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">Launch Your Market-Ready Business</h3>
            <p className="card-desc">
              Got an idea? Turn your voice note into a complete market-ready business in 30
              minutes. Live website, logo variations, competitive analysis, brand guidelines,
              business plan, marketing strategy. Everything you need to go live immediately.
            </p>
            <a className="card-btn" onClick={() => router.push("/get-started")}>
              Get Your Market-Ready Business Now →
            </a>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">How We Work</h3>
            <p className="card-desc">
              You describe the problem. We build the solution. End-to-end. No
              endless meetings. No project managers. Just results.
            </p>
            <a
              className="card-btn"
              onClick={() => openForm("Let's Work Together")}
            >
              Let&apos;s work together →
            </a>
          </div>
        </div>
      </div>

      <div className="rotating-badges">
        <div className="badge">End to End</div>
        <div className="badge">Ship Fast</div>
        <div className="badge">No Fluff</div>
      </div>

      {showForm && (
        <ContactForm subject={formSubject} onClose={() => setShowForm(false)} />
      )}
    </>
  );
}

interface ContactFormProps {
  subject: string;
  onClose: () => void;
}

function ContactForm({ subject, onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [glitchText, setGlitchText] = useState("SEND MESSAGE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const glitchPhrases = [
      "SEND MESSAGE",
      "SHIP IT",
      "DEPLOY",
      "LAUNCH",
      "BUILD",
      "EXECUTE",
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % glitchPhrases.length;
      setGlitchText(glitchPhrases[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission with mailto fallback
    const mailtoLink = `mailto:ara@fullstackvibecoder.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
    )}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="form-overlay" onClick={onClose}>
      <div className="form-container" onClick={(e) => e.stopPropagation()}>
        <button className="form-close" onClick={onClose}>
          ×
        </button>

        <div className="form-glitch-title" data-text={subject}>
          {subject}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">NAME</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Your name"
            />
            <div className="input-glitch"></div>
          </div>

          <div className="form-group">
            <label className="form-label">EMAIL</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="your@email.com"
            />
            <div className="input-glitch"></div>
          </div>

          <div className="form-group">
            <label className="form-label">MESSAGE</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              className="form-textarea"
              placeholder="Tell us what you need..."
              rows={6}
            />
            <div className="input-glitch"></div>
          </div>

          <button type="submit" className="form-submit" disabled={isSubmitting}>
            <span className="submit-glitch" data-text={glitchText}>
              {glitchText}
            </span>
          </button>
        </form>

        <div className="form-noise"></div>
      </div>
    </div>
  );
}
