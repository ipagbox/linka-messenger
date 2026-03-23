import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatView.module.css'

export function ChatView() {
  const { roomId } = useParams<{ roomId: string }>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { matrixUserId } = useAuthStore()
  const { messages, typingUsers, setActiveRoom, addMessage } = useChatStore()

  const roomMessages = roomId ? messages.get(roomId) || [] : []
  const typing = roomId ? typingUsers.get(roomId) || [] : []

  useEffect(() => {
    if (roomId) setActiveRoom(roomId)
    return () => setActiveRoom(null)
  }, [roomId, setActiveRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages.length])

  const handleSend = (text: string) => {
    if (!roomId) return
    const message = {
      id: `pending-${Date.now()}`,
      roomId,
      senderId: matrixUserId || '',
      senderName: 'You',
      body: text,
      msgtype: 'm.text',
      timestamp: Date.now(),
      status: 'sending' as const,
    }
    addMessage(roomId, message)
    // Actual sending happens via matrix client in a hook
  }

  if (!roomId) return null

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {roomMessages.length === 0 && (
          <div className={styles.empty}>
            <p>No messages yet. Say hello!</p>
          </div>
        )}
        {roomMessages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === matrixUserId}
            showSender={i === 0 || roomMessages[i - 1]?.senderId !== msg.senderId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <TypingIndicator users={typing} />
      <MessageInput onSend={handleSend} />
    </div>
  )
}
