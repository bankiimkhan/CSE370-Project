import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Shield, Flag, AlertTriangle, Users } from 'lucide-react'

export default function AdminPanel() {
  const [tab, setTab] = useState('disputes')
  const [disputes, setDisputes] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchDisputes()
    fetchReports()
    fetchUsers()
  }, [])

  async function fetchDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select('*, raised:users!disputes_raised_by_fkey(username), against:users!disputes_against_user_fkey(username)')
      .order('created_at', { ascending: false })
    setDisputes(data || [])
  }

  async function fetchReports() {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:users(username), job:job_posts(title)')
      .order('created_at', { ascending: false })
    setReports(data || [])
  }

  async function fetchUsers() {
    const { data: usersData, error: uErr } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (uErr) { console.error('users error', uErr); return }

    const { data: walletsData, error: wErr } = await supabase
      .from('wallets')
      .select('*')
    if (wErr) console.error('wallets error', wErr)

    const merged = (usersData || []).map(u => ({
      ...u,
      wallet: (walletsData || []).find(w => w.user_id === u.id) ?? null
    }))
    setUsers(merged)
  }

  async function adjustBalance(userId, currentBalance) {
    const val = prompt(`Current balance: ৳${Number(currentBalance ?? 0).toFixed(2)}\nEnter new balance:`)
    if (val === null || val.trim() === '') return
    const newBal = parseFloat(val)
    if (isNaN(newBal) || newBal < 0) { toast.error('Invalid amount'); return }

    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBal, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) { toast.error('Update failed: ' + error.message); console.error(error); return }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'payment',
      message: `Your wallet balance was adjusted to ৳${newBal.toFixed(2)} by admin.`
    })

    toast.success(`Balance updated to ৳${newBal.toFixed(2)}`)
    fetchUsers()
  }

  async function resolveDispute(id) {
    await supabase.from('disputes').update({ status: 'resolved' }).eq('id', id)
    toast.success('Dispute resolved')
    fetchDisputes()
  }

  async function resolveReport(id) {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
    toast.success('Report resolved')
    fetchReports()
  }

  const tabs = [
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle, count: disputes.filter(d => d.status === 'open').length },
    { id: 'reports', label: 'Reports', icon: Flag, count: reports.filter(r => r.status === 'pending').length },
    { id: 'users', label: 'Users', icon: Users, count: users.length },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Shield size={isMobile ? 20 : 24} color="var(--accent)" />
        <h1 style={{ fontSize: isMobile ? 22 : 26 }}>Admin Panel</h1>
      </div>

      {/* Tab bar */}
      <div style={{ 
        display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface2)', 
        padding: 4, borderRadius: 12, width: isMobile ? '100%' : 'fit-content',
        overflowX: 'auto'
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '8px 12px' : '8px 18px',
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: tab === t.id ? 'var(--surface)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text3)',
            boxShadow: tab === t.id ? 'var(--shadow)' : 'none',
            flex: isMobile ? 1 : 'none',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}>
            <t.icon size={15} />
            {!isMobile && t.label}
            {t.count > 0 && (
              <span style={{ background: 'var(--red)', color: 'white', borderRadius: 99, padding: '1px 6px', fontSize: 11 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Disputes */}
      {tab === 'disputes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {disputes.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14 }}>No disputes.</p>}
          {disputes.map(d => (
            <div key={d.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                    <span style={{ color: 'var(--accent)' }}>@{d.raised?.username}</span>
                    <span style={{ color: 'var(--text3)', margin: '0 8px' }}>vs</span>
                    <span style={{ color: 'var(--red)' }}>@{d.against?.username}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{d.details}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                    background: d.status === 'open' ? 'var(--yellow-light)' : 'var(--green-light)',
                    color: d.status === 'open' ? 'var(--yellow)' : 'var(--green)'
                  }}>
                    {d.status}
                  </span>
                  {d.status === 'open' && (
                    <button onClick={() => resolveDispute(d.id)}
                      style={{ padding: '6px 14px', background: 'var(--green)', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 14 }}>No reports.</p>}
          {reports.map(r => (
            <div key={r.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: isMobile ? 16 : 20 }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                    Report on: <span style={{ color: 'var(--accent)' }}>{r.job?.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>by @{r.reporter?.username}</div>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>{r.reason}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, alignItems: 'center', justifyContent: 'space-between', width: isMobile ? '100%' : 'auto' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                    background: r.status === 'pending' ? 'var(--yellow-light)' : 'var(--green-light)',
                    color: r.status === 'pending' ? 'var(--yellow)' : 'var(--green)'
                  }}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <button onClick={() => resolveReport(r.id)}
                      style={{ padding: '6px 14px', background: 'var(--green)', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!isMobile ? (
            <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', fontSize: 13, color: 'var(--text2)' }}>
                    {['User', 'Role', 'Email', 'Balance', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--border)', fontSize: 14 }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>@{u.username}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                          background: u.role === 'admin' ? 'var(--red-light)' : u.role === 'student' ? 'var(--accent-light)' : 'var(--green-light)',
                          color: u.role === 'admin' ? 'var(--red)' : u.role === 'student' ? 'var(--accent)' : 'var(--green)'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        ৳{Number(u.wallet?.balance ?? 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => adjustBalance(u.id, u.wallet?.balance)}
                          style={{ padding: '5px 12px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid rgba(67,97,238,0.2)' }}>
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>@{u.username}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', alignSelf: 'flex-start',
                    background: u.role === 'admin' ? 'var(--red-light)' : u.role === 'student' ? 'var(--accent-light)' : 'var(--green-light)',
                    color: u.role === 'admin' ? 'var(--red)' : u.role === 'student' ? 'var(--accent)' : 'var(--green)'
                  }}>
                    {u.role}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 14 }}>
                    <span style={{ color: 'var(--text3)', marginRight: 4 }}>Balance:</span>
                    <span style={{ fontWeight: 700 }}>৳{Number(u.wallet?.balance ?? 0).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => adjustBalance(u.id, u.wallet?.balance)}
                    style={{ padding: '6px 14px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                    Adjust
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}