'use client';

import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';

export default function PricingPage() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <div style={{ paddingTop: '100px', minHeight: '100vh', background: '#000', color: '#fff', padding: '2rem' }}>
        <h1>BUSINESS IN A BOX</h1>
        <p>Turn Your Idea Into A Live Company In 48 Hours</p>
        <p>Record a 5-minute voice note. Get a complete turn-key business: Website. Branding. Business Plan. Marketing. Everything.</p>
        
        <div style={{ margin: '2rem 0' }}>
          <div style={{ fontSize: '2rem', color: '#ff0066' }}>$297</div>
          <div style={{ color: '#999' }}>Launch Special - Limited Time</div>
        </div>
        
        <button 
          onClick={() => router.push('/payment')}
          style={{ 
            background: 'linear-gradient(45deg, #ff0066, #00ffc8)', 
            color: '#000', 
            padding: '1rem 2rem', 
            border: 'none', 
            borderRadius: '25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Start Your Business Now →
        </button>
        
        <div style={{ marginTop: '2rem' }}>
          <h2>What You Get:</h2>
          <ul>
            <li>Complete Website</li>
            <li>Brand Identity</li>
            <li>Business Plan</li>
            <li>Marketing Strategy</li>
            <li>48-Hour Delivery</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => router.push('/')}
            style={{ 
              background: 'transparent', 
              color: '#fff', 
              padding: '0.5rem 1rem', 
              border: '1px solid #fff', 
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            ← Back to Agency Services
          </button>
        </div>
      </div>
    </>
  );
}