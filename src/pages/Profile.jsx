import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAvatarUrl } from '../lib/avatar'
import toast from 'react-hot-toast'
import {
  Star, Edit2, MessageCircle, Camera, X,
  User, Calendar, Building2, BadgeCheck,
  Facebook, Instagram, Twitter, Globe, Link2, MessageSquare
} from 'lucide-react'
import s from './Profile.module.css'

// ── Social platform config ─────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { key: 'facebook_link',  label: 'Facebook',      Icon: Facebook,      color: '#1877f2', baseUrl: 'https://facebook.com/',  placeholder: 'username' },
  { key: 'instagram_link', label: 'Instagram',     Icon: Instagram,     color: '#e1306c', baseUrl: 'https://instagram.com/', placeholder: 'username' },
  { key: 'x_link',         label: 'X (Twitter)',   Icon: Twitter,       color: '#1da1f2', baseUrl: 'https://x.com/',         placeholder: 'username' },
  { key: 'behance_link',   label: 'Behance',       Icon: Globe,         color: '#1769ff', baseUrl: 'https://behance.net/',   placeholder: 'username' },
  { key: 'discord_link',   label: 'Discord',       Icon: MessageSquare, color: '#5865f2', baseUrl: null,                    placeholder: 'username or #tag' },
  { key: 'custom_link_1',  label: 'Custom Link 1', Icon: Link2,         color: null,      baseUrl: null,                    placeholder: 'https://...' },
  { key: 'custom_link_2',  label: 'Custom Link 2', Icon: Link2,         color: null,      baseUrl: null,                    placeholder: 'https://...' },
  { key: 'custom_link_3',  label: 'Custom Link 3', Icon: Link2,         color: null,      baseUrl: null,                    placeholder: 'https://...' },
]

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: myProfile, fetchProfile } = useAuth()

  const [user, setUser]             = useState(null)
  const [extra, setExtra]           = useState(null)   // student_profiles or client_profiles
  const [socialLinks, setSocialLinks] = useState(null) // social_links row
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [form, setForm]             = useState({})
  const [savedForm, setSavedForm]   = useState({})
  const fileRef = useRef()
  const bannerFileRef = useRef()

  const isOwn = myProfile?.id === id

  useEffect(() => { loadProfile() }, [id])

  // ── Data loading ─────────────────────────────────────────────────
  async function loadProfile() {
    const { data: u } = await supabase.from('users').select('*').eq('id', id).single()
    setUser(u)
    if (!u) return

    // Social links — available for all roles
    const { data: links } = await supabase
      .from('social_links').select('*').eq('user_id', id).single()
    setSocialLinks(links)

    // Base form fields shared by all roles
    const base = {
      username:        u.username        || '',
      full_name:       u.full_name       || '',
      gender:          u.gender          || '',
      profile_picture: u.profile_picture || '',
      banner_picture:  u.banner_picture  || '',
      bio:             u.bio             || '',
      facebook_link:   links?.facebook_link  || '',
      instagram_link:  links?.instagram_link || '',
      x_link:          links?.x_link         || '',
      behance_link:    links?.behance_link   || '',
      discord_link:    links?.discord_link   || '',
      custom_link_1:   links?.custom_link_1  || '',
      custom_link_2:   links?.custom_link_2  || '',
      custom_link_3:   links?.custom_link_3  || '',
    }

    if (u.role === 'student') {
      const { data } = await supabase.from('student_profiles').select('*').eq('user_id', id).single()
      setExtra(data)
      const f = { ...base, category: data?.category || '', skills: data?.skills || '' }
      setForm(f); setSavedForm(f)
    } else if (u.role === 'client') {
      const { data } = await supabase.from('client_profiles').select('*').eq('user_id', id).single()
      setExtra(data)
      const f = { ...base, workspace_name: data?.workspace_name || '' }
      setForm(f); setSavedForm(f)
    } else {
      // admin or other roles
      setForm(base); setSavedForm(base)
    }
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function saveProfile() {
    setSaving(true)
    try {
      const normalizedUsername = (form.username || '').trim().toLowerCase()
      if (!normalizedUsername) {
        toast.error('Username is required')
        setSaving(false)
        return
      }

      // 1. Update users table
      const { error: userErr } = await supabase
        .from('users')
        .update({
          username:        normalizedUsername,
          full_name:       form.full_name       || null,
          gender:          form.gender          || null,
          profile_picture: form.profile_picture || null,
          bio:             form.bio             || null,
        })
        .eq('id', id)
      if (userErr) throw userErr

      // 2. Upsert social_links
      const { error: slErr } = await supabase
        .from('social_links')
        .upsert({
          user_id:        id,
          facebook_link:  form.facebook_link  || null,
          instagram_link: form.instagram_link || null,
          x_link:         form.x_link         || null,
          behance_link:   form.behance_link   || null,
          discord_link:   form.discord_link   || null,
          custom_link_1:  form.custom_link_1  || null,
          custom_link_2:  form.custom_link_2  || null,
          custom_link_3:  form.custom_link_3  || null,
          updated_at:     new Date().toISOString(),
        }, { onConflict: 'user_id' })
      if (slErr) throw slErr

      // 3. Role-specific tables
      if (user.role === 'student') {
        const { error } = await supabase
          .from('student_profiles')
          .upsert(
            { user_id: id, category: form.category || null, skills: form.skills || null },
            { onConflict: 'user_id' }
          )
        if (error) throw error
      } else if (user.role === 'client') {
        const { error } = await supabase
          .from('client_profiles')
          .upsert(
            { user_id: id, workspace_name: form.workspace_name || null },
            { onConflict: 'user_id' }
          )
        if (error) throw error
      }

      toast.success('Profile updated!')
      setEditing(false)
      loadProfile()
      if (isOwn) fetchProfile(id)
    } catch (err) {
      const raw = `${err?.message || ''} ${err?.details || ''}`.toLowerCase()
      const isDuplicateUsername =
        err?.code === '23505' ||
        raw.includes('users_username_key') ||
        (raw.includes('duplicate key') && raw.includes('username'))

      if (isDuplicateUsername) {
        toast.error('Username already exists. Please choose a different one.')
      } else {
        toast.error(err?.message || 'Failed to save profile')
      }
    }
    setSaving(false)
  }

  // ── Avatar upload ─────────────────────────────────────────────────
  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const ext  = file.name.split('.').pop()
    const path = `${id}.${ext}`
    const toastId = toast.loading('Uploading photo...')

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ profile_picture: publicUrl }).eq('id', id)

      toast.success('Photo updated!', { id: toastId })
      loadProfile()
      if (isOwn) fetchProfile(id)
    } catch (err) {
      toast.error(err?.message || 'Upload failed. Check Storage policies.', { id: toastId })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleBannerUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const ext  = file.name.split('.').pop()
    const path = `banner_${id}.${ext}`
    const toastId = toast.loading('Uploading banner...')

    try {
      const { error: uploadError } = await supabase.storage
        .from('banners').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path)
      const { error: dbError } = await supabase.from('users').update({ banner_picture: publicUrl }).eq('id', id)
      if (dbError) throw dbError

      toast.success('Banner updated!', { id: toastId })
      await loadProfile()
      if (isOwn) await fetchProfile(id)
    } catch (err) {
      toast.error(err?.message || 'Upload failed. Check Storage policies.', { id: toastId })
    }
    if (bannerFileRef.current) bannerFileRef.current.value = ''
  }

  // ── Derived ───────────────────────────────────────────────────────
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(extra?.avg_rating || 0))

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  const skillList = extra?.skills
    ? extra.skills.split(',').map(sk => sk.trim()).filter(Boolean)
    : []

  const activeSocialLinks = SOCIAL_PLATFORMS.filter(p => socialLinks?.[p.key])

  function safeHostname(url) {
    try { return new URL(url).hostname } catch { return url }
  }

  // Build the full URL for a social platform value
  function getSocialUrl(platform, value) {
    if (!value) return null
    const clean = value.replace(/^@/, '') // strip leading @
    if (platform.baseUrl) return platform.baseUrl + clean
    return clean // custom links and Discord are stored as-is
  }

  // Display label shown under the platform name
  function getSocialDisplay(platform, value) {
    if (!value) return ''
    const clean = value.replace(/^@/, '')
    if (platform.baseUrl) return '@' + clean
    try { return new URL(clean).hostname } catch { return clean }
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (!user) {
    return <div className={s.loading}><span>Loading profile…</span></div>
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={s.page}>

      {/* Banner */}
      <div className={s.banner}>
        {user.banner_picture && (
          <img
            key={user.banner_picture} // force refresh if URL is same
            src={user.banner_picture}
            alt=""
            className={s.bannerImg}
            onError={() => toast.error('Banner failed to load. Check bucket permissions.')}
          />
        )}
        {isOwn && (
          <>
            <input type="file" accept="image/*" ref={bannerFileRef}
              className={s.avatarInput} onChange={handleBannerUpload} />
            <button className={s.bannerEditBtn}
              onClick={() => bannerFileRef.current?.click()} title="Change banner">
              <Camera size={16} />
            </button>
          </>
        )}
      </div>

      {/* Header Card */}
      <div className={s.headerCard}>
        <div className={s.avatarRow}>
          <div className={s.avatarWrap}>
            <div className={s.avatar}>
              <img src={getAvatarUrl(user.profile_picture)} alt={user.full_name || user.username || 'User'} />
            </div>
            {isOwn && (
              <>
                <input type="file" accept="image/*" ref={fileRef}
                  className={s.avatarInput} onChange={handleAvatarUpload} />
                <button className={s.avatarEditBtn}
                  onClick={() => fileRef.current?.click()} title="Change photo">
                  <Camera size={13} />
                </button>
              </>
            )}
          </div>

          <div className={s.headerActions}>
            {isOwn ? (
              <button className={s.editBtn} onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Edit Profile
              </button>
            ) : (
              <button className={s.msgBtn} onClick={() => navigate('/chat')}>
                <MessageCircle size={14} /> Message
              </button>
            )}
          </div>
        </div>

        <div className={s.nameRow}>
          <span className={s.name}>{user.full_name || user.username}</span>
          {user.is_verified && <BadgeCheck size={18} className={s.verifiedIcon} />}
        </div>
        <p className={s.handle}>@{user.username}</p>
        <div className={s.badges}>
          <span className={`${s.badge} ${user.role === 'student' ? s.badgeStudent : user.role === 'client' ? s.badgeClient : s.badgeAdmin}`}>
            {user.role}
          </span>
          {extra?.category && (
            <span className={`${s.badge} ${s.badgeCategory}`}>{extra.category}</span>
          )}
        </div>
      </div>

      {/* Body Grid */}
      <div className={s.body}>

        {/* Column 1: About */}
        <div className={`${s.main} ${s.stagger1}`}>
          <div className={s.card}>
            <h3 className={s.cardTitle}>About</h3>
            {user.bio
              ? <p className={s.bioText}>{user.bio}</p>
              : <div className={s.emptyState}>
                  <User size={24} className={s.emptyIcon} />
                  <p>{isOwn ? 'Click "Edit Profile" to add a bio.' : 'No bio yet.'}</p>
                </div>
            }
          </div>

          {/* Skills — student only */}
          {user.role === 'student' && skillList.length > 0 && (
            <div className={s.card}>
              <h3 className={s.cardTitle}>Skills</h3>
              <div className={s.skillsWrap}>
                {skillList.map((skill, i) => (
                  <span key={i} className={s.skill}>{skill}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Stats */}
        <div className={`${s.statsColumn} ${s.stagger2}`}>
          <div className={s.card}>
            <h3 className={s.cardTitle}>Performance</h3>
            <div className={s.statsList}>
              {user.role === 'student' && extra && (
                <>
                  <div className={s.statItem}>
                    <span className={s.statVal}>{extra.total_jobs_done ?? 0}</span>
                    <span className={s.statLabel}>Jobs Done</span>
                  </div>
                  <div className={s.statItem}>
                    <div className={s.statStars}>
                      {stars.map((filled, i) => (
                        <Star key={i} size={14}
                          fill={filled ? '#f59e0b' : 'none'}
                          color={filled ? '#f59e0b' : '#d1d5db'} />
                      ))}
                    </div>
                    <span className={s.statLabel}>
                      {extra.avg_rating ? `${extra.avg_rating.toFixed(1)} Rating` : 'No rating'}
                    </span>
                  </div>
                </>
              )}
              {user.role === 'client' && extra && (
                <div className={s.statItem}>
                  <div className={s.statStars}>
                    {stars.map((filled, i) => (
                      <Star key={i} size={14}
                        fill={filled ? '#f59e0b' : 'none'}
                        color={filled ? '#f59e0b' : '#d1d5db'} />
                    ))}
                  </div>
                  <span className={s.statLabel}>
                    {extra.avg_rating ? `${extra.avg_rating.toFixed(1)} Rating` : 'No rating'}
                  </span>
                </div>
              )}
              <div className={s.statItem}>
                <span className={s.statVal}>{memberSince}</span>
                <span className={s.statLabel}>Member Since</span>
              </div>
            </div>
          </div>

          {/* Social Links inside Column 2 */}
          {activeSocialLinks.length > 0 && (
            <div className={s.card}>
              <h3 className={s.cardTitle}>Presence</h3>
              <div className={s.socialGrid}>
                {activeSocialLinks.map(({ key, label, Icon, color, baseUrl }) => {
                  const platform = SOCIAL_PLATFORMS.find(p => p.key === key)
                  const href = getSocialUrl(platform, socialLinks[key])
                  const display = getSocialDisplay(platform, socialLinks[key])
                  const Tag = href && (baseUrl || href.startsWith('http')) ? 'a' : 'div'
                  return (
                    <Tag
                      key={key}
                      {...(Tag === 'a' ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className={s.socialCard}
                    >
                      <div className={s.socialIcon} style={{ background: color ? `${color}15` : 'var(--surface2)' }}>
                        <Icon size={16} style={{ color: color || 'var(--text2)' }} />
                      </div>
                      <div className={s.socialInfo}>
                        <span className={s.socialLabel}>{label}</span>
                        <span className={s.socialUrl}>{display}</span>
                      </div>
                    </Tag>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Details */}
        <div className={`${s.sidebar} ${s.stagger3}`}>
          <div className={s.card}>
            <h3 className={s.cardTitle}>Identity</h3>
            <div className={s.detailsList}>
              {user.gender && (
                <div className={s.detail}>
                  <User size={14} />
                  <span style={{ textTransform: 'capitalize' }}>{user.gender}</span>
                </div>
              )}

              {user.role === 'client' && extra?.workspace_name && (
                <div className={s.detail}>
                  <Building2 size={14} />
                  <span>{extra.workspace_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className={s.overlay}
          onClick={e => { if (e.target === e.currentTarget) { setForm(savedForm); setEditing(false) } }}>
          <div className={s.modal}>

            <div className={s.modalHeader}>
              <span className={s.modalTitle}>Edit Profile</span>
              <button className={s.closeBtn}
                onClick={() => { setForm(savedForm); setEditing(false) }}>
                <X size={16} />
              </button>
            </div>

            <div className={s.modalBody}>

              {/* ── Basic Info ── */}
              <p className={s.sectionLabel}>Basic Info</p>

              <div className={s.formGroup}>
                <label className={s.label}>Username</label>
                <input className={s.input} placeholder="your_username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>Full Name</label>
                <input className={s.input} placeholder="Your full name"
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>Gender</label>
                <select className={s.input} value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>Bio</label>
                <textarea className={s.textarea}
                  placeholder="Tell people about yourself..."
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
              </div>

              {/* ── Role-specific ── */}
              {user.role === 'student' && (
                <>
                  <p className={s.sectionLabel}>Student Profile</p>
                  <div className={s.formGroup}>
                    <label className={s.label}>Category</label>
                    <input className={s.input}
                      placeholder="e.g. Graphic Design, Web Development"
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                  </div>
                  <div className={s.formGroup}>
                    <label className={s.label}>Skills (comma-separated)</label>
                    <input className={s.input}
                      placeholder="e.g. React, Figma, Python, UI/UX"
                      value={form.skills}
                      onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
                  </div>
                </>
              )}

              {user.role === 'client' && (
                <>
                  <p className={s.sectionLabel}>Client Profile</p>
                  <div className={s.formGroup}>
                    <label className={s.label}>Workspace Name</label>
                    <input className={s.input}
                      placeholder="Company or workspace name"
                      value={form.workspace_name}
                      onChange={e => setForm(p => ({ ...p, workspace_name: e.target.value }))} />
                  </div>
                </>
              )}

              {/* ── Social Links ── */}
              <p className={s.sectionLabel}>Social Links</p>

              {SOCIAL_PLATFORMS.map(({ key, label, Icon, color, placeholder }) => (
                <div className={s.formGroup} key={key}>
                  <label className={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={12} style={{ color: color || 'var(--text3)' }} /> {label}
                  </label>
                  <input className={s.input} placeholder={placeholder}
                    value={form[key] || ''}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className={s.modalFooter}>
              <button className={s.saveBtn} onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className={s.cancelBtn}
                onClick={() => { setForm(savedForm); setEditing(false) }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
