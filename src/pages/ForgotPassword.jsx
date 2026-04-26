import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import s from './Auth.module.css'
import { ShieldCheck, GraduationCap, Briefcase, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) toast.error(error.message)
    else setSent(true)
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        
        {/* Left Pane: Visuals & Value Props */}
        <div className={s.leftPane} style={{ backgroundImage: `url('/signup-hero.png')` }}>
          <div className={s.leftContent}>
            <h2 className={s.leftTitle}>Secure your UniTask account.</h2>
            <ul className={s.leftBullets}>
              <li><ShieldCheck size={18} /> Enhanced account protection</li>
              <li><GraduationCap size={18} /> Back to your career journey</li>
              <li><Briefcase size={18} /> Continuity for your business</li>
            </ul>
          </div>
        </div>

        {/* Right Pane: Reset Form */}
        <div className={s.rightPane}>
          <div className={s.brand}>Uni<span>Task</span></div>
          <h1 className={s.title}>Reset password</h1>
          <p className={s.subtitle}>We'll send you a reset link</p>

          {sent ? (
            <div className={s.statusCard}>
              <div className={s.statusIcon}>
                <CheckCircle2 size={26} />
              </div>
              <p className={s.statusText}>
                Check your email for the password reset link. It should arrive in a few moments.
              </p>
              <Link to="/login" className={`${s.btn} ${s.backLinkBtn}`}>
                <ArrowLeft size={18} style={{ marginRight: 8 }} /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={s.form}>
              <div className={s.field}>
                <label>Email Address</label>
                <input type="email" placeholder="you@university.edu" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className={s.btn} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'} <Mail size={18} style={{ marginLeft: 8 }} />
              </button>
              <p className={s.switchText}>
                <Link to="/login" className={s.inlineBackLink}>
                  <ArrowLeft size={16} style={{ marginRight: 4 }} /> Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

