import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Settings</h2>

      {user && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Profile</h3>
          <div className={styles.profileCard}>
            <Avatar name={user.display_name} size="lg" />
            <div>
              <p className={styles.displayName}>{user.display_name}</p>
              <p className={styles.matrixId}>{user.matrix_user_id}</p>
              {user.is_admin && <span className={styles.adminBadge}>Admin</span>}
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Account</h3>
        <Button variant="danger" size="sm" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </div>
  )
}
