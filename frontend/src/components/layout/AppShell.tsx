import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useMatrixSync } from '../../hooks/useMatrixSync'
import styles from './AppShell.module.css'

export function AppShell() {
  useMatrixSync()

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
