import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div style={{ fontSize: 80 }}>🔍</div>
      <h1 style={{ fontSize: 32, fontFamily: 'Space Grotesk', fontWeight: 700 }}>Page not found</h1>
      <p style={{ color: '#8b94b8', fontSize: 15 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ padding: '10px 24px', background: '#4361ee', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 15, marginTop: 8 }}>Go Home</Link>
    </div>
  )
}
