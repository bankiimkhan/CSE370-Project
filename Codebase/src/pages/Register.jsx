import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import s from './Auth.module.css'
import { ArrowRight, ShieldCheck, GraduationCap, Briefcase, ArrowLeft } from 'lucide-react'

const CATEGORIES = ['Web Development', 'Graphic Design', 'Content Writing', 'Video Editing',
  'Data Entry', 'Tutoring', 'Photography', 'App Development', 'UI/UX Design', 'Other']
const OTP_LENGTH = 8

export default function Register() {
  const { loginWithOtp, verifyOtp, updateProfile, user, fetchProfile } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form State
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    gender: '',
    category: '',
    workspace_name: ''
  })

  // ── Step 2 -> 3 (Send OTP) ───────────────────────────────────────
  async function handleSendOtp(e) {
    if (e) e.preventDefault()
    
    // Domain validation for students
    if (role === 'student') {
      const isValid = email.endsWith('.edu') || email.endsWith('.ac.bd') || email.includes('.edu.')
      if (!isValid) {
        toast.error('Students must use a .edu or .ac.bd email address')
        return
      }
    }

    setLoading(true)
    const { error } = await loginWithOtp(email)
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Verification code sent to your email!')
      setStep(3)
    }
  }

  // ── Step 3 -> 4 (Verify OTP) ─────────────────────────────────────
  async function handleVerifyOtp(e) {
    if (e) e.preventDefault()
    if (otp.length !== OTP_LENGTH) return toast.error(`Please enter the ${OTP_LENGTH}-digit code`)

    setLoading(true)
    const { error } = await verifyOtp(email, otp)
    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Email verified!')
      setStep(4)
    }
  }

  // ── Step 4 -> Complete (Finish Profile) ───────────────────────────
  async function handleFinishProfile(e) {
    if (e) e.preventDefault()
    if (!profileData.username || !profileData.full_name) {
      return toast.error('Full Name and Username are required')
    }

    setLoading(true)
    try {
      // 1. Update basic user info
      const updates = {
        full_name: profileData.full_name,
        username: profileData.username.toLowerCase().trim(),
        gender: profileData.gender,
        role: role,
        is_verified: true // implicit verification via OTP
      }
      
      const { error } = await updateProfile(user.id, updates)
      if (error) throw error

      // 2. Ensure role-specific profile row exists at signup time
      if (role === 'student') {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .upsert(
            {
              user_id: user.id,
              category: profileData.category || null
            },
            { onConflict: 'user_id' }
          )
        if (studentError) throw studentError
      } else if (role === 'client') {
        const { error: clientError } = await supabase
          .from('client_profiles')
          .upsert(
            {
              user_id: user.id,
              workspace_name: profileData.workspace_name || null
            },
            { onConflict: 'user_id' }
          )
        if (clientError) throw clientError
      }

      // 3. Ensure wallet exists (auto-trigger may be disabled/missing)
      const { error: walletError } = await supabase
        .from('wallets')
        .upsert(
          { user_id: user.id, balance: 0 },
          { onConflict: 'user_id' }
        )
      if (walletError) throw walletError

      // 4. Fetch profile to sync state
      await fetchProfile(user.id)

      toast.success('Welcome to UniTask!')
      navigate('/feed')
    } catch (err) {
      toast.error(err.message || 'Failed to save profile')
    }
    setLoading(false)
  }

  const stepTitles = [
    "Choose your role",
    "Enter your email",
    "Verify your email",
    "Complete your profile"
  ]

  const stepSubtitles = [
    "Are you here to work or to hire?",
    "We'll send you a verification code",
    `An ${OTP_LENGTH}-digit code was sent to ${email}`,
    "Tell us a bit more about yourself"
  ]

  return (
    <div className={s.page}>
      <div className={s.card}>
        
        {/* Left Pane: Visuals & Value Props */}
        <div className={s.leftPane} style={{ backgroundImage: `url('/signup-hero.png')` }}>
          <div className={s.leftContent}>
            <h2 className={s.leftTitle}>Success starts on UniTask.</h2>
            <ul className={s.leftBullets}>
              <li><ShieldCheck size={18} /> Verified student community</li>
              <li><GraduationCap size={18} /> Hire top academic talent</li>
              <li><Briefcase size={18} /> Secure payments & local support</li>
            </ul>
          </div>
        </div>

        {/* Right Pane: Form Wizard */}
        <div className={s.rightPane}>
          <div className={s.brand}>Uni<span>Task</span></div>
          
          {/* Progress Indicator */}
          <div className={s.stepIndicator}>
            {[1,2,3,4].map(i => (
              <div key={i} className={`${s.stepDot} ${step >= i ? s.stepActive : ''}`} />
            ))}
          </div>

          <h1 className={s.title}>{stepTitles[step-1]}</h1>
          <p className={s.subtitle}>{stepSubtitles[step-1]}</p>

          {/* ── Steps 1-4 (same logic as before) ── */}
          {step === 1 && (
            <div className={s.roleGrid}>
              <div className={`${s.roleCard} ${role === 'student' ? s.roleCardActive : ''}`}
                onClick={() => setRole('student')}>
                <span className={s.roleEmoji}><GraduationCap size={40} color="var(--accent)" /></span>
                <span className={s.roleLabel}>I'm a Student</span>
                <p className={s.roleDesc}>I want to find freelance work and build my portfolio.</p>
              </div>
              <div className={`${s.roleCard} ${role === 'client' ? s.roleCardActive : ''}`}
                onClick={() => setRole('client')}>
                <span className={s.roleEmoji}><Briefcase size={40} color="var(--green)" /></span>
                <span className={s.roleLabel}>I'm a Client</span>
                <p className={s.roleDesc}>I want to hire talented students for my projects.</p>
              </div>
              <button className={s.btn} style={{ gridColumn: 'span 2' }} onClick={() => setStep(2)}>
                Continue <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSendOtp} className={s.form}>
              <div className={s.field}>
                <label>Email Address</label>
                <input type="email" placeholder={role === 'student' ? 'you@university.ac.bd' : 'you@company.com'}
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              {role === 'student' && (
                <p className={s.hint}>🎓 Use your university email (.edu or .ac.bd)</p>
              )}
              <div className={s.inlineActions}>
                <button type="button" className={`${s.cancelBtn} ${s.iconOnlyBtn}`} onClick={() => setStep(1)}>
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" className={`${s.btn} ${s.growBtn}`} disabled={loading}>
                  {loading ? 'Sending...' : 'Continue'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleVerifyOtp} className={s.form}>
              <div className={s.field}>
                <label>{OTP_LENGTH}-Digit Code</label>
                <input className={s.otpInput} maxLength={OTP_LENGTH} placeholder={'0'.repeat(OTP_LENGTH)}
                  value={otp} onChange={e => setOtp(e.target.value)} required />
              </div>
              <p className={s.resendRow}>
                Didn't receive it? <button type="button" onClick={handleSendOtp} 
                  className={s.resendBtn}>Resend</button>
              </p>
              <div className={s.inlineActions}>
                <button type="button" className={`${s.cancelBtn} ${s.iconOnlyBtn}`} onClick={() => setStep(2)}>
                  <ArrowLeft size={18} />
                </button>
                <button type="submit" className={`${s.btn} ${s.growBtn}`} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'} <ShieldCheck size={18} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            !user ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p className={s.resendRow}>Establishing session...</p>
              </div>
            ) : (
              <form onSubmit={handleFinishProfile} className={s.form}>
                <div className={s.row}>
                  <div className={s.field}>
                    <label>Full Name</label>
                    <input placeholder="Jane Doe" value={profileData.full_name}
                      onChange={e => setProfileData(p => ({...p, full_name: e.target.value}))} required />
                  </div>
                  <div className={s.field}>
                    <label>Username</label>
                    <input placeholder="janedoe" value={profileData.username}
                      onChange={e => setProfileData(p => ({...p, username: e.target.value}))} required />
                  </div>
                </div>

                <div className={s.field}>
                  <label>Gender</label>
                  <select value={profileData.gender} onChange={e => setProfileData(p => ({...p, gender: e.target.value}))}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {role === 'student' ? (
                  <div className={s.field}>
                    <label>Primary Skill</label>
                    <select value={profileData.category} onChange={e => setProfileData(p => ({...p, category: e.target.value}))}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className={s.field}>
                    <label>Workspace Name</label>
                    <input placeholder="e.g. Acme Corp" value={profileData.workspace_name}
                      onChange={e => setProfileData(p => ({...p, workspace_name: e.target.value}))} />
                  </div>
                )}

                <button type="submit" className={s.btn} disabled={loading}>
                  {loading ? 'Finishing up...' : 'Join UniTask'} <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </button>
              </form>
            )
          )}

          {step < 3 && (
            <p className={s.switchText}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

