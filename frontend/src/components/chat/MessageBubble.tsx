import type { Message } from '../../types'
import { Avatar } from '../ui/Avatar'
import { FileAttachment } from '../media/FileAttachment'
import { ImagePreview } from '../media/ImagePreview'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSender?: boolean
  onRetry?: (message: Message) => void
}

export function MessageBubble({ message, isOwn, showSender = true, onRetry }: MessageBubbleProps) {
  const isImage = message.msgtype === 'm.image'
  const isFile = message.msgtype === 'm.file'

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && showSender && (
        <div className={styles.avatar}>
          <Avatar name={message.senderName} size="sm" />
        </div>
      )}
      <div className={styles.bubble}>
        {!isOwn && showSender && (
          <span className={styles.senderName}>{message.senderName}</span>
        )}

        {isImage && message.content?.url ? (
          <ImagePreview url={message.content.url} alt={message.body} />
        ) : isFile && message.content?.url ? (
          <FileAttachment
            url={message.content.url}
            filename={message.body}
            size={message.content.info?.size}
            mimetype={message.content.info?.mimetype}
          />
        ) : (
          <p className={styles.body}>{message.body}</p>
        )}

        <div className={styles.meta}>
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
          {isOwn && (
            <span className={`${styles.status} ${styles[message.status]}`}>
              {message.status === 'sending' ? '⏳' : message.status === 'error' ? '⚠️' : '✓'}
            </span>
          )}
          {message.status === 'error' && onRetry && (
            <button className={styles.retryBtn} onClick={() => onRetry(message)}>Retry</button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
