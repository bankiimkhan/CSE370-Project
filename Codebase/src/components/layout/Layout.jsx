import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarUrl } from '../../lib/avatar'
import {
  Briefcase, MessageCircle, Bell, Wallet, LogOut,
  Plus, Shield, Sun, Moon
} from 'lucide-react'
import styles from './Layout.module.css'

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (!profile) return
    fetchCounts()

    const notifSub = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, fetchCounts)
      .subscribe()

    return () => supabase.removeChannel(notifSub)
  }, [profile])

  async function fetchCounts() {
    const { count: n } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
    setUnreadNotifs(n || 0)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <NavLink to="/" className={styles.logo}>
            Uni<span>Task</span>
          </NavLink>
        </div>

        <div className={styles.navCenter}>
          <NavLink to="/" className={({isActive}) => `${styles.navLink} ${isActive ? styles.active : ''}`} end>
            <Briefcase size={18} /> Feed
          </NavLink>
          <NavLink to="/chat" className={({isActive}) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.iconWrap}>
              <MessageCircle size={18} />
              {unreadMessages > 0 && <span className={styles.badge}>{unreadMessages}</span>}
            </span>
            Messages
          </NavLink>
          <NavLink to="/notifications" className={({isActive}) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <span className={styles.iconWrap}>
              <Bell size={18} />
              {unreadNotifs > 0 && <span className={styles.badge}>{unreadNotifs}</span>}
            </span>
            Alerts
          </NavLink>
          <NavLink to="/wallet" className={({isActive}) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <Wallet size={18} /> Wallet
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({isActive}) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
              <Shield size={18} /> Admin
            </NavLink>
          )}
        </div>

        <div className={styles.navRight}>
          {(profile?.role === 'student' || profile?.role === 'admin' || profile?.role === 'client') && (
            <button className={styles.postBtn} onClick={() => navigate('/post-job')} title="Post a Job">
              <Plus size={16} /> <span>Post Job</span>
            </button>
          )}
          <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <NavLink to={`/profile/${profile?.id}`} className={styles.avatar}>
            <img src={getAvatarUrl(profile?.profile_picture)} alt={profile?.username || 'User'} />
          </NavLink>
          <button className={styles.logoutBtn} onClick={handleSignOut} title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>

      <div className={styles.mobileNav}>
        <div className={styles.mobileNavContent}>
          <NavLink to="/" className={({isActive}) => `${styles.mobLink} ${isActive ? styles.active : ''}`} end>
            <Briefcase size={20} />
            <span>Feed</span>
          </NavLink>
          <NavLink to="/chat" className={({isActive}) => `${styles.mobLink} ${isActive ? styles.active : ''}`}>
            <MessageCircle size={20} />
            {unreadMessages > 0 && <span className={styles.mobBadge}>{unreadMessages}</span>}
            <span>Chat</span>
          </NavLink>
          <NavLink to="/notifications" className={({isActive}) => `${styles.mobLink} ${isActive ? styles.active : ''}`}>
            <Bell size={20} />
            {unreadNotifs > 0 && <span className={styles.mobBadge}>{unreadNotifs}</span>}
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/wallet" className={({isActive}) => `${styles.mobLink} ${isActive ? styles.active : ''}`}>
            <Wallet size={20} />
            <span>Wallet</span>
          </NavLink>
          {profile?.role === 'admin' && (
            <NavLink to="/admin" className={({isActive}) => `${styles.mobLink} ${isActive ? styles.active : ''}`}>
              <Shield size={20} />
              <span>Admin</span>
            </NavLink>
          )}
        </div>
      </div>
    </div>
  )
}
