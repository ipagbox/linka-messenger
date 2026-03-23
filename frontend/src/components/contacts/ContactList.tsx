import type { User } from '../../types'
import { ContactCard } from './ContactCard'
import styles from './ContactList.module.css'

interface ContactListProps {
  contacts: User[]
}

export function ContactList({ contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return <div className={styles.empty}>No contacts yet</div>
  }

  return (
    <div className={styles.list}>
      {contacts.map((contact) => (
        <ContactCard key={contact.id} user={contact} />
      ))}
    </div>
  )
}
