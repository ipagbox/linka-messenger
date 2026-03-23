import styles from './TypingIndicator.module.css'

interface TypingIndicatorProps {
  users: string[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const text =
    users.length === 1
      ? `${users[0]} is typing...`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing...`
      : `${users.length} people are typing...`

  return (
    <div className={styles.indicator}>
      <span className={styles.dots}>
        <span />
        <span />
        <span />
      </span>
      <span className={styles.text}>{text}</span>
    </div>
  )
}
