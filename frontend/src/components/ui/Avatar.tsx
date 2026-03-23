import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6']

function getColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const color = getColorForName(name)
  const initials = getInitials(name)

  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
