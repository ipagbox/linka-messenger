import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useCircleStore } from '../../store/circleStore'
import { Avatar } from '../ui/Avatar'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const { circles, activeCircleId, setActiveCircle } = useCircleStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>Linka</div>

      <nav className={styles.nav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Chats
        </NavLink>
        <NavLink to="/circles" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Circles
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          Settings
        </NavLink>
      </nav>

      {circles.length > 0 && (
        <div className={styles.circleList}>
          <p className={styles.sectionLabel}>Circles</p>
          {circles.map((circle) => (
            <button
              key={circle.id}
              className={`${styles.circleItem} ${activeCircleId === circle.id ? styles.active : ''}`}
              onClick={() => setActiveCircle(circle.id)}
            >
              <Avatar name={circle.name} size="sm" />
              <span className={styles.circleName}>{circle.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {user && (
          <div className={styles.userInfo}>
            <Avatar name={user.display_name} size="sm" />
            <span className={styles.userName}>{user.display_name}</span>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
