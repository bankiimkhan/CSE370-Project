import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './PostJob.module.css'

const CATEGORIES = ['Web Development','Graphic Design','Content Writing','Video Editing',
  'Data Entry','Tutoring','Photography','App Development','UI/UX Design','Other']

export default function PostJob() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', category: '', payment_amount: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (parseFloat(form.payment_amount) <= 0) { toast.error('Payment must be greater than 0'); return }

    // Check wallet balance
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', profile.id).single()
    if (!wallet || wallet.balance < parseFloat(form.payment_amount)) {
      toast.error('Insufficient wallet balance. Please top up first.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('job_posts').insert({
      poster_id: profile.id,
      title: form.title,
      description: form.description,
      category: form.category,
      payment_amount: parseFloat(form.payment_amount),
    })
    setLoading(false)
    if (error) toast.error(error.message)
    else { toast.success('Job posted! Payment escrowed.'); navigate('/') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Post a Job</h1>
        <p className={styles.subtitle}>Payment will be escrowed from your wallet immediately.</p>
      </div>

      <div className={`ui-card ${styles.card}`}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="ui-label">Job Title</label>
            <input className="ui-input" placeholder="e.g. Build a landing page"
              value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required />
          </div>
          <div className={styles.field}>
            <label className="ui-label">Description</label>
            <textarea className="ui-textarea" placeholder="Describe the job, expected timeline, and deliverables..."
              value={form.description}
              onChange={e => setForm(p => ({...p, description: e.target.value}))}
              required rows={5}
            />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className="ui-label">Category</label>
              <select className="ui-select" value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className="ui-label">Payment (৳)</label>
              <input className="ui-input" type="number" min="1" placeholder="500"
                value={form.payment_amount}
                onChange={e => setForm(p => ({...p, payment_amount: e.target.value}))} required />
            </div>
          </div>
          <div className="ui-note">
            ⚠️ ৳{form.payment_amount || '0'} will be deducted from your wallet as escrow when you post.
          </div>
          <div className={styles.actions}>
            <button type="button" className="ui-btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="ui-btn" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
