'use client';

export default function SuccessPage() {
  return (
    <div className="upload-page">
      <div className="upload-container">
        <h1 className="upload-title" data-text="SUCCESS">SUCCESS</h1>

        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🚀</div>
          
          <h2 style={{ 
            fontSize: '2rem', 
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #00ff88, #00aaff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            Your Business Is Being Built!
          </h2>

          <p style={{ fontSize: '1.2rem', color: '#ccc', marginBottom: '2rem', lineHeight: 1.6 }}>
            We received your voice note and payment. Our AI is now generating your complete business package.
          </p>

          <div style={{
            background: 'rgba(0, 255, 136, 0.1)',
            border: '2px solid #00ff88',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <p style={{ fontSize: '1.1rem', color: '#00ff88', marginBottom: '1rem' }}>
              <strong>What Happens Next:</strong>
            </p>
            <ul style={{
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto',
              color: '#ccc',
              lineHeight: 2
            }}>
              <li>✓ AI analyzes your business idea</li>
              <li>✓ Live website & brand identity generated</li>
              <li>✓ Business analysis & publishing guide created</li>
              <li>✓ Complete package delivered to your email</li>
            </ul>
            <p style={{ fontSize: '1.2rem', color: '#00ff88', marginTop: '1.5rem', fontWeight: 700 }}>
              Everything ready in under 30 minutes.
            </p>
          </div>

          <p style={{ fontSize: '1rem', color: '#999' }}>
            Check your email for the download link. Most packages are ready in 10-20 minutes.
          </p>

          <a 
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '2rem',
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}