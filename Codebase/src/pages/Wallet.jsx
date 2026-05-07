// Wallet.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Wallet() {
  const { profile } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => { fetchWallet() }, [profile])

  async function fetchWallet() {
    if (!profile) return
    const { data: w } = await supabase.from('wallets').select('*').eq('user_id', profile.id).single()
    setWallet(w)
    const { data: t } = await supabase.from('transactions')
      .select('*').eq('wallet_id', w?.id).order('created_at', { ascending: false }).limit(20)
    setTransactions(t || [])
    setLoading(false)
  }

  async function handleTopUp() {
    const val = parseFloat(amount)
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return }
    await supabase.from('wallets').update({ balance: wallet.balance + val, updated_at: new Date() }).eq('id', wallet.id)
    await supabase.from('transactions').insert({ wallet_id: wallet.id, amount: val, type: 'topup' })
    await supabase.from('notifications').insert({ user_id: profile.id, type: 'payment', message: `৳${val} added to your wallet` })
    toast.success(`৳${val} added!`)
    setAmount('')
    fetchWallet()
  }

  const typeColors = { escrow: '#f59e0b', release: '#10b981', topup: '#4361ee', cashout: '#ef4444' }
  const typeIcons = { escrow: '🔒', release: '✅', topup: '⬆️', cashout: '⬇️' }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)' }}>Loading wallet...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', animation: 'fadeIn 0.3s ease', padding: isMobile ? '0 5px' : 0 }}>
      <h1 style={{ fontSize: isMobile ? 22 : 26, marginBottom: 24 }}>My Wallet</h1>

      {/* Balance card */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4361ee, #7c5cfc)', 
        borderRadius: 16, 
        padding: isMobile ? '24px 20px' : 32, 
        color: 'white', 
        marginBottom: 24, 
        boxShadow: '0 8px 32px rgba(67,97,238,0.3)' 
      }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 8 }}>Available Balance</div>
        <div style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, fontFamily: 'Space Grotesk' }}>৳{wallet?.balance?.toFixed(2) || '0.00'}</div>
      </div>

      {/* Top up */}
      <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: isMobile ? 16 : 24, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>Add Money</h3>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
          <input
            type="number" min="1" placeholder="Amount (৳)"
            value={amount} onChange={e => setAmount(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <button onClick={handleTopUp} style={{ padding: '12px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16} /> Top Up
          </button>
        </div>
        <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>Manual top-up via SSLCommerz coming soon.</p>
      </div>

      {/* Transactions */}
      <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, padding: isMobile ? 16 : 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>Transaction History</h3>
        {transactions.length === 0
          ? <p style={{ color: 'var(--text3)', fontSize: 14 }}>No transactions yet.</p>
          : transactions.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 20 }}>{typeIcons[t.type]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{t.type}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</div>
              </div>
              <span style={{ fontWeight: 700, color: typeColors[t.type], fontSize: 14 }}>
                {['escrow','cashout'].includes(t.type) ? '-' : '+'}৳{t.amount}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
