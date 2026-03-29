import { useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { useCircleStore } from '../../store/circleStore'
import { getMatrixClient } from '../../matrix/client'
import { sendTextMessage } from '../../matrix/messages'
import { ensureRoomMembership, isNotInRoomError } from '../../matrix/membership'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatView.module.css'

export function ChatView() {
  const { roomId } = useParams<{ roomId: string }>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { matrixUserId } = useAuthStore()
  const { messages, typingUsers, rooms, setActiveRoom, addMessage, replacePendingMessage, updateMessageStatus } = useChatStore()
  const { circles } = useCircleStore()

  const roomMessages = roomId ? messages.get(roomId) || [] : []
  const typing = roomId ? typingUsers.get(roomId) || [] : []
  const room = rooms.find((r) => r.id === roomId)

  useEffect(() => {
    if (roomId) setActiveRoom(roomId)
    return () => setActiveRoom(null)
  }, [roomId, setActiveRoom])

  // Proactively ensure room membership when entering chat
  useEffect(() => {
    if (!roomId) return
    const client = getMatrixClient()
    if (!client) return

    ensureRoomMembership(client, roomId, circles).catch((err) =>
      console.warn('Proactive room join check failed:', err)
    )
  }, [roomId, circles])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [roomMessages.length])

  const handleSend = useCallback(async (text: string) => {
    if (!roomId) return

    const pendingId = `pending-${Date.now()}`
    const message = {
      id: pendingId,
      roomId,
      senderId: matrixUserId || '',
      senderName: 'You',
      body: text,
      msgtype: 'm.text',
      timestamp: Date.now(),
      status: 'sending' as const,
    }
    addMessage(roomId, message)

    const client = getMatrixClient()
    if (!client) {
      updateMessageStatus(roomId, pendingId, 'error')
      return
    }

    try {
      const eventId = await sendTextMessage(client, roomId, text)
      replacePendingMessage(roomId, pendingId, eventId)
    } catch (err) {
      if (isNotInRoomError(err)) {
        console.warn('Not in room, attempting to join via backend...')
        const joined = await ensureRoomMembership(client, roomId, circles)
        if (joined) {
          try {
            const eventId = await sendTextMessage(client, roomId, text)
            replacePendingMessage(roomId, pendingId, eventId)
            return
          } catch (retryErr) {
            console.error('Failed to send message after rejoin:', retryErr)
          }
        }
      }
      console.error('Failed to send message:', err)
      updateMessageStatus(roomId, pendingId, 'error')
    }
  }, [roomId, matrixUserId, circles, addMessage, replacePendingMessage, updateMessageStatus])

  if (!roomId) return null

  return (
    <div className={styles.container}>
      {room && (
        <div className={styles.roomHeader}>
          <h3 className={styles.roomName}>{room.name}</h3>
        </div>
      )}
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
