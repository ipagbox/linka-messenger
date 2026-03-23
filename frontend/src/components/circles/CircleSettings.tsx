import { useParams } from 'react-router-dom'
import { useCircleStore } from '../../store/circleStore'
import { InviteCreate } from './InviteCreate'
import styles from './CircleSettings.module.css'

export function CircleSettings() {
  const { id } = useParams<{ id: string }>()
  const { circles } = useCircleStore()
  const circle = circles.find((c) => String(c.id) === id)

  if (!circle) return null

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Circle Settings</h3>
      <div className={styles.section}>
        <p className={styles.label}>Invite Link</p>
        <InviteCreate circleId={circle.id} />
      </div>
    </div>
  )
}
