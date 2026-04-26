import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getAvatarUrl } from '../lib/avatar'
import { completeJobAndReleasePayment } from '../lib/jobPayment'
import toast from 'react-hot-toast'
import { Send, AlertTriangle, MessageCircle, ArrowLeft, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import styles from './Chat.module.css'

export default function Chat() {
  const { chatId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [messages, setMessages] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [text, setText] = useState('')
  const [showDispute, setShowDispute] = useState(false)
  const [disputeDetails, setDisputeDetails] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { fetchRooms() }, [profile])
  useEffect(() => {
    if (chatId) loadRoom(chatId)
  }, [chatId, rooms])

  useEffect(() => {
    if (!currentRoom) return
    fetchMessages(currentRoom.id)
    const sub = supabase.channel(`chat-${currentRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${currentRoom.id}` },
        payload => setMessages(m => [...m, payload.new]))
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [currentRoom])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchRooms() {
    if (!profile) return
    const { data } = await supabase
      .from('chat_rooms')
      .select('*, job:job_posts(id, title, status, payment_amount), poster:users!chat_rooms_poster_id_fkey(id, username, full_name, profile_picture), worker:users!chat_rooms_worker_id_fkey(id, username, full_name, profile_picture)')
      .or(`poster_id.eq.${profile.id},worker_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
    setRooms(data || [])
    if (!chatId && data?.length > 0) loadRoom(data[0].id)
  }

  function loadRoom(id) {
    const room = rooms.find(r => r.id === id)
    if (room) setCurrentRoom(room)
    else if (id) {
      supabase.from('chat_rooms')
        .select('*, job:job_posts(id, title, status, payment_amount), poster:users!chat_rooms_poster_id_fkey(id, username, full_name, profile_picture), worker:users!chat_rooms_worker_id_fkey(id, username, full_name, profile_picture)')
        .eq('id', id).single()
        .then(({ data }) => { if (data) setCurrentRoom(data) })
    }
  }

  async function fetchMessages(id) {
    const { data } = await supabase.from('messages')
      .select('*, sender:users(id, username, full_name, profile_picture)')
      .eq('chat_id', id)
      .order('sent_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim() || !currentRoom) return
    await supabase.from('messages').insert({
      chat_id: currentRoom.id,
      sender_id: profile.id,
      content: text.trim()
    })
    setText('')
  }

  async function submitDispute() {
    if (!disputeDetails.trim()) { toast.error('Please provide dispute details'); return }
    const other = currentRoom.poster_id === profile.id ? currentRoom.worker_id : currentRoom.poster_id
    await supabase.from('disputes').insert({
      chat_id: currentRoom.id,
      raised_by: profile.id,
      against_user: other,
      details: disputeDetails
    })
    // Notify admins via a system notification — in real app query admin users
    setShowDispute(false)
    setDisputeDetails('')
    toast.success('Dispute raised and sent to admins')
  }

  async function handleMarkCompleted() {
    if (!currentRoom || !profile) return
    if (currentRoom.poster_id !== profile.id) {
      toast.error('Only the job poster can mark this as completed')
      return
    }
    if (currentRoom.job?.status === 'completed') {
      toast('This job is already completed')
      return
    }

    try {
      const { payoutAmount } = await completeJobAndReleasePayment({
        jobId: currentRoom.job_id,
        workerId: currentRoom.worker_id,
        amount: currentRoom.job?.payment_amount,
        jobTitle: currentRoom.job?.title
      })

      setCurrentRoom(r => r ? { ...r, job: { ...(r.job || {}), status: 'completed' } } : r)
      setRooms(prev => prev.map(r => r.id === currentRoom.id
        ? { ...r, job: { ...(r.job || {}), status: 'completed' } }
        : r
      ))
      toast.success(`Job marked as completed. ৳${payoutAmount} released to worker.`)
    } catch (err) {
      toast.error(err?.message || 'Failed to complete job and release payment')
    }
  }

  function getOtherUser(room) {
    return room.poster_id === profile?.id ? room.worker : room.poster
  }

  const isPoster = currentRoom?.poster_id === profile?.id
  const canMarkCompleted = isPoster && currentRoom?.job?.status !== 'completed'

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Messages</h2>
        {rooms.length === 0
          ? <p className={styles.empty}>No conversations yet</p>
          : rooms.map(room => {
            const other = getOtherUser(room)
            return (
              <button
                key={room.id}
                className={`${styles.roomBtn} ${currentRoom?.id === room.id ? styles.roomActive : ''}`}
                onClick={() => { setCurrentRoom(room); navigate(`/chat/${room.id}`) }}
              >
                <div className={styles.roomAvatar}>
                  <img src={getAvatarUrl(other?.profile_picture)} alt={other?.full_name || other?.username || 'User'} />
                </div>
                <div className={styles.roomInfo}>
                  <span className={styles.roomUser}>{other?.full_name || other?.username}</span>
                  <span className={styles.roomJob}>{room.job?.title}</span>
                </div>
              </button>
            )
          })
        }
      </div>

      {/* Chat area */}
      <div className={`${styles.chatArea} ${!chatId ? styles.hiddenMobile : ''}`}>
        {!currentRoom ? (
          <div className={styles.noChat}>
            <MessageCircle size={48} />
            <p>Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <button className={styles.backBtn} onClick={() => navigate('/chat')}>
                  <ArrowLeft size={20} />
                </button>
                <div className={styles.headerAvatar}>
                  <img
                    src={getAvatarUrl(getOtherUser(currentRoom)?.profile_picture)}
                    alt={getOtherUser(currentRoom)?.full_name || getOtherUser(currentRoom)?.username || 'User'}
                  />
                </div>
                <div>
                  <div className={styles.headerName}>{getOtherUser(currentRoom)?.full_name || getOtherUser(currentRoom)?.username}</div>
                  <div className={styles.headerJob}>{currentRoom.job?.title}</div>
                </div>
              </div>
              <div className={styles.headerActions}>
                {canMarkCompleted && (
                  <button className={styles.completeBtn} onClick={handleMarkCompleted}>
                    <CheckCircle size={14} /> {window.innerWidth > 600 && 'Mark Completed'}
                  </button>
                )}
                <button className={styles.disputeBtn} onClick={() => setShowDispute(true)}>
                  <AlertTriangle size={14} /> {window.innerWidth > 600 && 'Raise Dispute'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={styles.messages}>
              {messages.map(msg => (
                <div key={msg.id} className={`${styles.msgWrap} ${msg.sender_id === profile.id ? styles.mine : styles.theirs}`}>
                  <div className={styles.bubble}>{msg.content}</div>
                  <span className={styles.time}>{formatDistanceToNow(new Date(msg.sent_at), { addSuffix: true })}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form className={styles.inputRow} onSubmit={sendMessage}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message..."
                className={styles.msgInput}
              />
              <button type="submit" className={styles.sendBtn} disabled={!text.trim()}>
                <Send size={18} />
              </button>
            </form>

            {/* Dispute modal */}
            {showDispute && (
              <div className={styles.disputeModal}>
                <h3>Raise a Dispute</h3>
                <textarea
                  placeholder="Describe the issue in detail..."
                  value={disputeDetails}
                  onChange={e => setDisputeDetails(e.target.value)}
                  rows={4}
                />
                <div className={styles.disputeActions}>
                  <button className={styles.submitDisputeBtn} onClick={submitDispute}>Submit</button>
                  <button className={styles.cancelDisputeBtn} onClick={() => setShowDispute(false)}>Cancel</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
