import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const typeColors = { application: '#4361ee', hired: '#10b981', payment: '#f59e0b', dispute: '#ef4444', rating: '#8b5cf6', system: '#64748b' }
const typeEmoji = { application: '📋', hired: '🎉', payment: '💰', dispute: '⚖️', rating: '⭐', system: '🔔' }

export default function Notifications() {
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [tab, setTab] = useState('unread')

  useEffect(() => { fetchNotifs() }, [profile])

  async function fetchNotifs() {
    if (!profile) return
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setNotifs(data || [])
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true })
      .eq('user_id', profile.id).eq('is_read', false)
    fetchNotifs()
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(n => n.map(x => x.id === id ? {...x, is_read: true} : x))
  }

  const filtered = notifs.filter(n => tab === 'unread' ? !n.is_read : n.is_read)

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26 }}>Notifications</h1>
        <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface2)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {['unread', 'read'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: tab === t ? 'var(--surface)' : 'transparent',
            color: tab === t ? 'var(--text)' : 'var(--text3)',
            boxShadow: tab === t ? 'var(--shadow)' : 'none', transition: 'all 0.15s',
            textTransform: 'capitalize'
          }}>
            {t} {t === 'unread' && notifs.filter(n => !n.is_read).length > 0 &&
              <span style={{ background: 'var(--red)', color: 'white', borderRadius: 99, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>
                {notifs.filter(n => !n.is_read).length}
              </span>
            }
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Bell size={40} />
              <p>No {tab} notifications</p>
            </div>
          )
          : filtered.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{ display: 'flex', gap: 14, padding: 16, background: n.is_read ? 'var(--surface)' : 'var(--accent-light)', border: `1.5px solid ${n.is_read ? 'var(--border)' : 'rgba(67,97,238,0.2)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{typeEmoji[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{n.message}</p>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
              </div>
              {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))
        }
      </div>
    </div>
  )
}
