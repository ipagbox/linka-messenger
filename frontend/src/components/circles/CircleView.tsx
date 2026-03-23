import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useCircleStore } from '../../store/circleStore'
import { Avatar } from '../ui/Avatar'
import { ContactCard } from '../contacts/ContactCard'
import styles from './CircleView.module.css'

export function CircleView() {
  const { id } = useParams<{ id: string }>()
  const { circles, members, loadMembers } = useCircleStore()
  const circle = circles.find((c) => String(c.id) === id)
  const circleMembers = id ? members[parseInt(id)] || [] : []

  useEffect(() => {
    if (id) loadMembers(parseInt(id))
  }, [id, loadMembers])

  if (!circle) return <div className={styles.notFound}>Circle not found</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Avatar name={circle.name} size="lg" />
        <div>
          <h2 className={styles.name}>{circle.name}</h2>
          <p className={styles.meta}>{circle.member_count} / {circle.max_members} members</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Members</h3>
        <div className={styles.memberList}>
          {circleMembers.map((member) => (
            <ContactCard key={member.id} user={member} />
          ))}
        </div>
      </div>
    </div>
  )
}
