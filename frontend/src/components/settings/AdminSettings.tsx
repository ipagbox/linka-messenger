import { useEffect, useState } from 'react'
import { getServerSettings, updateServerSettings, getAdminUsers, deleteUser } from '../../api/settings'
import { Button } from '../ui/Button'
import styles from './AdminSettings.module.css'

interface Setting {
  key: string
  value: string
  description?: string
}

interface AdminUser {
  id: number
  matrix_user_id: string
  display_name: string
  is_admin: boolean
  created_at: string
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getServerSettings().then(setSettings).catch(console.error)
    getAdminUsers().then(setUsers).catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateServerSettings(editValues)
      setEditValues({})
      const updated = await getServerSettings()
      setSettings(updated)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Delete this user?')) return
    await deleteUser(userId)
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Server Settings</h3>
        {settings.map((s) => (
          <div key={s.key} className={styles.settingRow}>
            <div>
              <span className={styles.key}>{s.key}</span>
              {s.description && <p className={styles.desc}>{s.description}</p>}
            </div>
            <input
              className={styles.valueInput}
              defaultValue={s.value}
              onChange={(e) => setEditValues((prev) => ({ ...prev, [s.key]: e.target.value }))}
            />
          </div>
        ))}
        {Object.keys(editValues).length > 0 && (
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Users</h3>
        {users.map((user) => (
          <div key={user.id} className={styles.userRow}>
            <div>
              <span className={styles.userName}>{user.display_name}</span>
              <span className={styles.userId}>{user.matrix_user_id}</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
