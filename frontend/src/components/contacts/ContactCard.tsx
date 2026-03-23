import type { User } from '../../types'
import { Avatar } from '../ui/Avatar'
import styles from './ContactCard.module.css'

interface ContactCardProps {
  user: User
  onMessage?: (user: User) => void
}

export function ContactCard({ user, onMessage }: ContactCardProps) {
  return (
    <div className={styles.card}>
      <Avatar name={user.display_name} size="sm" />
      <div className={styles.info}>
        <span className={styles.name}>{user.display_name}</span>
        <span className={styles.id}>{user.matrix_user_id}</span>
      </div>
      {onMessage && (
        <button className={styles.msgBtn} onClick={() => onMessage(user)}>
          Message
        </button>
      )}
    </div>
  )
}
