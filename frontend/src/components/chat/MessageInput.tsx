import { useState, useRef } from 'react'
import { Button } from '../ui/Button'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  onSend: (text: string) => void
  onTyping?: (isTyping: boolean) => void
  onFileSelect?: (file: File) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  onTyping,
  onFileSelect,
  disabled,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [text, setText] = useState('')
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
    if (onTyping) onTyping(false)
    if (typingTimer.current) clearTimeout(typingTimer.current)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    if (onTyping) {
      onTyping(true)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => onTyping(false), 3000)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
      e.target.value = ''
    }
  }

  return (
    <div className={styles.wrapper}>
      {onFileSelect && (
        <>
          <button
            className={styles.attachBtn}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            type="button"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileChange}
            accept="*/*"
          />
        </>
      )}
      <textarea
        className={styles.textarea}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
      >
        Send
      </Button>
    </div>
  )
}
