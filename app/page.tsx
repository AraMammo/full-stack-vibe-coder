'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Canvas particle effect
    const canvas = document.getElementById('canvas') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
      maxLife: number
    }> = []

    const colors = ['#ff0080', '#00ff88', '#8800ff', '#ffaa00']

    function createParticle() {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 200 + 100
      })
    }

    function animate() {
      if (!ctx) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create new particles
      if (Math.random() < 0.1) {
        createParticle()
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++

        // Fade out
        const alpha = 1 - (particle.life / particle.maxLife)
        
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          particles.splice(i, 1)
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
      {/* Background layers */}
      <div className="layer">
        <div className="floating-text ft-1">CHAOS</div>
        <div className="floating-text ft-2">CODE</div>
        <div className="floating-text ft-3">CREATE</div>
        <div className="floating-text ft-4">DESTROY</div>
      </div>
      
      <div className="grid-overlay"></div>
      <div className="noise"></div>
      
      {/* Canvas for particle effects */}
      <canvas id="canvas"></canvas>

      {/* Main content */}
      <div className="main-content">
        <div className="glitch-container">
          <h1 className="main-title" data-text="VIBE CODER">
            VIBE CODER
          </h1>
        </div>
        
        <p className="tagline">
          Where chaos meets code. We build digital experiences that break the rules, 
          push boundaries, and create the impossible. Welcome to the future of web development.
        </p>

        <div className="chaos-grid">
          <div className="chaos-card">
            <h3 className="card-title">Full Stack Development</h3>
            <p className="card-desc">
              From frontend chaos to backend stability, we craft complete digital ecosystems 
              that scale with your wildest ambitions.
            </p>
            <a href="#contact" className="card-btn">Get Started</a>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">UI/UX Design</h3>
            <p className="card-desc">
              Beautiful interfaces that don't just look good—they feel right. 
              We design experiences that users can't forget.
            </p>
            <a href="#contact" className="card-btn">Design Me</a>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">Digital Strategy</h3>
            <p className="card-desc">
              We don't just build websites, we architect digital revolutions. 
              Let's turn your vision into viral reality.
            </p>
            <a href="#contact" className="card-btn">Plan Attack</a>
          </div>

          <div className="chaos-card">
            <h3 className="card-title">Consulting</h3>
            <p className="card-desc">
              Need a digital sherpa? We guide you through the tech wilderness 
              with wisdom, wit, and a healthy dose of chaos.
            </p>
            <a href="#contact" className="card-btn">Guide Me</a>
          </div>
        </div>
      </div>

      {/* Rotating badges */}
      <div className="rotating-badges">
        <div className="badge">React</div>
        <div className="badge">Next.js</div>
        <div className="badge">TypeScript</div>
      </div>
    </>
  )
}
