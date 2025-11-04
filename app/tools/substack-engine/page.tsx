'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation/Navigation';

export default function SubstackEnginePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  
  const [contentType, setContentType] = useState<'text' | 'link' | 'audio'>('text');
  const [textContent, setTextContent] = useState('');
  const [linkContent, setLinkContent] = useState('');
  const [transformationActions, setTransformationActions] = useState<number[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [validatedPromoCode, setValidatedPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        ctx.fillStyle = `rgba(255, 0, 128, ${this.opacity})`;
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
            ctx.strokeStyle = `rgba(255, 0, 128, ${0.2 * (1 - distance / 120)})`;
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
          ctx.strokeStyle = `rgba(136, 0, 255, ${0.4 * (1 - distance / 150)})`;
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

  const checkAccess = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setCheckingAccess(true);
    setError('');

    try {
      const response = await fetch(`/api/check-access?email=${encodeURIComponent(email)}&toolName=substack-engine`);
      const data = await response.json();
      
      if (data.hasAccess) {
        setHasAccess(true);
      } else {
        setError('No active subscription found. Please purchase access below.');
      }
    } catch (err) {
      setError('Failed to check access. Please try again.');
    } finally {
      setCheckingAccess(false);
    }
  };

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setValidatingPromo(true);
    setPromoError('');
    setPromoMessage('');

    try {
      const response = await fetch(`/api/validate-promo?code=${encodeURIComponent(promoCode)}`);
      const data = await response.json();

      if (data.valid) {
        setValidatedPromoCode(data.code);
        setDiscountPercent(data.discountPercent);
        setPromoMessage(`✓ ${data.code} applied! ${data.discountPercent}% off`);
        setPromoError('');
      } else {
        setValidatedPromoCode('');
        setDiscountPercent(0);
        setPromoError(data.message || 'Invalid promo code');
        setPromoMessage('');
      }
    } catch (err) {
      setValidatedPromoCode('');
      setDiscountPercent(0);
      setPromoError('Failed to validate promo code');
      setPromoMessage('');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleCheckout = async (accessType: 'monthly' | 'annual' | 'lifetime') => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-checkout-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolId: 'substack-engine',
          accessType,
          email: email,
          promoCode: validatedPromoCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Handle free access (100% discount)
      if (data.isFree) {
        setHasAccess(true);
        setSuccessMessage(data.message || 'Free access granted! You can now use the tool.');
        setError('');
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTransformationAction = (actionId: number) => {
    setTransformationActions(prev => 
      prev.includes(actionId) 
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        setRecordedAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (transformationActions.length === 0) {
      setError('Please select at least one transformation action');
      return;
    }

    if (contentType === 'text' && !textContent.trim()) {
      setError('Please enter your text idea');
      return;
    }

    if (contentType === 'link' && !linkContent.trim()) {
      setError('Please enter a YouTube or TikTok link');
      return;
    }

    if (contentType === 'audio' && !recordedAudio) {
      setError('Please record a voice note');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('contentType', contentType);
      formData.append('transformationActions', JSON.stringify(transformationActions));

      if (contentType === 'text') {
        formData.append('content', textContent);
      } else if (contentType === 'link') {
        formData.append('content', linkContent);
      } else if (contentType === 'audio' && recordedAudio) {
        formData.append('audio', recordedAudio);
      }

      const response = await fetch('/api/airtable/create-content', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit content');
      }

      setSuccessMessage('Your content is being processed! You\'ll receive an email when ready.');
      setTextContent('');
      setLinkContent('');
      setRecordedAudio(null);
      setTransformationActions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit content. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="noise"></div>
      <div className="grid-overlay"></div>

      <canvas ref={canvasRef} id="canvas"></canvas>

      <div className="main-content" style={{ paddingTop: '120px' }}>
        <div className="glitch-container">
          <h1 className="main-title" data-text="SUBSTACK ENGINE">SUBSTACK ENGINE</h1>
        </div>

        <p className="tagline">
          Automated Content Generation for Your Substack
        </p>

        <div style={{ maxWidth: '800px', margin: '0 auto 3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: '1.8' }}>
            Generate high-quality Substack posts automatically. Our AI-powered engine creates engaging, 
            well-researched content tailored to your voice and audience. Turn your ideas into polished 
            articles in minutes, not hours.
          </p>
        </div>

        {!hasAccess ? (
          <>
            <div style={{ 
              maxWidth: '600px', 
              margin: '0 auto 4rem', 
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '2px solid rgba(255, 0, 128, 0.3)'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                marginBottom: '1.5rem',
                color: '#ff0080',
                textAlign: 'center'
              }}>
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

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Promo Code (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    disabled={validatingPromo}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(0, 170, 255, 0.2)',
                      border: '2px solid #00aaff',
                      borderRadius: '8px',
                      color: '#00aaff',
                      cursor: validatingPromo ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      opacity: validatingPromo ? 0.6 : 1
                    }}
                  >
                    {validatingPromo ? 'Validating...' : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '4px',
                    color: '#00ff88',
                    fontSize: '0.9rem'
                  }}>
                    {promoMessage}
                  </div>
                )}
                {promoError && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: 'rgba(255, 0, 128, 0.1)',
                    border: '1px solid rgba(255, 0, 128, 0.3)',
                    borderRadius: '4px',
                    color: '#ff0080',
                    fontSize: '0.9rem'
                  }}>
                    {promoError}
                  </div>
                )}
              </div>

              <button
                onClick={checkAccess}
                disabled={checkingAccess}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  marginTop: '1rem',
                  background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                  border: 'none',
                  color: '#000',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: checkingAccess ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: checkingAccess ? 0.6 : 1
                }}
              >
                {checkingAccess ? 'Checking...' : 'Check Access'}
              </button>
            </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: '800', 
            textAlign: 'center', 
            marginBottom: '2rem',
            color: '#fff'
          }}>
            Choose Your Plan
          </h2>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,0,128,0.1), rgba(136,0,255,0.1))',
              border: '2px solid rgba(255,255,255,0.2)',
              padding: '2rem',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>
                Monthly
              </h3>
              <div>
                {discountPercent > 0 ? (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#888', textDecoration: 'line-through', marginBottom: '0.5rem' }}>
                      $67<span style={{ fontSize: '1rem' }}>/mo</span>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '900', color: '#00ff88', marginBottom: '1rem' }}>
                      ${(67 * (1 - discountPercent / 100)).toFixed(2)}<span style={{ fontSize: '1.2rem', color: '#aaa' }}>/mo</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#ff0080', marginBottom: '1rem' }}>
                    $67<span style={{ fontSize: '1.2rem', color: '#aaa' }}>/mo</span>
                  </div>
                )}
              </div>
              <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>Billed monthly</p>
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #ff0080, #8800ff)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing...' : 'Subscribe'}
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,170,255,0.15))',
              border: '3px solid #00ff88',
              padding: '2rem',
              position: 'relative',
              transition: 'all 0.3s ease',
              transform: 'scale(1.05)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#00ff88',
                color: '#000',
                padding: '0.3rem 1rem',
                fontSize: '0.8rem',
                fontWeight: '900',
                letterSpacing: '0.1em'
              }}>
                BEST VALUE
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>
                Annual
              </h3>
              <div>
                {discountPercent > 0 ? (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#888', textDecoration: 'line-through', marginBottom: '0.5rem' }}>
                      $670<span style={{ fontSize: '1rem' }}>/yr</span>
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '900', color: '#00ff88', marginBottom: '0.5rem' }}>
                      ${(670 * (1 - discountPercent / 100)).toFixed(2)}<span style={{ fontSize: '1.2rem', color: '#aaa' }}>/yr</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#00ff88', marginBottom: '0.5rem' }}>
                    $670<span style={{ fontSize: '1.2rem', color: '#aaa' }}>/yr</span>
                  </div>
                )}
              </div>
              {discountPercent === 0 ? (
                <>
                  <p style={{ color: '#00ff88', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Save $536 - 2 months free!
                  </p>
                  <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Just $55.83/month
                  </p>
                </>
              ) : (
                <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Just ${((670 * (1 - discountPercent / 100)) / 12).toFixed(2)}/month
                </p>
              )}
              <button
                onClick={() => handleCheckout('annual')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                  border: 'none',
                  color: '#000',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing...' : 'Subscribe'}
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(255,170,0,0.1), rgba(255,0,128,0.1))',
              border: '2px solid rgba(255,170,0,0.5)',
              padding: '2rem',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#fff' }}>
                Lifetime
              </h3>
              <div>
                {discountPercent > 0 ? (
                  <>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#888', textDecoration: 'line-through', marginBottom: '0.5rem' }}>
                      $997
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: '900', color: '#00ff88', marginBottom: '1rem' }}>
                      ${(997 * (1 - discountPercent / 100)).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#ffaa00', marginBottom: '1rem' }}>
                    $997<span style={{ fontSize: '1.2rem', color: '#aaa' }}></span>
                  </div>
                )}
              </div>
              <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>One-time payment</p>
              <button
                onClick={() => handleCheckout('lifetime')}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  background: 'linear-gradient(135deg, #ffaa00, #ff0080)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255, 0, 128, 0.1)',
              border: '2px solid rgba(255, 0, 128, 0.5)',
              padding: '1rem',
              marginBottom: '2rem',
              textAlign: 'center',
              color: '#ff0080'
            }}>
              {error}
            </div>
          )}
        </div>
          </>
        ) : (
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto 4rem', 
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '2px solid rgba(0, 255, 136, 0.3)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              marginBottom: '1.5rem',
              color: '#00ff88',
              textAlign: 'center'
            }}>
              Submit Your Content
            </h2>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Content Type</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="radio"
                    name="contentType"
                    value="text"
                    checked={contentType === 'text'}
                    onChange={() => setContentType('text')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Text Idea
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="radio"
                    name="contentType"
                    value="link"
                    checked={contentType === 'link'}
                    onChange={() => setContentType('link')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Social Media Link
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="radio"
                    name="contentType"
                    value="audio"
                    checked={contentType === 'audio'}
                    onChange={() => setContentType('audio')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Voice Note
                </label>
              </div>
            </div>

            {contentType === 'text' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Your Text Idea</label>
                <textarea
                  className="form-input"
                  placeholder="Enter your content idea here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={6}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            {contentType === 'link' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">YouTube or TikTok Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://youtube.com/... or https://tiktok.com/..."
                  value={linkContent}
                  onChange={(e) => setLinkContent(e.target.value)}
                />
              </div>
            )}

            {contentType === 'audio' && (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Record Voice Note</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {!isRecording && !recordedAudio && (
                    <button
                      onClick={startRecording}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(0, 170, 255, 0.2)',
                        border: '2px solid #00aaff',
                        borderRadius: '8px',
                        color: '#00aaff',
                        cursor: 'pointer',
                        fontSize: '1rem'
                      }}
                    >
                      🎤 Start Recording
                    </button>
                  )}
                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'rgba(255, 0, 0, 0.3)',
                        border: '2px solid #ff0000',
                        borderRadius: '8px',
                        color: '#ff0000',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        animation: 'pulse 1s infinite'
                      }}
                    >
                      ⏹ Stop Recording
                    </button>
                  )}
                  {recordedAudio && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#00ff88' }}>✓ Audio recorded</span>
                      <button
                        onClick={() => { setRecordedAudio(null); }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'transparent',
                          border: '1px solid #ff0080',
                          borderRadius: '8px',
                          color: '#ff0080',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Re-record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Transformation Actions (select at least one)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={transformationActions.includes(2)}
                    onChange={() => toggleTransformationAction(2)}
                    style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                  />
                  Text to Blog
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={transformationActions.includes(8)}
                    onChange={() => toggleTransformationAction(8)}
                    style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                  />
                  Create Email
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={transformationActions.includes(5)}
                    onChange={() => toggleTransformationAction(5)}
                    style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                  />
                  Text to 5x Tweets
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={transformationActions.includes(3)}
                    onChange={() => toggleTransformationAction(3)}
                    style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                  />
                  Text to Carousel
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #00ff88, #00aaff)',
                border: 'none',
                color: '#000',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: submitting ? 0.6 : 1,
                borderRadius: '8px'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Content'}
            </button>

            {successMessage && (
              <div style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '2px solid rgba(0, 255, 136, 0.5)',
                padding: '1rem',
                marginTop: '1rem',
                textAlign: 'center',
                color: '#00ff88',
                borderRadius: '8px'
              }}>
                {successMessage}
              </div>
            )}

            {error && (
              <div style={{
                background: 'rgba(255, 0, 128, 0.1)',
                border: '2px solid rgba(255, 0, 128, 0.5)',
                padding: '1rem',
                marginTop: '1rem',
                textAlign: 'center',
                color: '#ff0080',
                borderRadius: '8px'
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rotating-badges">
        <div className="badge">AI Powered</div>
        <div className="badge">Fast</div>
        <div className="badge">Quality</div>
      </div>
    </>
  );
}
