import { useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { getMatrixClient } from '../../matrix/client'
import { isNotInRoomError, sendTextMessage } from '../../matrix/messages'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import styles from './ChatView.module.css'

export function ChatView() {
  const { roomId } = useParams<{ roomId: string }>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { matrixUserId } = useAuthStore()
  const { messages, typingUsers, rooms, setActiveRoom, addMessage, replacePendingMessage, updateMessageStatus } = useChatStore()

  const roomMessages = roomId ? messages.get(roomId) || [] : []
  const typing = roomId ? typingUsers.get(roomId) || [] : []
  const room = rooms.find((r) => r.id === roomId)

  useEffect(() => {
    if (roomId) setActiveRoom(roomId)
    return () => setActiveRoom(null)
  }, [roomId, setActiveRoom])

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
        try {
          await client.joinRoom(roomId)
          const retryEventId = await sendTextMessage(client, roomId, text)
          replacePendingMessage(roomId, pendingId, retryEventId)
          return
        } catch (retryErr) {
          console.error('Failed to re-join room and resend message:', retryErr)
        }
      } else {
        console.error('Failed to send message:', err)
      }

      updateMessageStatus(roomId, pendingId, 'error')
    }
  }, [roomId, matrixUserId, addMessage, replacePendingMessage, updateMessageStatus])

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
