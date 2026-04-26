import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAvatarUrl } from '../lib/avatar'
import { Search, Filter, Briefcase, Clock, DollarSign, Star, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import styles from './Feed.module.css'

const CATEGORIES = ['All', 'Web Development', 'Graphic Design', 'Content Writing', 'Video Editing',
  'Data Entry', 'Tutoring', 'Photography', 'App Development', 'UI/UX Design', 'Other']

export default function Feed() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => { fetchJobs() }, [search, category])

  async function fetchJobs() {
    setLoading(true)
    let q = supabase
      .from('job_posts')
      .select('*, poster:users(id, username, full_name, profile_picture, role)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (search) q = q.ilike('title', `%${search}%`)
    if (category !== 'All') q = q.eq('category', category)

    const { data } = await q
    setJobs(data || [])
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Job Feed</h1>
          <p>Find your next freelance opportunity</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.categories}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`${styles.catBtn} ${category === c ? styles.catActive : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className={styles.loadGrid}>
          {[...Array(6)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.empty}>
          <Briefcase size={48} />
          <p>No jobs found. Try a different search.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {jobs.map(job => (
            <Link key={job.id} to={`/job/${job.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.categoryTag}>{job.category}</span>
                <span className={styles.amount}><DollarSign size={13} />{job.payment_amount}</span>
              </div>
              <h3 className={styles.jobTitle}>{job.title}</h3>
              <p className={styles.jobDesc}>{job.description?.slice(0, 120)}...</p>
              <div className={styles.cardFooter}>
                <div className={styles.poster}>
                  <div className={styles.posterAvatar}>
                    <img src={getAvatarUrl(job.poster?.profile_picture)} alt={job.poster?.full_name || job.poster?.username || 'User'} />
                  </div>
                  <span>{job.poster?.full_name || job.poster?.username}</span>
                </div>
                <span className={styles.time}>
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
