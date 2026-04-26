import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import s from './Auth.module.css'
import { ShieldCheck, GraduationCap, Briefcase, ArrowRight } from 'lucide-react'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(form)
    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success('Welcome back!'); navigate('/') }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        
        {/* Left Pane: Visuals & Value Props */}
        <div className={s.leftPane} style={{ backgroundImage: `url('/signup-hero.png')` }}>
          <div className={s.leftContent}>
            <h2 className={s.leftTitle}>Welcome back to UniTask.</h2>
            <ul className={s.leftBullets}>
              <li><ShieldCheck size={18} /> Secure access to your projects</li>
              <li><GraduationCap size={18} /> Connect with academic talent</li>
              <li><Briefcase size={18} /> Manage your freelance growth</li>
            </ul>
          </div>
        </div>

        {/* Right Pane: Login Form */}
        <div className={s.rightPane}>
          <div className={s.brand}>Uni<span>Task</span></div>
          <h1 className={s.title}>Welcome back</h1>
          <p className={s.subtitle}>Sign in to your account</p>

          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => setForm(p => ({...p, email: e.target.value}))}
                required
              />
            </div>
            <div className={s.field}>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))}
                required
              />
            </div>

            <Link to="/forgot-password" className={s.forgotLink}>Forgot password?</Link>

            <button type="submit" className={s.btn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
            </button>
          </form>

          <p className={s.switchText}>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

