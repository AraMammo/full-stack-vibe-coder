"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
interface Style {
  id: string;
  name: string;
}

export default function ReactionVideoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const [tiktokUrl, setTiktokUrl] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [styles, setStyles] = useState<Style[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [promoCode, setPromoCode] = useState("");
  const [validatedPromoCode, setValidatedPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);

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
        ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity})`;
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
            ctx.strokeStyle = `rgba(0, 255, 136, ${0.2 * (1 - distance / 120)})`;
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
          ctx.strokeStyle = `rgba(0, 170, 255, ${0.4 * (1 - distance / 150)})`;
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
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
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
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchStyles();
    }
  }, [hasAccess]);

  const fetchStyles = async () => {
    try {
      const response = await fetch("/api/airtable/fetch-styles");
      const data = await response.json();

      if (response.ok && data.styles) {
        setStyles(data.styles);
      } else {
        console.error("Failed to fetch styles");
      }
    } catch (err) {
      console.error("Error fetching styles:", err);
    }
  };

  const checkAccess = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setCheckingAccess(true);
    setError("");

    try {
      const response = await fetch(
        `/api/check-access?email=${encodeURIComponent(email)}&toolName=reaction-video-generator`,
      );
      const data = await response.json();

      if (data.hasAccess) {
        setHasAccess(true);
      } else {
        setError("No active subscription found. Please purchase access below.");
      }
    } catch (err) {
      setError("Failed to check access. Please try again.");
    } finally {
      setCheckingAccess(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setValidatingPromo(true);
    setPromoError("");
    setPromoMessage("");

    try {
      const response = await fetch(
        `/api/validate-promo?code=${encodeURIComponent(promoCode)}`,
      );
      const data = await response.json();

      if (data.valid) {
        setValidatedPromoCode(data.code);
        setDiscountPercent(data.discountPercent);
        setPromoMessage(`✓ ${data.code} applied! ${data.discountPercent}% off`);
        setPromoError("");
      } else {
        setValidatedPromoCode("");
        setDiscountPercent(0);
        setPromoError(data.message || "Invalid promo code");
        setPromoMessage("");
      }
    } catch (err) {
      setValidatedPromoCode("");
      setDiscountPercent(0);
      setPromoError("Failed to validate promo code");
      setPromoMessage("");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleCheckout = async (
    accessType: "monthly" | "annual" | "lifetime",
  ) => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/create-checkout-tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolId: "reaction-video-generator",
          accessType,
          email: email,
          promoCode: validatedPromoCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.isFree) {
        setHasAccess(true);
        setSuccessMessage(
          data.message || "Free access granted! You can now use the tool.",
        );
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "video/mp4" || file.type === "video/quicktime") {
        setVideoFile(file);
      } else {
        setError("Please upload a .mp4 or .mov file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "video/mp4" || file.type === "video/quicktime") {
        setVideoFile(file);
      } else {
        setError("Please upload a .mp4 or .mov file");
      }
    }
  };

  const handleSubmit = async () => {
    if (!tiktokUrl.trim()) {
      setError("Please enter a TikTok or Instagram Reel URL");
      return;
    }

    if (!videoFile) {
      setError("Please upload your reaction video");
      return;
    }

    if (!selectedStyle) {
      setError("Please select a video style");
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      setError("Video file must be under 500MB");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("tiktokUrl", tiktokUrl);
      formData.append("styleId", selectedStyle);
      formData.append("reactionVideo", videoFile);

      const response = await fetch("/api/airtable/create-reaction-video", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit video");
      }

      setSuccessMessage(
        "Your reaction video is being processed! You'll receive an email when it's ready.",
      );
      setTiktokUrl("");
      setVideoFile(null);
      setSelectedStyle("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit video. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="main-content" style={{ paddingTop: "120px" }}>
        <div className="glitch-container">
          <h1 className="main-title" data-text="REACTION VIDEO">
            REACTION VIDEO
          </h1>
          <h1 className="main-title" data-text="GENERATOR">
            GENERATOR
          </h1>
        </div>

        <p className="tagline">
          Turn Your Reaction Videos Into Professional Edits
        </p>

        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto 3rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              color: "#ccc",
              lineHeight: "1.8",
              marginBottom: "1.5rem",
            }}
          >
            Record yourself reacting to TikToks or Reels. We'll professionally
            composite your reaction with the original video and deliver a
            polished final edit ready to post.
          </p>

          <div
            style={{
              background: "rgba(0, 255, 136, 0.1)",
              border: "2px solid rgba(0, 255, 136, 0.3)",
              padding: "1.5rem",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                color: "#00ff88",
                fontSize: "1.2rem",
                marginBottom: "1rem",
                fontWeight: "700",
              }}
            >
              How It Works:
            </h3>
            <ol
              style={{
                color: "#ddd",
                fontSize: "1rem",
                lineHeight: "1.8",
                paddingLeft: "1.5rem",
              }}
            >
              <li>
                <strong>Record your reaction</strong> - Film yourself watching
                and reacting to the content
              </li>
              <li>
                <strong>Upload your video</strong> - Provide your reaction video
                (.mov or .mp4, up to 500MB)
              </li>
              <li>
                <strong>Share the source</strong> - Paste the TikTok or
                Instagram Reel URL you're reacting to
              </li>
              <li>
                <strong>Choose your style</strong> - Select where your reaction
                appears (bottom right, top left, etc.)
              </li>
              <li>
                <strong>Get your edit</strong> - We composite both videos
                together and email you the final result
              </li>
            </ol>
          </div>
        </div>

        {successMessage && (
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto 2rem",
              background: "rgba(0, 255, 136, 0.1)",
              border: "2px solid rgba(0, 255, 136, 0.5)",
              padding: "1.5rem",
              textAlign: "center",
              color: "#00ff88",
              fontSize: "1.1rem",
            }}
          >
            {successMessage}
          </div>
        )}

        {!hasAccess ? (
          <>
            <div
              style={{
                maxWidth: "600px",
                margin: "0 auto 4rem",
                padding: "2rem",
                background: "rgba(255, 255, 255, 0.03)",
                border: "2px solid rgba(0, 255, 136, 0.3)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "1.5rem",
                  color: "#00ff88",
                  textAlign: "center",
                }}
              >
                Enter Your Email
              </h2>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label className="form-label">Promo Code (Optional)</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={validatePromoCode}
                    disabled={validatingPromo || !promoCode.trim()}
                    style={{
                      padding: "0.8rem 1.5rem",
                      background: validatingPromo
                        ? "#555"
                        : "linear-gradient(135deg, #00ff88, #00aaff)",
                      border: "none",
                      color: "#000",
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      cursor: validatingPromo ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {validatingPromo ? "Checking..." : "Apply"}
                  </button>
                </div>
                {promoMessage && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      color: "#00ff88",
                      fontSize: "0.9rem",
                    }}
                  >
                    {promoMessage}
                  </div>
                )}
                {promoError && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      color: "#ff0080",
                      fontSize: "0.9rem",
                    }}
                  >
                    {promoError}
                  </div>
                )}
              </div>

              <button
                onClick={checkAccess}
                disabled={checkingAccess}
                style={{
                  width: "100%",
                  padding: "1rem 2rem",
                  marginTop: "1.5rem",
                  background: checkingAccess
                    ? "#555"
                    : "linear-gradient(135deg, #00ff88, #00aaff)",
                  border: "none",
                  color: "#000",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  cursor: checkingAccess ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {checkingAccess ? "Checking..." : "Check Access"}
              </button>
            </div>

            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: "2rem",
                  color: "#fff",
                }}
              >
                Choose Your Plan
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "2rem",
                  marginBottom: "3rem",
                }}
              >
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,170,255,0.1))",
                    border: "2px solid rgba(255,255,255,0.2)",
                    padding: "2rem",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      marginBottom: "1rem",
                      color: "#fff",
                    }}
                  >
                    Monthly
                  </h3>
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "900",
                      color: "#00ff88",
                      marginBottom: "1rem",
                    }}
                  >
                    $
                    {discountPercent > 0
                      ? (27 * (1 - discountPercent / 100)).toFixed(0)
                      : "27"}
                    <span style={{ fontSize: "1.2rem", color: "#aaa" }}>
                      /mo
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <div
                      style={{
                        color: "#00ff88",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <s style={{ color: "#666" }}>$27</s> Save $
                      {((27 * discountPercent) / 100).toFixed(0)}!
                    </div>
                  )}
                  <p style={{ color: "#aaa", marginBottom: "1.5rem" }}>
                    Billed monthly
                  </p>
                  <button
                    onClick={() => handleCheckout("monthly")}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "1rem 2rem",
                      background: "linear-gradient(135deg, #00ff88, #00aaff)",
                      border: "none",
                      color: "#000",
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? "Processing..." : "Subscribe"}
                  </button>
                </div>

                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,0,128,0.15), rgba(136,0,255,0.15))",
                    border: "3px solid #ff0080",
                    padding: "2rem",
                    position: "relative",
                    transition: "all 0.3s ease",
                    transform: "scale(1.05)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-15px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#ff0080",
                      color: "#fff",
                      padding: "0.3rem 1rem",
                      fontSize: "0.8rem",
                      fontWeight: "900",
                      letterSpacing: "0.1em",
                    }}
                  >
                    BEST VALUE
                  </div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      marginBottom: "1rem",
                      color: "#fff",
                    }}
                  >
                    Annual
                  </h3>
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "900",
                      color: "#ff0080",
                      marginBottom: "0.5rem",
                    }}
                  >
                    $
                    {discountPercent > 0
                      ? (270 * (1 - discountPercent / 100)).toFixed(0)
                      : "270"}
                    <span style={{ fontSize: "1.2rem", color: "#aaa" }}>
                      /yr
                    </span>
                  </div>
                  {discountPercent > 0 && (
                    <div
                      style={{
                        color: "#ff0080",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <s style={{ color: "#666" }}>$270</s> Save $
                      {((270 * discountPercent) / 100).toFixed(0)}!
                    </div>
                  )}
                  <p
                    style={{
                      color: "#ff0080",
                      marginBottom: "0.5rem",
                      fontWeight: "600",
                    }}
                  >
                    Save $214 - 2 months free!
                  </p>
                  <p
                    style={{
                      color: "#aaa",
                      marginBottom: "1.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    Just $22.50/month
                  </p>
                  <button
                    onClick={() => handleCheckout("annual")}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "1rem 2rem",
                      background: "linear-gradient(135deg, #ff0080, #8800ff)",
                      border: "none",
                      color: "#fff",
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? "Processing..." : "Subscribe"}
                  </button>
                </div>

                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,170,0,0.1), rgba(255,0,128,0.1))",
                    border: "2px solid rgba(255,170,0,0.5)",
                    padding: "2rem",
                    position: "relative",
                    transition: "all 0.3s ease",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      marginBottom: "1rem",
                      color: "#fff",
                    }}
                  >
                    Lifetime
                  </h3>
                  <div
                    style={{
                      fontSize: "3rem",
                      fontWeight: "900",
                      color: "#ffaa00",
                      marginBottom: "1rem",
                    }}
                  >
                    $
                    {discountPercent > 0
                      ? (397 * (1 - discountPercent / 100)).toFixed(0)
                      : "397"}
                  </div>
                  {discountPercent > 0 && (
                    <div
                      style={{
                        color: "#ffaa00",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem",
                      }}
                    >
                      <s style={{ color: "#666" }}>$397</s> Save $
                      {((397 * discountPercent) / 100).toFixed(0)}!
                    </div>
                  )}
                  <p style={{ color: "#aaa", marginBottom: "1.5rem" }}>
                    One-time payment
                  </p>
                  <button
                    onClick={() => handleCheckout("lifetime")}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "1rem 2rem",
                      background: "linear-gradient(135deg, #ffaa00, #ff0080)",
                      border: "none",
                      color: "#fff",
                      fontSize: "1.1rem",
                      fontWeight: "700",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(255, 0, 128, 0.1)",
                    border: "2px solid rgba(255, 0, 128, 0.5)",
                    padding: "1rem",
                    marginBottom: "2rem",
                    textAlign: "center",
                    color: "#ff0080",
                  }}
                >
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto 4rem",
              padding: "2rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "2px solid rgba(0, 255, 136, 0.3)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                marginBottom: "1.5rem",
                color: "#00ff88",
                textAlign: "center",
              }}
            >
              Create Your Reaction Video
            </h2>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">
                Source Video URL (The video you're reacting to) *
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://www.tiktok.com/@user/video/... or Instagram Reel link"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
              />
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#888",
                  marginTop: "0.5rem",
                }}
              >
                Paste the TikTok or Instagram Reel URL you filmed yourself
                reacting to
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Upload Your Reaction Video *</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? "#00ff88" : "rgba(0, 255, 136, 0.3)"}`,
                  borderRadius: "8px",
                  padding: "2rem",
                  textAlign: "center",
                  background: dragActive
                    ? "rgba(0, 255, 136, 0.05)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onClick={() => document.getElementById("video-upload")?.click()}
              >
                <input
                  id="video-upload"
                  type="file"
                  accept=".mp4,.mov,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {videoFile ? (
                  <div>
                    <p
                      style={{
                        color: "#00ff88",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {videoFile.name}
                    </p>
                    <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <p
                      style={{
                        color: "#00aaff",
                        fontSize: "0.9rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Click or drag to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        color: "#00ff88",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Drag & drop your reaction video here
                    </p>
                    <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                      or click to browse
                    </p>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.85rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      Upload the video of YOU reacting (.mp4 or .mov, max 500MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">
                Position Style (Where your reaction appears on screen) *
              </label>
              <select
                className="form-input"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
              >
                <option value="">Select where your reaction appears...</option>
                {styles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(255, 0, 128, 0.1)",
                  border: "2px solid rgba(255, 0, 128, 0.5)",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                  color: "#ff0080",
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%",
                padding: "1rem 2rem",
                background: submitting
                  ? "#555"
                  : "linear-gradient(135deg, #00ff88, #00aaff)",
                border: "none",
                color: "#000",
                fontSize: "1.1rem",
                fontWeight: "700",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {submitting ? "Submitting..." : "Generate Reaction Video"}
            </button>
          </div>
        )}
      </div>

      <div className="rotating-badges">
        <div className="badge">Automated</div>
        <div className="badge">Engaging</div>
        <div className="badge">Viral</div>
      </div>
    </>
  );
}
