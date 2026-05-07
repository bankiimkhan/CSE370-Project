import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAvatarUrl } from '../lib/avatar'
import { completeJobAndReleasePayment } from '../lib/jobPayment'
import toast from 'react-hot-toast'
import { DollarSign, Tag, User, Clock, Flag, Users, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import styles from './JobDetail.module.css'

export default function JobDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [hasApplied, setHasApplied] = useState(false)
  const [showApplicants, setShowApplicants] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchJob() }, [id])

  async function fetchJob() {
    const { data } = await supabase
      .from('job_posts')
      .select('*, poster:users(id, username, full_name, profile_picture)')
      .eq('id', id)
      .single()
    setJob(data)

    if (data && profile) {
      const { data: app } = await supabase.from('applications')
        .select('id').eq('job_id', id).eq('applicant_id', profile.id).single()
      setHasApplied(!!app)
    }
    setLoading(false)
  }

  async function fetchApplicants() {
    const { data } = await supabase
      .from('applications')
      .select('*, applicant:users(id, username, full_name, profile_picture, student_profiles(category, avg_rating))')
      .eq('job_id', id)
    setApplicants(data || [])
    setShowApplicants(true)
  }

  async function handleApply() {
    if (!profile) { toast.error('Please sign in first'); return }
    if ((profile.role || '').toLowerCase() !== 'student') {
      toast.error('Only students can apply for jobs')
      return
    }
    if (hasApplied) {
      toast('You have already applied to this job')
      return
    }
    if (job.status !== 'open') {
      toast.error('This job is no longer open for applications')
      return
    }

    const { error } = await supabase.from('applications').insert({ job_id: id, applicant_id: profile.id })
    if (error) { toast.error(error.message); return }
    // Notify poster
    await supabase.from('notifications').insert({
      user_id: job.poster_id,
      type: 'application',
      message: `${profile.username} applied for your job: "${job.title}"`
    })
    setHasApplied(true)
    toast.success('Application submitted!')
  }

  async function handleSelect(applicantId, applicationId) {
    // Update application status
    await supabase.from('applications').update({ status: 'selected' }).eq('id', applicationId)
    // Reject others
    await supabase.from('applications').update({ status: 'rejected' })
      .eq('job_id', id).neq('id', applicationId)
    // Update job status
    await supabase.from('job_posts').update({ status: 'assigned' }).eq('id', id)
    // Create chat room
    const { data: chat } = await supabase.from('chat_rooms').insert({
      job_id: id, poster_id: profile.id, worker_id: applicantId
    }).select().single()
    // Notify worker
    await supabase.from('notifications').insert({
      user_id: applicantId,
      type: 'hired',
      message: `You were selected for the job: "${job.title}"!`
    })
    toast.success('Candidate selected! Chat room created.')
    navigate(`/chat/${chat.id}`)
  }

  async function handleReport() {
    if (!reportReason.trim()) { toast.error('Please provide a reason'); return }
    await supabase.from('reports').insert({ reporter_id: profile.id, job_id: id, reason: reportReason })
    setShowReport(false)
    setReportReason('')
    toast.success('Report submitted to admins')
  }

  async function handleComplete() {
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('worker_id')
      .eq('job_id', id)
      .single()

    if (roomError || !room?.worker_id) {
      toast.error('No hired worker found for this job')
      return
    }

    try {
      const { payoutAmount } = await completeJobAndReleasePayment({
        jobId: id,
        workerId: room.worker_id,
        amount: job.payment_amount,
        jobTitle: job.title
      })
      toast.success(`Job completed. ৳${payoutAmount} released to worker.`)
      navigate('/')
    } catch (err) {
      toast.error(err?.message || 'Failed to complete job and release payment')
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (!job) return <div className={styles.loading}>Job not found.</div>

  const isOwner = profile?.id === job.poster_id
  const isStudent = (profile?.role || '').toLowerCase() === 'student'
  const canApply = isStudent && !isOwner && job.status === 'open'

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.card}>
            <div className={styles.topRow}>
              <span className={styles.catTag}>{job.category}</span>
              <span className={`${styles.status} ${styles[job.status]}`}>{job.status}</span>
            </div>

            <h1 className={styles.title}>{job.title}</h1>

            <div className={styles.meta}>
              <span><DollarSign size={15} /> ৳{job.payment_amount}</span>
              <span><Clock size={15} /> {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>

            <p className={styles.desc}>{job.description}</p>

            <div className={styles.actions}>
              {canApply && (
                <button
                  className={`${styles.applyBtn} ${hasApplied ? styles.applied : ''}`}
                  onClick={handleApply}
                  disabled={hasApplied}
                >
                  {hasApplied ? <><CheckCircle size={16} /> Applied</> : 'Apply Now'}
                </button>
              )}

              {isOwner && job.status === 'open' && (
                <button className={styles.applicantsBtn} onClick={fetchApplicants}>
                  <Users size={16} /> View Applicants
                </button>
              )}

              {isOwner && job.status === 'assigned' && (
                <button className={styles.completeBtn} onClick={handleComplete}>
                  <CheckCircle size={16} /> Mark as Completed
                </button>
              )}

              {!isOwner && (
                <button className={styles.reportBtn} onClick={() => setShowReport(true)}>
                  <Flag size={15} /> Report
                </button>
              )}
            </div>
          </div>

          {/* Applicants panel */}
          {showApplicants && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Applicants ({applicants.length})</h2>
              {applicants.length === 0
                ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No applicants yet.</p>
                : applicants.map(app => (
                  <div key={app.id} className={styles.applicantRow}>
                    <div className={styles.appAvatar}>
                      <img src={getAvatarUrl(app.applicant?.profile_picture)} alt={app.applicant?.full_name || app.applicant?.username || 'User'} />
                    </div>
                    <div className={styles.appInfo}>
                      <Link to={`/profile/${app.applicant_id}`} className={styles.appName}>
                        {app.applicant?.full_name || app.applicant?.username}
                      </Link>
                      <span>{app.applicant?.student_profiles?.category}</span>
                    </div>
                    <div className={styles.appRating}>
                      ⭐ {app.applicant?.student_profiles?.avg_rating?.toFixed(1) || 'New'}
                    </div>
                    {app.status === 'pending' && (
                      <button
                        className={styles.selectBtn}
                        onClick={() => handleSelect(app.applicant_id, app.id)}
                      >
                        Select
                      </button>
                    )}
                    {app.status !== 'pending' && (
                      <span className={`${styles.appStatus} ${styles[app.status]}`}>{app.status}</span>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* Report modal */}
          {showReport && (
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Report this job</h2>
              <textarea
                className={styles.reportArea}
                placeholder="Describe the issue..."
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                rows={4}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className={styles.submitReportBtn} onClick={handleReport}>Submit Report</button>
                <button className={styles.cancelBtn} onClick={() => setShowReport(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: poster info */}
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Posted by</h3>
            <Link to={`/profile/${job.poster_id}`} className={styles.posterCard}>
              <div className={styles.posterAvatar}>
                <img src={getAvatarUrl(job.poster?.profile_picture)} alt={job.poster?.full_name || job.poster?.username || 'User'} />
              </div>
              <div>
                <div className={styles.posterName}>{job.poster?.full_name || job.poster?.username}</div>
                <div className={styles.posterUsername}>@{job.poster?.username}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
