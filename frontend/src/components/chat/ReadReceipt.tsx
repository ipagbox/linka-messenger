import styles from './ReadReceipt.module.css'

interface ReadReceiptProps {
  readBy: string[]
  maxAvatars?: number
}

export function ReadReceipt({ readBy, maxAvatars = 3 }: ReadReceiptProps) {
  if (readBy.length === 0) return null

  const visible = readBy.slice(0, maxAvatars)
  const remaining = readBy.length - maxAvatars

  return (
    <div className={styles.receipt}>
      {visible.map((user, i) => (
        <div key={i} className={styles.avatar} title={user}>
          {user.slice(0, 1).toUpperCase()}
        </div>
      ))}
      {remaining > 0 && (
        <div className={styles.avatar}>+{remaining}</div>
      )}
    </div>
  )
}
