import { useNavigate } from 'react-router-dom'
import type { ChatRoom } from '../../types'
import { Badge } from '../ui/Badge'
import styles from './ChatList.module.css'

interface ChatListProps {
  rooms: ChatRoom[]
  activeRoomId?: string | null
}

export function ChatList({ rooms, activeRoomId }: ChatListProps) {
  const navigate = useNavigate()

  const pinnedRooms = rooms.filter((r) => r.isPinned || r.isGeneral || r.isAnnouncements)
  const otherRooms = rooms
    .filter((r) => !r.isPinned && !r.isGeneral && !r.isAnnouncements)
    .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))

  const sortedRooms = [...pinnedRooms, ...otherRooms]

  if (sortedRooms.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No chats yet</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {sortedRooms.map((room) => (
        <button
          key={room.id}
          className={`${styles.item} ${activeRoomId === room.id ? styles.active : ''}`}
          onClick={() => navigate(`/chat/${room.id}`)}
        >
          <div className={styles.icon}>
            {room.isGeneral ? '#' : room.isAnnouncements ? '📢' : room.isDM ? '👤' : '#'}
          </div>
          <div className={styles.info}>
            <div className={styles.header}>
              <span className={styles.name}>{room.name}</span>
              {room.lastMessageTime && (
                <span className={styles.time}>{formatTime(room.lastMessageTime)}</span>
              )}
            </div>
            {room.lastMessage && (
              <span className={styles.preview}>{room.lastMessage}</span>
            )}
          </div>
          {room.unreadCount > 0 && <Badge count={room.unreadCount} />}
        </button>
      ))}
    </div>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
